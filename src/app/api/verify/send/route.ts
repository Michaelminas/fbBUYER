import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Get lead with quote and device info
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        quote: {
          include: {
            device: true
          }
        },
        verification: true
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.isVerified) {
      return NextResponse.json({ error: 'Lead already verified' }, { status: 400 });
    }

    const verification = lead.verification;
    if (!verification) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }

    // Check if token is still valid
    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification token expired' }, { status: 400 });
    }

    if (verification.isUsed) {
      return NextResponse.json({ error: 'Verification token already used' }, { status: 400 });
    }

    const quote = lead.quote;
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Generate verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify?token=${verification.token}`;

    // Send verification email
    try {
      if (!resend) {
        console.warn('Resend API key not configured, skipping email send');
        // In development, just log the verification URL
        console.log(`Verification URL: ${verificationUrl}`);
        return NextResponse.json({ 
          message: 'Verification email sent successfully',
          verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
        });
      }

      await resend.emails.send({
        from: 'SellPhones.sydney <verify@sellphones.sydney>',
        to: lead.email,
        subject: `Confirm your iPhone quote — valid for 7 days`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Confirm Your iPhone Quote</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #1f2937; margin: 0;">SellPhones.sydney</h1>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Cash For Phones Today</p>
              </div>
              
              <h2 style="color: #1f2937;">Confirm Your iPhone Quote</h2>
              
              <p>Hi${lead.firstName ? ` ${lead.firstName}` : ''},</p>
              
              <p>Thanks for getting a quote! Here's your instant quote summary:</p>
              
              <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">
                    $${quote.finalQuote}
                  </div>
                  <p style="margin: 5px 0; color: #6b7280;">
                    ${quote.device.model} ${quote.device.storage}GB
                  </p>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                    Valid until ${quote.expiresAt.toLocaleDateString('en-AU', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}, 11:59pm
                  </p>
                  ${lead.sellMethod === 'pickup' && quote.pickupFee !== null ? `
                    <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                      ${quote.pickupFee === 0 ? 'Free pickup' : `Pickup fee: $${quote.pickupFee}`}
                    </p>
                  ` : ''}
                  <p style="margin: 10px 0 5px 0; color: #9ca3af; font-size: 12px;">
                    Subject to inspection
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                  Confirm Quote & Schedule
                </a>
              </div>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">What happens next?</h3>
                <ol style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
                  <li>Click the button above to confirm your quote</li>
                  <li>Choose a convenient pickup time (12:00–20:00)</li>
                  <li>We'll inspect your device and pay on the spot</li>
                </ol>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
                <p><strong>Questions?</strong> Reply to this email or call us at <a href="tel:+61415957027">+61 415 957 027</a></p>
                <p><strong>WhatsApp:</strong> <a href="https://wa.me/61415957027">+61 415 957 027</a></p>
                <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                  SellPhones.sydney<br>
                  Penrith Area, NSW
                </p>
              </div>
            </body>
          </html>
        `
      });

      // Log analytics
      await prisma.analyticsEvent.create({
        data: {
          event: 'verification_email_sent',
          userId: lead.id,
          properties: JSON.stringify({ email: lead.email })
        }
      });

      return NextResponse.json({ message: 'Verification email sent successfully' });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}