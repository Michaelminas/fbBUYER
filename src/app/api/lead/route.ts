import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LeadRequest {
  name: string;
  phone: string;
  email: string;
  suburb: string;
  model: string;
  storage: string;
  damages: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadRequest = await request.json();
    const { name, phone, email, suburb, model, storage, damages } = body;

    // Basic validation
    if (!name || !phone || !email || !suburb || !model || !storage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email notification to you
    const damagesList = damages.length > 0
      ? damages.join(', ')
      : 'None reported';

    await resend.emails.send({
      from: 'Cash For Phones <noreply@sellphones.sydney>',
      to: 'mikeminas0@gmail.com',
      subject: `🔔 NEW LEAD: ${name} - ${model} ${storage}GB - ${suburb}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                🔔 New Quote Request
              </h1>
              <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 14px;">
                Submitted ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">

              <!-- Priority Banner -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-weight: 600;">
                  ⚡ Action Required: Call within 24 hours
                </p>
              </div>

              <!-- Customer Contact -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  📞 Customer Contact
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 100px;">Name:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Phone:</td>
                    <td style="padding: 8px 0;">
                      <a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
                        ${phone}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                    <td style="padding: 8px 0;">
                      <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">
                        ${email}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Suburb:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${suburb}</td>
                  </tr>
                </table>
              </div>

              <!-- Device Details -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #bfdbfe; padding-bottom: 10px;">
                  📱 Device Information
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; font-weight: 500; width: 100px;">Model:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 16px;">${model}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Storage:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${storage}GB</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; font-weight: 500; vertical-align: top;">Issues:</td>
                    <td style="padding: 8px 0; color: #111827;">
                      ${damages.length > 0
                        ? `<span style="color: #dc2626; font-weight: 600;">${damagesList}</span>`
                        : `<span style="color: #16a34a; font-weight: 600;">✓ None reported - Good condition</span>`
                      }
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Quick Actions -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="tel:${phone}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 5px;">
                  📞 Call Now
                </a>
                <a href="sms:${phone}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 5px;">
                  💬 Send SMS
                </a>
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Cash For Phones Sydney | SellPhones.sydney
              </p>
            </div>

          </div>
        </body>
        </html>
      `
    });

    // Send confirmation email to customer
    await resend.emails.send({
      from: 'Cash For Phones <noreply@sellphones.sydney>',
      to: email,
      subject: `✅ Quote Request Received - We'll Call You Soon!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <div style="background-color: #ffffff; width: 60px; height: 60px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">
                ✅
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                Request Received!
              </h1>
              <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 14px;">
                Thanks ${name}, we'll be in touch soon
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">

              <!-- Main Message -->
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #111827; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">
                  We've received your quote request!
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
                  Our team will call you within <strong>24 hours</strong> with a competitive quote for your iPhone.
                </p>
              </div>

              <!-- Device Summary -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 16px; text-align: center;">
                  📱 Your Submission Summary
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Model:</td>
                    <td style="padding: 12px 0; color: #111827; font-weight: 600; text-align: right;">${model}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Storage:</td>
                    <td style="padding: 12px 0; color: #111827; font-weight: 600; text-align: right;">${storage}GB</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Condition:</td>
                    <td style="padding: 12px 0; text-align: right;">
                      ${damages.length > 0
                        ? `<span style="color: #dc2626; font-size: 13px;">${damagesList}</span>`
                        : `<span style="color: #16a34a; font-weight: 600;">Good</span>`
                      }
                    </td>
                  </tr>
                </table>
              </div>

              <!-- What Happens Next -->
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">
                  📞 What Happens Next?
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Our team reviews your device details</li>
                  <li style="margin-bottom: 8px;"><strong>We call you within 24 hours</strong> with a competitive quote</li>
                  <li style="margin-bottom: 8px;">Accept the quote and we arrange pickup or drop-off</li>
                  <li>Get paid instantly via cash, bank transfer, or PayID</li>
                </ol>
              </div>

              <!-- Contact Info -->
              <div style="text-align: center; padding: 20px; background-color: #fafafa; border-radius: 8px;">
                <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
                  Questions? We're here to help!
                </p>
                <a href="tel:+61415957027" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 5px;">
                  📞 Call Us: 0415 957 027
                </a>
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #111827; font-weight: 600; font-size: 14px;">
                Cash For Phones Sydney
              </p>
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">
                Fast, Fair, and Professional Service
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                SellPhones.sydney | 0415 957 027
              </p>
            </div>

          </div>
        </body>
        </html>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Lead submitted successfully'
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit lead' },
      { status: 500 }
    );
  }
}
