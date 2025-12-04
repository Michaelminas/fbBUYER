import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find verification record
    const verification = await prisma.verification.findUnique({
      where: { token },
      include: {
        lead: {
          include: {
            quote: {
              include: {
                device: true
              }
            }
          }
        }
      }
    });

    if (!verification) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // Check if token is expired
    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }

    // Check if already used
    if (verification.isUsed) {
      return NextResponse.json({ error: 'Verification token already used' }, { status: 400 });
    }

    // Check if lead is already verified
    if (verification.lead.isVerified) {
      return NextResponse.json({ error: 'Lead already verified' }, { status: 400 });
    }

    // Mark verification as used and lead as verified
    await prisma.$transaction([
      prisma.verification.update({
        where: { id: verification.id },
        data: { isUsed: true }
      }),
      prisma.lead.update({
        where: { id: verification.leadId },
        data: { isVerified: true }
      })
    ]);

    // Log analytics
    await prisma.analyticsEvent.create({
      data: {
        event: 'lead_verified',
        userId: verification.leadId,
        properties: JSON.stringify({ 
          email: verification.lead.email,
          verificationTime: new Date().toISOString()
        })
      }
    });

    // Return lead and quote data for scheduling
    return NextResponse.json({
      message: 'Verification successful',
      lead: {
        id: verification.lead.id,
        email: verification.lead.email,
        firstName: verification.lead.firstName,
        lastName: verification.lead.lastName,
        phoneNumber: verification.lead.phoneNumber,
        address: verification.lead.address,
        sellMethod: verification.lead.sellMethod,
        distance: verification.lead.distance,
        pickupFee: verification.lead.pickupFee
      },
      quote: verification.lead.quote ? {
        id: verification.lead.quote.id,
        device: verification.lead.quote.device.model + ' ' + verification.lead.quote.device.storage + 'GB',
        finalQuote: verification.lead.quote.finalQuote,
        damages: JSON.parse(verification.lead.quote.damages),
        hasBox: verification.lead.quote.hasBox,
        hasCharger: verification.lead.quote.hasCharger,
        isActivationLocked: verification.lead.quote.isActivationLocked,
        expiresAt: verification.lead.quote.expiresAt,
        pickupFee: verification.lead.quote.pickupFee
      } : null
    });

  } catch (error) {
    console.error('Confirm verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find and validate token without consuming it
    const verification = await prisma.verification.findUnique({
      where: { token },
      include: {
        lead: {
          include: {
            quote: {
              include: {
                device: true
              }
            }
          }
        }
      }
    });

    if (!verification) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }

    if (verification.isUsed) {
      return NextResponse.json({ error: 'Verification token already used' }, { status: 400 });
    }

    // Return verification data for display
    return NextResponse.json({
      valid: true,
      lead: {
        email: verification.lead.email,
        firstName: verification.lead.firstName,
        sellMethod: verification.lead.sellMethod,
        address: verification.lead.address
      },
      quote: verification.lead.quote ? {
        device: verification.lead.quote.device.model + ' ' + verification.lead.quote.device.storage + 'GB',
        finalQuote: verification.lead.quote.finalQuote,
        expiresAt: verification.lead.quote.expiresAt,
        pickupFee: verification.lead.quote.pickupFee
      } : null
    });

  } catch (error) {
    console.error('Get verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}