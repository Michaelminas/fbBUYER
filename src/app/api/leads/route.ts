import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const { name, phone, email, suburb, model, storage, issues } = data

    // Validate required fields
    if (!name || !phone || !email || !suburb || !model || !storage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Format issues list
    const issuesList = issues && issues.length > 0
      ? issues.join(', ')
      : 'None reported'

    // Send email notification
    await resend.emails.send({
      from: 'Cash For Phones <noreply@sellphones.sydney>',
      to: 'mikeminas0@gmail.com',
      subject: `New Lead: ${name} - ${model} ${storage}`,
      html: `
        <h2>New iPhone Lead</h2>

        <h3>Customer Details</h3>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Suburb:</strong> ${suburb}</li>
        </ul>

        <h3>iPhone Details</h3>
        <ul>
          <li><strong>Model:</strong> ${model}</li>
          <li><strong>Storage:</strong> ${storage}</li>
          <li><strong>Known Issues:</strong> ${issuesList}</li>
        </ul>

        <p><em>Submitted at: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</em></p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting lead:', error)
    return NextResponse.json(
      { error: 'Failed to submit lead' },
      { status: 500 }
    )
  }
}
