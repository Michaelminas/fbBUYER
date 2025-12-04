import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoutingService } from '@/services/routingService';
import { rateLimit } from '@/middleware/rateLimiter';
import iphoneModels from '@/data/iphone-models.json';
import damageCosts from '@/data/damage-costs.json';

interface QuoteRequest {
  model: string;
  storage: string;
  damages: string[];
  hasBox: boolean;
  hasCharger: boolean;
  isActivationLocked: boolean;
  sellMethod: 'pickup' | 'dropoff';
  address?: string;
}

async function handleQuote(request: NextRequest) {
  try {
    const body: QuoteRequest = await request.json();
    const { model, storage, damages, hasBox, hasCharger, isActivationLocked, sellMethod, address } = body;
    
    // Enhanced business logic validation
    if (!model || !storage || damages === undefined || 
        hasBox === undefined || hasCharger === undefined || 
        isActivationLocked === undefined || !sellMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate sellMethod
    if (!['pickup', 'dropoff'].includes(sellMethod)) {
      return NextResponse.json({ error: 'Invalid sell method' }, { status: 400 });
    }
    
    // Validate damages array
    if (!Array.isArray(damages)) {
      return NextResponse.json({ error: 'Damages must be an array' }, { status: 400 });
    }

    // Validate address length for pickup
    if (sellMethod === 'pickup' && address) {
      if (typeof address !== 'string' || address.length > 200) {
        return NextResponse.json({ error: 'Address must be a string under 200 characters' }, { status: 400 });
      }
    }

    // Find the iPhone model
    const iphoneModel = (iphoneModels as any[]).find(m => m.name === model);
    if (!iphoneModel) {
      return NextResponse.json({ error: 'Invalid iPhone model' }, { status: 400 });
    }

    const basePrice = iphoneModel.basePrice[storage];
    if (!basePrice) {
      return NextResponse.json({ error: 'Invalid storage option' }, { status: 400 });
    }

    // Handle activation lock special tiers
    if (isActivationLocked) {
      let activationQuote = 50; // Default base
      
      if (iphoneModel.type === 'Pro Max') activationQuote = 150;
      else if (iphoneModel.type === 'Pro') activationQuote = 100;
      else activationQuote = 50;

      // Very old iPhone override
      if (['iPhone X', 'iPhone 8', 'iPhone 7', 'iPhone 6s', 'iPhone 6', 'iPhone SE'].includes(iphoneModel.family)) {
        activationQuote = 20;
      }

      return NextResponse.json({
        quote: activationQuote,
        basePrice,
        damageDeduction: 0,
        margin: 0,
        pickupFee: 0,
        distance: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Calculate damage deductions
    let damageDeduction = 0;
    damages.forEach(damage => {
      const cost = (damageCosts as any)[damage];
      if (cost) {
        damageDeduction += cost;
      }
    });

    // Accessories deduction
    if (!hasBox || !hasCharger) {
      damageDeduction += 20; // Single $20 deduction if either missing
    }

    // Apply 30% margin
    const margin = Math.round(basePrice * 0.30);
    
    // Enhanced business logic validation for quote calculation
    if (basePrice <= 0) {
      return NextResponse.json({ error: 'Invalid base price' }, { status: 400 });
    }
    
    if (damageDeduction < 0) {
      return NextResponse.json({ error: 'Damage deduction cannot be negative' }, { status: 400 });
    }
    
    if (margin < 0) {
      return NextResponse.json({ error: 'Margin cannot be negative' }, { status: 400 });
    }
    
    // Calculate final quote with $50 floor
    const finalQuote = Math.max(basePrice - damageDeduction - margin, 50);

    // Calculate pickup fee if pickup selected - OPTIMIZED
    let pickupFee = 0;
    let distance = null;
    let estimatedTime = null;
    let pickupEligible = true;

    if (sellMethod === 'pickup' && address) {
      try {
        // Use the proper routing service to calculate actual distance
        const routeResult = await RoutingService.calculateDistanceAndFee(address);
        
        if (routeResult.isEligible) {
          distance = routeResult.distance;
          estimatedTime = routeResult.duration;
          pickupFee = routeResult.pickupFee;
        } else {
          // Service returned ineligible (e.g., too far)
          distance = routeResult.distance;
          estimatedTime = routeResult.duration;
          pickupFee = routeResult.pickupFee;
          pickupEligible = false;
        }
      } catch (error) {
        console.error('Routing calculation failed:', error);
        // Return error for failed routing
        return NextResponse.json({
          error: 'Unable to calculate distance to your address. Please try again or contact support.'
        }, { status: 400 });
      }
      
      // Quick validation without expensive routing calls
      if (distance > 60) {
        return NextResponse.json({
          error: 'Pickup not available - location too far',
          distance,
          estimatedTime,
          requiresManualReview: true
        }, { status: 400 });
      }
    }

    // Get available time slots - OPTIMIZED (pre-calculated)
    const now = new Date();
    const availableSlots = [];
    
    // Fast slot generation - only generate 10 slots for better performance
    for (let i = 0; i < 7 && availableSlots.length < 10; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      if (date.getDay() !== 0) { // Skip Sundays
        // Generate fewer slots for better performance
        const hours = [12, 14, 16, 18]; // Selected hours instead of all
        for (const hour of hours) {
          if (availableSlots.length >= 10) break;
          
          const slotTime = new Date(date);
          slotTime.setHours(hour, 0, 0, 0);
          
          availableSlots.push({
            time: slotTime,
            isSameDay: i === 0 && now.getHours() <= 15 // Simple same-day logic
          });
        }
      }
    }

    return NextResponse.json({
      quote: finalQuote,
      basePrice,
      damageDeduction,
      margin,
      pickupFee,
      distance,
      estimatedTime,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      availableSlots: availableSlots.slice(0, 10), // Return first 10 slots
    });

  } catch (error) {
    console.error('Quote calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting: 20 requests per minute
export const POST = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: 'Too many quote requests. Please wait before requesting another quote.'
})(handleQuote);