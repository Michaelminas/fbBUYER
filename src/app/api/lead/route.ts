import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from '@/middleware/rateLimiter';
import { validateInput, validateCSRF } from '@/middleware/validation';

interface LeadRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  sellMethod: 'pickup' | 'dropoff';
  pickupFee?: number;
  distance?: number;
  quote: {
    model: string;
    storage: string;
    damages: string[];
    hasBox: boolean;
    hasCharger: boolean;
    isActivationLocked: boolean;
    basePrice: number;
    damageDeduction: number;
    margin: number;
    finalQuote: number;
    pickupFee?: number;
  };
}

async function handleCreateLead(request: NextRequest) {
  try {
    const body: LeadRequest = await request.json();
    const { email, firstName, lastName, phoneNumber, address, sellMethod, pickupFee, distance, quote } = body;
    
    // Enhanced business logic validation for quotes
    if (!quote || typeof quote !== 'object') {
      return NextResponse.json({ error: 'Quote object is required' }, { status: 400 });
    }
    
    // Validate quote values for business logic security
    if (quote.finalQuote <= 0) {
      return NextResponse.json({ error: 'Invalid quote amount' }, { status: 400 });
    }
    
    if (quote.basePrice <= 0) {
      return NextResponse.json({ error: 'Invalid base price' }, { status: 400 });
    }
    
    if (quote.damageDeduction < 0) {
      return NextResponse.json({ error: 'Damage deduction cannot be negative' }, { status: 400 });
    }
    
    if (quote.margin < 0) {
      return NextResponse.json({ error: 'Margin cannot be negative' }, { status: 400 });
    }
    
    // Validate final quote calculation with generous tolerance for rounding differences
    const calculatedQuote = Math.max(quote.basePrice - quote.damageDeduction - quote.margin, 50);
    const difference = Math.abs(quote.finalQuote - calculatedQuote);
    if (difference > 5) { // Increased tolerance to $5 to handle rounding variations
      console.error('Quote calculation mismatch:', {
        received: quote.finalQuote,
        calculated: calculatedQuote,
        difference,
        basePrice: quote.basePrice,
        damageDeduction: quote.damageDeduction,
        margin: quote.margin
      });
      return NextResponse.json({ 
        error: 'Quote calculation mismatch',
        details: { received: quote.finalQuote, calculated: calculatedQuote, difference }
      }, { status: 400 });
    }

    // Validate iPhone model and storage first (outside transaction)
    if (!quote.model || quote.model.trim() === '') {
      return NextResponse.json({ error: 'iPhone model is required' }, { status: 400 });
    }

    if (!quote.storage || quote.storage.trim() === '') {
      return NextResponse.json({ error: 'Storage option is required' }, { status: 400 });
    }

    const iphoneModels = require('@/data/iphone-models.json');
    const modelData = (iphoneModels as any[]).find(m => m.name === quote.model);
    
    if (!modelData) {
      console.log('Invalid model:', quote.model);
      console.log('Available models:', iphoneModels.map((m: any) => m.name));
      return NextResponse.json({ 
        error: `Invalid iPhone model: "${quote.model}". Please select a valid model.` 
      }, { status: 400 });
    }
    
    // Validate storage option for this model
    const availableStorages = Object.keys(modelData.basePrice);
    if (!availableStorages.includes(quote.storage)) {
      return NextResponse.json({ 
        error: `Invalid storage option for ${quote.model}. Available: ${availableStorages.join(', ')}`
      }, { status: 400 });
    }

    // Use a database transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check if email already exists within transaction
      const existingLead = await tx.lead.findUnique({
        where: { email: email }
      });

      if (existingLead) {
        throw new Error('Email already registered');
      }

      // Check if email is blacklisted
      const blacklisted = await tx.blacklist.findFirst({
        where: {
          OR: [
            { email: email },
            ...(phoneNumber ? [{ phoneNumber: phoneNumber }] : [])
          ],
          isActive: true
        }
      });

      if (blacklisted) {
        throw new Error('Unable to process request');
      }

      // Find or create device
      let device = await tx.device.findFirst({
        where: {
          model: quote.model,
          storage: quote.storage
        }
      });

      if (!device) {
        device = await tx.device.create({
          data: {
            model: quote.model,
            storage: quote.storage,
            family: modelData.family,
            type: modelData.type
          }
        });
      }

      // Create lead
      const lead = await tx.lead.create({
        data: {
          email,
          firstName,
          lastName,
          phoneNumber,
          address,
          sellMethod,
          pickupFee: pickupFee || null,
          distance: distance || null,
          isVerified: false
        }
      });

      // Create quote
      const quoteRecord = await tx.quote.create({
        data: {
          leadId: lead.id,
          deviceId: device.id,
          damages: JSON.stringify(quote.damages),
          hasBox: quote.hasBox,
          hasCharger: quote.hasCharger,
          isActivationLocked: quote.isActivationLocked,
          basePrice: quote.basePrice,
          damageDeduction: quote.damageDeduction,
          margin: quote.margin,
          finalQuote: quote.finalQuote,
          pickupFee: quote.pickupFee || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Create verification token
      const verificationToken = uuidv4();
      const verification = await tx.verification.create({
        data: {
          leadId: lead.id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }
      });

      // Log analytics event
      await tx.analyticsEvent.create({
        data: {
          event: 'lead_created',
          properties: JSON.stringify({
            model: quote.model,
            storage: quote.storage,
            sellMethod,
            quote: quote.finalQuote,
            damages: quote.damages
          }),
          userId: lead.id
        }
      });

      return {
        leadId: lead.id,
        verificationToken
      };
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({
      leadId: result.leadId,
      verificationToken: result.verificationToken,
      message: 'Lead created successfully. Please check your email to verify.'
    });

  } catch (error) {
    console.error('Lead creation error:', error);
    
    // Handle specific transaction errors
    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
      if (error.message === 'Unable to process request') {
        return NextResponse.json({ error: 'Unable to process request' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply validation, CSRF protection and rate limiting
export const POST = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Too many lead submissions. Please wait before submitting again.'
})(
  validateCSRF()(
    validateInput({
      email: true,
      phoneNumber: true,
      required: ['email', 'sellMethod', 'quote'],
      maxLength: {
        firstName: 50,
        lastName: 50,
        email: 254,
        phoneNumber: 15,
        address: 500
      },
      allowedValues: {
        sellMethod: ['pickup', 'dropoff']
      }
    })(handleCreateLead)
  )
);