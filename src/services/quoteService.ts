import { prisma } from '@/lib/prisma';
import { analytics } from '@/lib/analytics';

export interface QuoteExpirationResult {
  expired: number;
  nearExpiry: number;
  total: number;
}

export interface LeadScore {
  leadId: string;
  score: number;
  factors: {
    quoteValue: number;
    responseSpeed: number;
    engagement: number;
    verificationStatus: number;
    deviceTier: number;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendations: string[];
}

export class QuoteService {
  
  /**
   * Check and handle quote expirations
   */
  static async handleQuoteExpirations(): Promise<QuoteExpirationResult> {
    const now = new Date();
    const nearExpiryThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    try {
      // Find expired quotes
      const expiredQuotes = await prisma.quote.findMany({
        where: {
          expiresAt: { lt: now },
          isExpired: false
        },
        include: {
          lead: true,
          device: true
        }
      });

      // Find quotes expiring soon
      const nearExpiryQuotes = await prisma.quote.findMany({
        where: {
          expiresAt: { 
            gte: now,
            lte: nearExpiryThreshold 
          },
          isExpired: false
        },
        include: {
          lead: true
        }
      });

      // Mark expired quotes
      if (expiredQuotes.length > 0) {
        await prisma.quote.updateMany({
          where: {
            id: { in: expiredQuotes.map(q => q.id) }
          },
          data: { isExpired: true }
        });

        // Track expiration events
        for (const quote of expiredQuotes) {
          await analytics.track({
            event: 'quote_expired',
            category: 'quote',
            action: 'expired',
            value: quote.finalQuote,
            leadId: quote.leadId,
            properties: {
              quoteAge: Math.floor((now.getTime() - quote.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
              finalQuote: quote.finalQuote,
              deviceModel: quote.device.model,
              wasVerified: quote.lead.isVerified
            }
          });
        }
      }

      // Send near-expiry notifications (would integrate with notification service)
      for (const quote of nearExpiryQuotes) {
        await this.sendExpiryWarning(quote);
      }

      const totalActiveQuotes = await prisma.quote.count({
        where: { isExpired: false }
      });

      return {
        expired: expiredQuotes.length,
        nearExpiry: nearExpiryQuotes.length,
        total: totalActiveQuotes
      };
    } catch (error) {
      console.error('Error handling quote expirations:', error);
      throw error;
    }
  }

  /**
   * Send expiry warning to user
   */
  private static async sendExpiryWarning(quote: any) {
    try {
      // Track the warning event
      await analytics.track({
        event: 'quote_expiry_warning',
        category: 'notification',
        action: 'sent',
        leadId: quote.leadId,
        properties: {
          hoursUntilExpiry: Math.floor((quote.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)),
          finalQuote: quote.finalQuote
        }
      });

      // TODO: Integrate with notification service to send email/SMS
      console.log(`Expiry warning for quote ${quote.id} to ${quote.lead.email}`);
    } catch (error) {
      console.error('Error sending expiry warning:', error);
    }
  }

  /**
   * Renew an expired quote with updated pricing
   */
  static async renewQuote(quoteId: string): Promise<{ success: boolean; newQuote?: any; error?: string }> {
    try {
      const existingQuote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { device: true, lead: true }
      });

      if (!existingQuote) {
        return { success: false, error: 'Quote not found' };
      }

      if (!existingQuote.isExpired) {
        return { success: false, error: 'Quote is still valid' };
      }

      // Create new quote with extended expiry (7 days from now)
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 7);

      const renewedQuote = await prisma.quote.create({
        data: {
          leadId: existingQuote.leadId,
          deviceId: existingQuote.deviceId,
          damages: existingQuote.damages,
          hasBox: existingQuote.hasBox,
          hasCharger: existingQuote.hasCharger,
          isActivationLocked: existingQuote.isActivationLocked,
          basePrice: existingQuote.basePrice,
          damageDeduction: existingQuote.damageDeduction,
          margin: existingQuote.margin,
          finalQuote: existingQuote.finalQuote, // Could recalculate with current pricing
          pickupFee: existingQuote.pickupFee,
          expiresAt: newExpiryDate
        }
      });

      // Track renewal
      await analytics.track({
        event: 'quote_renewed',
        category: 'quote',
        action: 'renewed',
        value: renewedQuote.finalQuote,
        leadId: renewedQuote.leadId,
        properties: {
          originalQuoteId: quoteId,
          newQuoteId: renewedQuote.id,
          daysSinceExpiry: Math.floor((Date.now() - existingQuote.expiresAt.getTime()) / (1000 * 60 * 60 * 24))
        }
      });

      return { success: true, newQuote: renewedQuote };
    } catch (error) {
      console.error('Error renewing quote:', error);
      return { success: false, error: 'Failed to renew quote' };
    }
  }

  /**
   * Calculate lead score based on multiple factors
   */
  static async calculateLeadScore(leadId: string): Promise<LeadScore> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          quote: { include: { device: true } },
          verification: true,
          appointment: true
        }
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      const score = {
        leadId,
        score: 0,
        factors: {
          quoteValue: 0,
          responseSpeed: 0,
          engagement: 0,
          verificationStatus: 0,
          deviceTier: 0
        },
        priority: 'low' as 'low' | 'medium' | 'high' | 'urgent',
        recommendations: [] as string[]
      };

      // Factor 1: Quote Value (0-30 points)
      if (lead.quote) {
        const quoteValue = lead.quote.finalQuote;
        if (quoteValue >= 800) {
          score.factors.quoteValue = 30;
        } else if (quoteValue >= 500) {
          score.factors.quoteValue = 20;
        } else if (quoteValue >= 200) {
          score.factors.quoteValue = 10;
        } else {
          score.factors.quoteValue = 5;
        }
      }

      // Factor 2: Response Speed (0-25 points)
      if (lead.verification) {
        const responseTime = lead.verification.createdAt.getTime() - lead.createdAt.getTime();
        const responseHours = responseTime / (1000 * 60 * 60);
        
        if (responseHours <= 1) {
          score.factors.responseSpeed = 25;
        } else if (responseHours <= 6) {
          score.factors.responseSpeed = 20;
        } else if (responseHours <= 24) {
          score.factors.responseSpeed = 15;
        } else {
          score.factors.responseSpeed = 5;
        }
      }

      // Factor 3: Engagement Level (0-20 points)
      const analyticsEvents = await prisma.analyticsEvent.count({
        where: {
          leadId,
          category: { in: ['quote', 'form', 'interaction'] }
        }
      });

      if (analyticsEvents >= 15) {
        score.factors.engagement = 20;
      } else if (analyticsEvents >= 10) {
        score.factors.engagement = 15;
      } else if (analyticsEvents >= 5) {
        score.factors.engagement = 10;
      } else {
        score.factors.engagement = 5;
      }

      // Factor 4: Verification Status (0-15 points)
      if (lead.isVerified) {
        score.factors.verificationStatus = 15;
        if (lead.appointment) {
          score.factors.verificationStatus += 5; // Bonus for scheduling
        }
      }

      // Factor 5: Device Tier (0-10 points)
      if (lead.quote?.device) {
        const deviceModel = lead.quote.device.model.toLowerCase();
        if (deviceModel.includes('pro max')) {
          score.factors.deviceTier = 10;
        } else if (deviceModel.includes('pro')) {
          score.factors.deviceTier = 8;
        } else if (deviceModel.includes('15') || deviceModel.includes('14')) {
          score.factors.deviceTier = 6;
        } else {
          score.factors.deviceTier = 3;
        }
      }

      // Calculate total score
      score.score = Object.values(score.factors).reduce((sum, value) => sum + value, 0);

      // Determine priority
      if (score.score >= 80) {
        score.priority = 'urgent';
      } else if (score.score >= 60) {
        score.priority = 'high';
      } else if (score.score >= 40) {
        score.priority = 'medium';
      } else {
        score.priority = 'low';
      }

      // Generate recommendations
      if (!lead.isVerified) {
        score.recommendations.push('Send verification reminder');
      }
      if (lead.isVerified && !lead.appointment) {
        score.recommendations.push('Encourage appointment scheduling');
      }
      if (score.factors.quoteValue >= 20 && !lead.appointment) {
        score.recommendations.push('High-value lead - prioritize contact');
      }
      if (lead.quote && this.isQuoteExpiringSoon(lead.quote.expiresAt)) {
        score.recommendations.push('Quote expiring soon - follow up urgently');
      }

      return score;
    } catch (error) {
      console.error('Error calculating lead score:', error);
      throw error;
    }
  }

  /**
   * Get leads prioritized by score
   */
  static async getPrioritizedLeads(limit: number = 50): Promise<LeadScore[]> {
    try {
      const leads = await prisma.lead.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      const scoredLeads = await Promise.all(
        leads.map(lead => this.calculateLeadScore(lead.id))
      );

      // Sort by score (highest first)
      return scoredLeads.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting prioritized leads:', error);
      throw error;
    }
  }

  /**
   * Check if quote is expiring soon
   */
  private static isQuoteExpiringSoon(expiryDate: Date): boolean {
    const now = new Date();
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  }

  /**
   * Get quote expiration statistics
   */
  static async getExpirationStats(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalQuotes, expiredQuotes, convertedQuotes] = await Promise.all([
        prisma.quote.count({
          where: { createdAt: { gte: startDate } }
        }),
        prisma.quote.count({
          where: {
            createdAt: { gte: startDate },
            isExpired: true
          }
        }),
        prisma.appointment.count({
          where: {
            createdAt: { gte: startDate },
            status: { in: ['completed', 'confirmed'] }
          }
        })
      ]);

      const expirationRate = totalQuotes > 0 ? (expiredQuotes / totalQuotes) * 100 : 0;
      const conversionRate = totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0;

      return {
        totalQuotes,
        expiredQuotes,
        convertedQuotes,
        expirationRate: Math.round(expirationRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        period: `${days} days`
      };
    } catch (error) {
      console.error('Error getting expiration stats:', error);
      throw error;
    }
  }
}