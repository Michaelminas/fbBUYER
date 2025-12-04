interface RouteRequest {
  origin: string;
  destination: string;
}

interface RouteResponse {
  distance: number; // in kilometers
  duration: number; // in minutes
  polyline?: string;
  success: boolean;
  error?: string;
}

const PENRITH_LOCATION = 'Penrith NSW 2750, Australia';

export class RoutingService {
  private static apiKey = process.env.GOOGLE_MAPS_API_KEY;

  /**
   * Calculate route using Google Routes API
   */
  static async calculateRoute(address: string): Promise<RouteResponse> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured, using mock data');
      return this.getMockRoute(address);
    }

    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify({
          origin: {
            address: PENRITH_LOCATION
          },
          destination: {
            address: address
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          computeAlternativeRoutes: false,
          routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google Routes API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      
      return {
        distance: Math.round(route.distanceMeters / 1000 * 10) / 10, // Convert to km with 1 decimal
        duration: Math.round(parseInt(route.duration.replace('s', '')) / 60), // Convert to minutes
        polyline: route.polyline?.encodedPolyline,
        success: true
      };

    } catch (error) {
      console.error('Route calculation error:', error);
      
      // Fallback to mock calculation
      return this.getMockRoute(address);
    }
  }

  /**
   * Calculate pickup fee based on distance
   */
  static calculatePickupFee(distance: number): number {
    const rawFee = Math.round(1.25 * distance);
    
    if (rawFee < 20) {
      return 0; // Free pickup
    }
    
    // Clamp between $30-$50
    return Math.min(Math.max(rawFee, 30), 50);
  }

  /**
   * Check if pickup is eligible based on distance and time
   */
  static isPickupEligible(distance: number, estimatedTime: number): {
    eligible: boolean;
    reason?: string;
  } {
    if (distance > 35) {
      return {
        eligible: false,
        reason: 'Distance exceeds service area (35km limit)'
      };
    }

    if (estimatedTime > 60) {
      return {
        eligible: false,
        reason: 'Travel time exceeds 60 minutes'
      };
    }

    return { eligible: true };
  }

  /**
   * Check if same-day pickup is available
   */
  static isSameDayEligible(distance: number, estimatedTime: number, currentHour: number): boolean {
    return currentHour <= 15 && // Before 3 PM
           distance <= 20 &&    // Within 20km
           estimatedTime <= 60; // Under 60 min travel
  }

  /**
   * Get profit band threshold for distance
   */
  static getProfitBandThreshold(distance: number): number {
    if (distance <= 10) return 30;
    if (distance <= 20) return 40;
    if (distance <= 35) return 50;
    return 60; // For manual review cases
  }

  /**
   * Calculate expected trip profit
   */
  static calculateTripProfit(quoteAmount: number, pickupFee: number): number {
    const margin = Math.round(quoteAmount * 0.30); // 30% margin from quote
    return margin - pickupFee;
  }

  /**
   * Validate pickup request
   */
  static validatePickup(
    distance: number, 
    estimatedTime: number, 
    quoteAmount: number
  ): {
    valid: boolean;
    reason?: string;
    requiresManualReview?: boolean;
  } {
    const pickupFee = this.calculatePickupFee(distance);
    const expectedProfit = this.calculateTripProfit(quoteAmount, pickupFee);
    const profitThreshold = this.getProfitBandThreshold(distance);
    
    // Check basic eligibility
    const eligibility = this.isPickupEligible(distance, estimatedTime);
    if (!eligibility.eligible) {
      return {
        valid: false,
        reason: eligibility.reason
      };
    }

    // Check profit requirements
    if (expectedProfit < profitThreshold) {
      return {
        valid: false,
        reason: `Insufficient profit margin for ${distance}km distance`
      };
    }

    // Manual review for long distances
    if (distance > 35) {
      return {
        valid: true,
        requiresManualReview: true
      };
    }

    return { valid: true };
  }

  /**
   * Mock route calculation for development/fallback
   */
  private static getMockRoute(address: string): RouteResponse {
    // Simple mock based on address characteristics
    const addressLower = address.toLowerCase();
    
    let distance: number;
    
    // Special handling for addresses near Penrith (same suburb or very close)
    if (addressLower.includes('penrith') ||
        (addressLower.includes('penrith') && (addressLower.includes('street') || addressLower.includes('road')))) {
      // Very close addresses should have minimal distance
      const streetNumber = addressLower.match(/(\d+)/);
      if (streetNumber) {
        const num = parseInt(streetNumber[1]);
        // Same street or very close - distance should be under 1km
        distance = Math.abs(num - 1) * 0.1 + 0.5; // Base 0.5km + 0.1km per house number difference
        distance = Math.min(distance, 2); // Cap at 2km for same street
      } else {
        distance = Math.random() * 1 + 0.5; // 0.5-1.5km
      }
    } else if (addressLower.includes('penrith') || addressLower.includes('claremont')) {
      distance = Math.random() * 5 + 2; // 2-7km
    } else if (addressLower.includes('parramatta') || addressLower.includes('blacktown')) {
      distance = Math.random() * 10 + 15; // 15-25km
    } else if (addressLower.includes('sydney') || addressLower.includes('cbd')) {
      distance = Math.random() * 15 + 25; // 25-40km
    } else {
      distance = Math.random() * 30 + 10; // 10-40km
    }

    const duration = Math.round(distance * 1.5 + Math.random() * 10); // Rough estimate with some variance

    return {
      distance: Math.round(distance * 10) / 10,
      duration,
      success: true
    };
  }
}

// Export utility functions for use in components
export const calculatePickupFee = RoutingService.calculatePickupFee;
export const isPickupEligible = RoutingService.isPickupEligible;
export const isSameDayEligible = RoutingService.isSameDayEligible;