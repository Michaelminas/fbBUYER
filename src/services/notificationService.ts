// Database-backed notification service with Twilio SMS and Resend Email
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { Twilio } from 'twilio';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email';
  trigger: 'quote_received' | 'email_verified' | 'appointment_scheduled' | 'appointment_reminder' | 'driver_enroute' | 'pickup_completed' | 'follow_up';
  subject?: string;
  message: string;
  timing?: {
    delay?: number; // minutes after trigger
    schedule?: string; // cron-like schedule
  };
  isActive: boolean;
}

export interface ContactPreferences {
  leadId: string;
  preferredMethod: 'sms' | 'email';
  allowMarketing: boolean;
  allowReminders: boolean;
  allowUpdates: boolean;
  timezone: string;
}

export class NotificationService {
  private static resend: Resend | null = null;
  private static twilio: Twilio | null = null;
  
  // Business contact details
  private static readonly BUSINESS_PHONE = '+61415957027';
  private static readonly BUSINESS_NAME = 'SellPhones.sydney';
  private static readonly FROM_EMAIL = 'noreply@sellphones.sydney';
  private static readonly REPLY_TO_EMAIL = 'support@sellphones.sydney';

  static initialize(): void {
    // Initialize Resend for email
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.warn('RESEND_API_KEY not found - email notifications will be logged only');
    }

    // Initialize Twilio for SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilio = new Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } else {
      console.warn('Twilio credentials not found - SMS notifications will be logged only');
    }

    // Initialize default templates in database
    this.initializeDefaultTemplates();
  }

  private static getDefaultTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'quote_received_sms',
        name: 'Quote Received',
        type: 'sms',
        trigger: 'quote_received',
        subject: undefined,
        message: `Hi {customerName}! Your iPhone quote is ready: {deviceModel} - {quote}\n\nClick to verify: {verificationLink}\n\nValid for 7 days. Questions? Text us back!`,
        isActive: true
      },
      {
        id: 'quote_received_email',
        name: 'Quote Received Email',
        type: 'email',
        trigger: 'quote_received',
        subject: 'Your iPhone Quote is Ready - Valid for 7 Days',
        message: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hi {customerName}!</h2>
  <p>Your iPhone quote is ready and waiting for you.</p>
  
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 10px 0; color: #1f2937;">Quote Details</h3>
    <p style="margin: 5px 0;"><strong>Device:</strong> {deviceModel}</p>
    <p style="margin: 5px 0;"><strong>Quote:</strong> <span style="color: #059669; font-size: 1.2em; font-weight: bold;">{quote}</span></p>
    <p style="margin: 5px 0; color: #6b7280; font-size: 0.9em;">Valid until {expiryDate}, 11:59 PM</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{verificationLink}" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email & Schedule Pickup</a>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 0.9em;">
    <p><strong>What happens next?</strong></p>
    <ol>
      <li>Click the button above to verify your email</li>
      <li>Schedule a convenient pickup time</li>
      <li>Our team inspects your device</li>
      <li>Get paid instantly upon completion</li>
    </ol>
    
    <p style="margin-top: 20px;"><strong>Questions?</strong> Reply to this email or text us at <a href="tel:+61415957027">+61 415 957 027</a></p>
  </div>
</div>`,
        isActive: true
      },
      {
        id: 'email_verified_sms',
        name: 'Email Verified',
        type: 'sms',
        trigger: 'email_verified',
        subject: undefined,
        message: `🎉 Thanks {customerName}! Your quote for {deviceModel} ({quote}) is verified.\n\n📅 Ready to schedule? Click: {schedulingLink}\n\n📞 Questions? Text us!`,
        isActive: true
      },
      {
        id: 'appointment_scheduled_sms',
        name: 'Appointment Scheduled',
        type: 'sms',
        trigger: 'appointment_scheduled',
        subject: undefined,
        message: `✅ Appointment Confirmed!\n\n📅 {appointmentDate} at {appointmentTime}\n📍 {serviceType}\n📱 {deviceModel} - {quote}\n\nWe'll remind you 2 hours before. Save this number for updates!`,
        isActive: true
      },
      {
        id: 'appointment_scheduled_email',
        name: 'Appointment Scheduled Email',
        type: 'email',
        trigger: 'appointment_scheduled',
        subject: 'Appointment Confirmed - {appointmentDate} at {appointmentTime}',
        message: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>✅ Appointment Confirmed!</h2>
  <p>Hi {customerName}, your appointment has been successfully scheduled.</p>
  
  <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 15px 0; color: #059669;">Appointment Details</h3>
    <p style="margin: 5px 0;"><strong>Date & Time:</strong> {appointmentDate} at {appointmentTime}</p>
    <p style="margin: 5px 0;"><strong>Service Type:</strong> {serviceType}</p>
    <p style="margin: 5px 0;"><strong>Device:</strong> {deviceModel}</p>
    <p style="margin: 5px 0;"><strong>Expected Quote:</strong> {quote}</p>
    {address}
  </div>

  <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h4 style="margin: 0 0 10px 0; color: #92400e;">What to Prepare</h4>
    <ul style="margin: 0; padding-left: 20px;">
      <li>Have your device ready and accessible</li>
      <li>Bring original box and accessories if available</li>
      <li>Ensure device is charged enough to power on</li>
      <li>Someone should be available at the pickup location</li>
    </ul>
  </div>

  <p><strong>Reminders:</strong> We'll send you a reminder 2 hours before your appointment.</p>
  
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 0.9em;">
    <p><strong>Need to reschedule or have questions?</strong></p>
    <p>Reply to this email or text us at <a href="tel:+61415957027">+61 415 957 027</a></p>
  </div>
</div>`,
        isActive: true
      },
      {
        id: 'appointment_reminder_sms',
        name: 'Appointment Reminder',
        type: 'sms',
        trigger: 'appointment_reminder',
        subject: undefined,
        message: `⏰ Reminder: Your appointment is in 2 hours!\n\n📅 {appointmentDate} at {appointmentTime}\n📱 {deviceModel} inspection\n💰 Expected quote: {quote}\n\n✅ Have your device ready\n📦 Bring box/accessories if available`,
        isActive: true
      },
      {
        id: 'driver_enroute_sms',
        name: 'Driver En Route',
        type: 'sms',
        trigger: 'driver_enroute',
        subject: undefined,
        message: `🚗 Our driver is on the way!\n\n📍 ETA: {eta}\n👤 Driver: {driverName}\n📞 Contact: {driverPhone}\n\nPlease be available - we'll text when we arrive!`,
        isActive: true
      },
      {
        id: 'pickup_completed_sms',
        name: 'Pickup Completed',
        type: 'sms',
        trigger: 'pickup_completed',
        subject: undefined,
        message: `✅ Pickup Complete!\n\n💰 Final payment: {finalAmount}\n📱 Device: {deviceModel}\n💳 Payment sent via {paymentMethod}\n📧 Receipt emailed\n\nThanks for choosing SellPhones.sydney! 🌟`,
        isActive: true
      },
      {
        id: 'pickup_completed_email',
        name: 'Pickup Completed Email Receipt',
        type: 'email',
        trigger: 'pickup_completed',
        subject: 'Payment Complete - Receipt for {deviceModel}',
        message: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>✅ Transaction Complete!</h2>
  <p>Hi {customerName}, thank you for selling your device with us.</p>
  
  <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 15px 0; color: #059669;">Receipt Details</h3>
    <p style="margin: 5px 0;"><strong>Device:</strong> {deviceModel}</p>
    <p style="margin: 5px 0;"><strong>Final Payment:</strong> <span style="color: #059669; font-size: 1.2em; font-weight: bold;">{finalAmount}</span></p>
    <p style="margin: 5px 0;"><strong>Payment Method:</strong> {paymentMethod}</p>
    <p style="margin: 5px 0;"><strong>Date:</strong> {transactionDate}</p>
    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> {transactionId}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <p>🌟 Had a great experience? We'd love to hear about it!</p>
    <a href="{reviewLink}" style="background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 10px;">Leave a Review</a>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 0.9em;">
    <p><strong>Have another device to sell?</strong> Get an instant quote at <a href="{websiteLink}">sellphones.sydney</a></p>
    <p><strong>Questions?</strong> Reply to this email or text us at <a href="tel:+61415957027">+61 415 957 027</a></p>
  </div>
</div>`,
        isActive: true
      }
    ];
  }

  private static async initializeDefaultTemplates(): Promise<void> {
    // TODO: Implement database template storage
    // For now, templates are hardcoded in-memory
    console.log('📧 Initialized notification templates (in-memory)');
  }

  static async sendNotification(
    leadId: string,
    templateId: string,
    variables: Record<string, string> = {}
  ): Promise<{ success: boolean; message: string; logId?: string }> {
    try {
      // For now, use hardcoded templates (TODO: implement database lookup)
      const defaultTemplates = this.getDefaultTemplates();
      const template = defaultTemplates.find(t => t.id === templateId);
      
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      if (!template.isActive) {
        return { success: false, message: 'Template is inactive' };
      }

      // Get lead details for recipient info
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return { success: false, message: 'Lead not found' };
      }

      // Determine recipient
      const recipient = template.type === 'email' ? lead.email : lead.phoneNumber;
      if (!recipient) {
        return { success: false, message: `No ${template.type === 'email' ? 'email' : 'phone number'} for lead` };
      }

      // Replace variables in message and subject
      let message = template.message;
      let subject = template.subject || '';
      
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
        subject = subject.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      // Create notification log
      const notificationLog = await prisma.notificationLog.create({
        data: {
          type: template.type,
          recipient: recipient,
          subject: template.type === 'email' ? subject : null,
          content: message,
          status: 'pending',
          metadata: JSON.stringify({
            templateId,
            leadId,
            variables
          })
        }
      });

      // Send notification based on type
      let success = false;
      let errorMessage = '';

      try {
        if (template.type === 'email') {
          await this.sendEmail(recipient, subject, message, lead.firstName || undefined);
          success = true;
        } else if (template.type === 'sms') {
          await this.sendSMS(recipient, message);
          success = true;
        }
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }

      // Update notification log
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: success ? 'sent' : 'failed',
          errorMessage: success ? null : errorMessage
        }
      });

      if (success) {
        console.log(`📨 NOTIFICATION SENT:`, {
          type: template.type.toUpperCase(),
          to: recipient,
          template: template.name,
          leadId
        });

        return { success: true, message: 'Notification sent successfully', logId: notificationLog.id };
      } else {
        console.error(`❌ NOTIFICATION FAILED:`, {
          type: template.type.toUpperCase(),
          to: recipient,
          error: errorMessage,
          leadId
        });

        return { success: false, message: `Failed to send: ${errorMessage}` };
      }

    } catch (error) {
      console.error('Notification service error:', error);
      return { success: false, message: 'Internal notification service error' };
    }
  }

  private static async sendEmail(email: string, subject: string, htmlContent: string, firstName?: string): Promise<void> {
    if (!this.resend) {
      console.log(`📧 EMAIL TO ${email}:`, { subject, content: htmlContent });
      return;
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.BUSINESS_NAME} <${this.FROM_EMAIL}>`,
        to: [email],
        subject: subject,
        html: htmlContent,
        replyTo: this.REPLY_TO_EMAIL,
        headers: {
          'X-Entity-Ref-ID': `lead-${Date.now()}`,
        }
      });

      console.log('Email sent successfully:', result.data?.id);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  private static async sendSMS(phone: string, message: string): Promise<void> {
    // Clean phone number (remove spaces, add +61 if needed)
    let cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+61' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }

    if (!this.twilio) {
      console.log(`📱 SMS TO ${cleanPhone}:`, message);
      return;
    }

    try {
      const result = await this.twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER || this.BUSINESS_PHONE,
        to: cleanPhone
      });

      console.log('SMS sent successfully:', result.sid);
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  static async scheduleNotification(
    leadId: string,
    templateId: string,
    scheduledFor: Date,
    variables: Record<string, string> = {}
  ): Promise<{ success: boolean; message: string }> {
    
    const delay = scheduledFor.getTime() - Date.now();
    
    if (delay <= 0) {
      return { success: false, message: 'Scheduled time must be in the future' };
    }

    // In production, you'd use a proper job queue like Bull/Redis or AWS SQS
    // For now, we'll use setTimeout for short delays (< 1 hour) and log others
    if (delay < 60 * 60 * 1000) { // Less than 1 hour
      setTimeout(() => {
        this.sendNotification(leadId, templateId, variables);
      }, delay);

      console.log(`⏰ NOTIFICATION SCHEDULED:`, {
        leadId,
        templateId,
        scheduledFor: scheduledFor.toLocaleString('en-AU'),
        delayMinutes: Math.round(delay / 60000)
      });

      return { success: true, message: 'Notification scheduled successfully' };
    } else {
      // For longer delays, you'd typically use a job queue or cron job
      console.warn(`⏰ LONG DELAY NOTIFICATION (${Math.round(delay / 60000)} minutes) - implement job queue:`, {
        leadId,
        templateId,
        scheduledFor: scheduledFor.toLocaleString('en-AU')
      });

      return { success: true, message: 'Long delay notification logged - implement job queue for production' };
    }
  }

  static async getNotificationHistory(leadId: string) {
    try {
      return await prisma.notificationLog.findMany({
        where: {
          metadata: {
            contains: leadId // JSON search for leadId in metadata
          }
        },
        orderBy: {
          sentAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  static async getNotificationStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const [total, last24Hours, byStatus, byType] = await Promise.all([
        prisma.notificationLog.count(),
        
        prisma.notificationLog.count({
          where: {
            sentAt: { gte: yesterday }
          }
        }),

        prisma.notificationLog.groupBy({
          by: ['status'],
          _count: { status: true }
        }),

        prisma.notificationLog.groupBy({
          by: ['type'],
          _count: { type: true }
        })
      ]);

      const statusStats = byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      const typeStats = byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>);

      const deliveryRate = total > 0 ? Math.round(((statusStats.sent || 0) + (statusStats.delivered || 0)) / total * 100) : 0;
      const failureRate = total > 0 ? Math.round((statusStats.failed || 0) / total * 100) : 0;

      return {
        total,
        last24Hours,
        byStatus: statusStats,
        byType: typeStats,
        deliveryRate,
        failureRate
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        total: 0,
        last24Hours: 0,
        byStatus: {},
        byType: {},
        deliveryRate: 0,
        failureRate: 0
      };
    }
  }

  // Helper methods for common notification triggers
  static async triggerQuoteReceived(leadId: string, variables: {
    customerName: string;
    deviceModel: string;
    quote: string;
    verificationLink: string;
    expiryDate: string;
  }) {
    // Send both SMS and email
    const smsResult = await this.sendNotification(leadId, 'quote_received_sms', variables);
    const emailResult = await this.sendNotification(leadId, 'quote_received_email', variables);
    
    return {
      sms: smsResult,
      email: emailResult
    };
  }

  static async triggerEmailVerified(leadId: string, variables: {
    customerName: string;
    deviceModel: string;
    quote: string;
    schedulingLink: string;
  }) {
    return await this.sendNotification(leadId, 'email_verified_sms', variables);
  }

  static async triggerAppointmentScheduled(leadId: string, variables: {
    customerName: string;
    deviceModel: string;
    quote: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceType: string;
    address?: string;
  }) {
    // Send both SMS and email confirmation
    const smsResult = await this.sendNotification(leadId, 'appointment_scheduled_sms', variables);
    const emailResult = await this.sendNotification(leadId, 'appointment_scheduled_email', {
      ...variables,
      address: variables.address ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${variables.address}</p>` : ''
    });
    
    return {
      sms: smsResult,
      email: emailResult
    };
  }

  static async triggerAppointmentReminder(leadId: string, variables: {
    customerName: string;
    deviceModel: string;
    quote: string;
    appointmentDate: string;
    appointmentTime: string;
  }) {
    return await this.sendNotification(leadId, 'appointment_reminder_sms', variables);
  }

  static async triggerDriverEnRoute(leadId: string, variables: {
    eta: string;
    driverName: string;
    driverPhone: string;
  }) {
    return await this.sendNotification(leadId, 'driver_enroute_sms', variables);
  }

  static async triggerPickupCompleted(leadId: string, variables: {
    customerName: string;
    deviceModel: string;
    finalAmount: string;
    paymentMethod: string;
    transactionDate: string;
    transactionId: string;
    reviewLink: string;
    websiteLink: string;
  }) {
    // Send both SMS and email receipt
    const smsResult = await this.sendNotification(leadId, 'pickup_completed_sms', variables);
    const emailResult = await this.sendNotification(leadId, 'pickup_completed_email', variables);
    
    return {
      sms: smsResult,
      email: emailResult
    };
  }
}

// Initialize the service
NotificationService.initialize();