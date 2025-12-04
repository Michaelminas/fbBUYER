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
      subject: `New Lead: ${name} - ${model} ${storage}GB`,
      html: `
        <h2>New iPhone Quote Request</h2>
        <p>A customer has requested a quote for their iPhone.</p>

        <h3>Device Information</h3>
        <ul>
          <li><strong>Model:</strong> ${model}</li>
          <li><strong>Storage:</strong> ${storage}GB</li>
          <li><strong>Known Issues:</strong> ${damagesList}</li>
        </ul>

        <h3>Customer Contact Details</h3>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Suburb:</strong> ${suburb}</li>
        </ul>

        <p><strong>Action Required:</strong> Call customer within 24 hours to provide quote.</p>
      `
    });

    // Send confirmation email to customer
    await resend.emails.send({
      from: 'Cash For Phones <noreply@sellphones.sydney>',
      to: email,
      subject: 'Quote Request Received - Cash For Phones',
      html: `
        <h2>Thanks for your quote request, ${name}!</h2>
        <p>We've received your information for the <strong>${model} ${storage}GB</strong>.</p>

        <p>We'll call you within 24 hours with a quote.</p>

        <h3>What You Submitted:</h3>
        <ul>
          <li><strong>Model:</strong> ${model}</li>
          <li><strong>Storage:</strong> ${storage}GB</li>
          <li><strong>Known Issues:</strong> ${damagesList}</li>
        </ul>

        <p>If you have any questions in the meantime, feel free to call us.</p>

        <p>Thanks,<br/>Cash For Phones Team</p>
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
