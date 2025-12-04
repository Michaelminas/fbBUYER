import { prisma } from './prisma';
import { UAParser } from 'ua-parser-js';

export interface AnalyticsEventData {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  leadId?: string;
  pageUrl?: string;
  referrer?: string;
}

export interface ClientInfo {
  userAgent?: string;
  ipAddress?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export class Analytics {
  private static instance: Analytics;

  private constructor() {}

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  async track(eventData: AnalyticsEventData, clientInfo?: ClientInfo): Promise<void> {
    try {
      let deviceType: string | undefined;
      let browserName: string | undefined;

      if (clientInfo?.userAgent) {
        const parser = new UAParser(clientInfo.userAgent);
        const device = parser.getDevice();
        const browser = parser.getBrowser();
        
        deviceType = device.type || 'desktop';
        browserName = browser.name;
      }

      await prisma.analyticsEvent.create({
        data: {
          event: eventData.event,
          category: eventData.category,
          action: eventData.action,
          label: eventData.label,
          value: eventData.value,
          properties: eventData.properties ? JSON.stringify(eventData.properties) : null,
          userId: eventData.userId,
          sessionId: eventData.sessionId,
          leadId: eventData.leadId,
          userAgent: clientInfo?.userAgent,
          ipAddress: clientInfo?.ipAddress,
          referrer: eventData.referrer,
          pageUrl: eventData.pageUrl,
          deviceType,
          browserName,
          screenWidth: clientInfo?.screenWidth,
          screenHeight: clientInfo?.screenHeight,
        }
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Predefined tracking methods for common events
  async trackQuoteStarted(sessionId: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'quote_started',
      category: 'quote',
      action: 'started',
      sessionId
    }, clientInfo);
  }

  async trackQuoteCompleted(sessionId: string, leadId: string, quoteValue: number, clientInfo?: ClientInfo) {
    await this.track({
      event: 'quote_completed',
      category: 'quote',
      action: 'completed',
      value: quoteValue,
      sessionId,
      leadId
    }, clientInfo);
  }

  async trackLeadCreated(sessionId: string, leadId: string, sellMethod: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'lead_created',
      category: 'lead',
      action: 'created',
      label: sellMethod,
      sessionId,
      leadId,
      properties: { sellMethod }
    }, clientInfo);
  }

  async trackVerificationSent(leadId: string, email: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'verification_sent',
      category: 'verification',
      action: 'sent',
      leadId,
      properties: { email }
    }, clientInfo);
  }

  async trackVerificationCompleted(leadId: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'verification_completed',
      category: 'verification',
      action: 'completed',
      leadId
    }, clientInfo);
  }

  async trackSchedulingStarted(leadId: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'scheduling_started',
      category: 'scheduling',
      action: 'started',
      leadId
    }, clientInfo);
  }

  async trackSchedulingCompleted(leadId: string, appointmentId: string, isSameDay: boolean, clientInfo?: ClientInfo) {
    await this.track({
      event: 'scheduling_completed',
      category: 'scheduling',
      action: 'completed',
      leadId,
      properties: { appointmentId, isSameDay }
    }, clientInfo);
  }

  async trackPageView(page: string, sessionId: string, referrer?: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'page_view',
      category: 'navigation',
      action: 'viewed',
      label: page,
      sessionId,
      referrer,
      pageUrl: page
    }, clientInfo);
  }

  async trackFormInteraction(formName: string, action: string, sessionId: string, leadId?: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'form_interaction',
      category: 'form',
      action,
      label: formName,
      sessionId,
      leadId,
      properties: { formName }
    }, clientInfo);
  }

  async trackButtonClick(buttonName: string, page: string, sessionId: string, leadId?: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'button_click',
      category: 'interaction',
      action: 'clicked',
      label: buttonName,
      sessionId,
      leadId,
      properties: { page, buttonName }
    }, clientInfo);
  }

  async trackError(errorType: string, errorMessage: string, page?: string, sessionId?: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'error',
      category: 'error',
      action: errorType,
      label: errorMessage,
      sessionId,
      properties: { page, errorMessage }
    }, clientInfo);
  }

  async trackConversion(conversionType: string, value: number, leadId: string, clientInfo?: ClientInfo) {
    await this.track({
      event: 'conversion',
      category: 'conversion',
      action: conversionType,
      value,
      leadId,
      properties: { conversionType }
    }, clientInfo);
  }

  // Utility method to extract client info from Next.js request
  static extractClientInfo(req: Request, additionalInfo?: { screenWidth?: number; screenHeight?: number }): ClientInfo {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    
    let ipAddress = 'unknown';
    if (forwarded) {
      ipAddress = forwarded.split(',')[0].trim();
    } else if (realIP) {
      ipAddress = realIP;
    }

    return {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress,
      screenWidth: additionalInfo?.screenWidth,
      screenHeight: additionalInfo?.screenHeight
    };
  }

  // Get analytics metrics for admin dashboard
  async getMetrics(startDate?: Date, endDate?: Date) {
    const whereClause = {
      timestamp: {
        gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
        lte: endDate || new Date()
      }
    };

    const [
      totalEvents,
      uniqueVisitors,
      quotesStarted,
      quotesCompleted,
      leadsCreated,
      verificationsCompleted,
      schedulingsCompleted,
      conversions,
      topPages,
      deviceBreakdown,
      hourlyActivity
    ] = await Promise.all([
      // Total events
      prisma.analyticsEvent.count({ where: whereClause }),

      // Unique visitors (by session)
      prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { ...whereClause, sessionId: { not: null } },
        _count: { sessionId: true }
      }).then(result => result.length),

      // Funnel metrics
      prisma.analyticsEvent.count({ where: { ...whereClause, event: 'quote_started' } }),
      prisma.analyticsEvent.count({ where: { ...whereClause, event: 'quote_completed' } }),
      prisma.analyticsEvent.count({ where: { ...whereClause, event: 'lead_created' } }),
      prisma.analyticsEvent.count({ where: { ...whereClause, event: 'verification_completed' } }),
      prisma.analyticsEvent.count({ where: { ...whereClause, event: 'scheduling_completed' } }),
      prisma.analyticsEvent.count({ where: { ...whereClause, event: 'conversion' } }),

      // Top pages
      prisma.analyticsEvent.groupBy({
        by: ['pageUrl'],
        where: { ...whereClause, event: 'page_view', pageUrl: { not: null } },
        _count: { pageUrl: true },
        orderBy: { _count: { pageUrl: 'desc' } },
        take: 10
      }),

      // Device breakdown
      prisma.analyticsEvent.groupBy({
        by: ['deviceType'],
        where: { ...whereClause, deviceType: { not: null } },
        _count: { deviceType: true }
      }),

      // Hourly activity
      prisma.$queryRaw`
        SELECT EXTRACT(hour FROM timestamp) as hour, COUNT(*) as count
        FROM analytics_event
        WHERE timestamp >= ${startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        AND timestamp <= ${endDate || new Date()}
        GROUP BY EXTRACT(hour FROM timestamp)
        ORDER BY hour
      `
    ]);

    return {
      overview: {
        totalEvents,
        uniqueVisitors,
        conversions
      },
      funnel: {
        quotesStarted,
        quotesCompleted,
        leadsCreated,
        verificationsCompleted,
        schedulingsCompleted,
        conversionRates: {
          quoteToLead: quotesCompleted > 0 ? (leadsCreated / quotesCompleted) * 100 : 0,
          leadToVerification: leadsCreated > 0 ? (verificationsCompleted / leadsCreated) * 100 : 0,
          verificationToScheduling: verificationsCompleted > 0 ? (schedulingsCompleted / verificationsCompleted) * 100 : 0
        }
      },
      insights: {
        topPages: topPages.map(p => ({ page: p.pageUrl, views: p._count.pageUrl })),
        deviceBreakdown: deviceBreakdown.map(d => ({ device: d.deviceType, count: d._count.deviceType })),
        hourlyActivity
      }
    };
  }
}

// Singleton instance
export const analytics = Analytics.getInstance();