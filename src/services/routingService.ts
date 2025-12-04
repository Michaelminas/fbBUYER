// Database-backed routing service with Google Routes API integration
import { prisma } from '@/lib/prisma';
import { analytics } from '@/lib/analytics';

export interface PickupLocation {
  id: string;
  leadId: string;
  customerName: string;
  address: string;
  phone: string;
  appointmentId: string;
  timeWindow: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  estimatedDuration: number; // minutes
  status: 'pending' | 'en_route' | 'arrived' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  deviceValue: number;
  notes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  actualArrival?: Date;
  completedAt?: Date;
}

export interface Route {
  id: string;
  date: string;
  driverId?: string;
  status: 'planning' | 'active' | 'completed';
  pickups: PickupLocation[];
  estimatedDistance: number; // km
  estimatedDuration: number; // minutes
  actualDistance?: number;
  actualDuration?: number;
  startTime?: Date;
  endTime?: Date;
  totalValue: number;
  googleRouteId?: string;
}

export interface RouteOptimization {
  optimizedOrder: string[]; // pickup IDs in order
  totalDistance: number;
  totalDuration: number;
  estimatedFuelCost: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  waypoints: Array<{
    pickupId: string;
    address: string;
    coordinates: { lat: number; lng: number };
    estimatedArrival: Date;
    drivingTime: number;
  }>;
}

export interface DistanceCalculation {
  distance: number; // km
  duration: number; // minutes
  pickupFee: number; // calculated fee
  isEligible: boolean; // meets pickup criteria
  route?: {
    polyline: string;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  };
}

export class RoutingService {
  private static readonly AVERAGE_SPEED = 35; // km/h in Sydney traffic with stops
  private static readonly FUEL_COST_PER_KM = 0.18; // $0.18 per km (updated for 2024)
  private static readonly PICKUP_DURATION = 15; // minutes per pickup
  private static readonly BASE_LOCATION = { lat: -33.7518, lng: 150.3005 }; // Penrith, Sydney
  private static readonly MAX_PICKUP_DISTANCE = 60; // 60km max pickup distance
  private static readonly MAX_ROUTE_DURATION = 8 * 60; // 8 hours max route time
  
  // Track if APIs have referer restrictions to avoid double failures
  private static hasRefererRestrictions = false;

  // Pickup fee calculation bands (from CLAUDE.md requirements)
  private static readonly FEE_BANDS = [
    { minKm: 0, maxKm: 16, fee: 0, minProfit: 30 },
    { minKm: 16, maxKm: 24, fee: 30, minProfit: 40 },
    { minKm: 24, maxKm: 40, fee: 1.25, minProfit: 50 }, // 1.25 * km
    { minKm: 40, maxKm: 60, fee: 50, minProfit: 50 }
  ];

  static async calculateDistanceAndFee(
    fromAddress: string,
    toAddress: string = 'Penrith NSW 2750'
  ): Promise<DistanceCalculation> {
    try {
      // Try Google Routes API first (unless we know it has referer restrictions)
      if (!this.hasRefererRestrictions) {
        const routesApiKey = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
        if (routesApiKey) {
          console.log('🗺️ Using Google Routes API for distance calculation');
          try {
            return await this.calculateWithGoogleRoutes(fromAddress, toAddress);
          } catch (error) {
            if (error instanceof Error && error.message === 'REFERER_BLOCKED') {
              console.log('📍 Skipping all Google APIs due to referer restrictions, using estimation');
              // Skip geocoding fallback and go straight to estimation
            } else {
              throw error; // Re-throw other errors
            }
          }
        }
      } else {
        console.log('⚡ Skipping Google APIs (known referer restrictions), using estimation');
      }
      
      // Fallback to geocoding + haversine calculation (unless we know APIs are blocked)
      if (!this.hasRefererRestrictions) {
        const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
        if (placesApiKey) {
          console.log('📍 Using Google Places API for geocoding fallback');
          return await this.calculateWithFallback(fromAddress, toAddress);
        }
      }
      
      console.warn('⚠️ No Google API keys configured, using estimation');
      // Ultimate fallback with estimated values
      const estimatedDistance = this.estimateDistanceBySuburb(fromAddress);
      const pickupFee = this.calculatePickupFee(estimatedDistance);
      
      return {
        distance: estimatedDistance,
        duration: Math.round((estimatedDistance / this.AVERAGE_SPEED) * 60),
        pickupFee: pickupFee,
        isEligible: estimatedDistance <= this.MAX_PICKUP_DISTANCE
      };
      
    } catch (error) {
      console.error('❌ Distance calculation error:', error);
      
      // Ultimate fallback with estimated values
      const estimatedDistance = this.estimateDistanceBySuburb(fromAddress);
      const pickupFee = this.calculatePickupFee(estimatedDistance);
      
      return {
        distance: estimatedDistance,
        duration: Math.round((estimatedDistance / this.AVERAGE_SPEED) * 60),
        pickupFee: pickupFee,
        isEligible: estimatedDistance <= this.MAX_PICKUP_DISTANCE
      };
    }
  }

  private static async calculateWithGoogleRoutes(
    fromAddress: string,
    toAddress: string
  ): Promise<DistanceCalculation> {
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const apiKey = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('No Google Routes API key available');
    }
    
    const requestBody = {
      origin: {
        address: fromAddress
      },
      destination: {
        address: toAddress
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: true,
        avoidHighways: false,
        avoidFerries: true
      },
      languageCode: 'en-AU',
      units: 'METRIC'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Routes API error details:', errorText);
      
      // Check if it's a referer restriction error - don't throw, let it fall back
      if (response.status === 403 && errorText.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        console.log('🚫 Google Routes API blocked by referer restrictions, skipping all Google APIs');
        this.hasRefererRestrictions = true; // Remember this for future requests
        throw new Error('REFERER_BLOCKED'); // Special error code for fallback
      }
      
      throw new Error(`Google Routes API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    const distanceKm = route.distanceMeters / 1000;
    const durationMinutes = Math.round(parseInt(route.duration.replace('s', '')) / 60);
    const pickupFee = this.calculatePickupFee(distanceKm);
    
    // Extract turn-by-turn directions if available
    const steps = route.legs?.[0]?.steps?.map((step: any) => ({
      instruction: step.navigationInstruction?.instructions || 'Continue',
      distance: step.distanceMeters / 1000,
      duration: Math.round(parseInt(step.duration.replace('s', '')) / 60)
    })) || [];

    return {
      distance: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
      duration: durationMinutes,
      pickupFee,
      isEligible: distanceKm <= this.MAX_PICKUP_DISTANCE,
      route: {
        polyline: route.polyline?.encodedPolyline || '',
        steps
      }
    };
  }

  private static async calculateWithFallback(
    fromAddress: string,
    toAddress: string
  ): Promise<DistanceCalculation> {
    // Use Google Geocoding API to get coordinates, then calculate distance
    const fromCoords = await this.geocodeAddress(fromAddress);
    const toCoords = await this.geocodeAddress(toAddress);
    
    if (!fromCoords || !toCoords) {
      throw new Error('Failed to geocode addresses');
    }

    const distanceKm = this.calculateHaversineDistance(fromCoords, toCoords);
    // Add 20% for real driving routes vs straight-line distance
    const adjustedDistance = distanceKm * 1.2;
    const duration = Math.round((adjustedDistance / this.AVERAGE_SPEED) * 60);
    const pickupFee = this.calculatePickupFee(adjustedDistance);

    return {
      distance: Math.round(adjustedDistance * 10) / 10,
      duration,
      pickupFee,
      isEligible: adjustedDistance <= this.MAX_PICKUP_DISTANCE
    };
  }

  private static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('No Google Places/Maps API key available for geocoding');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=au&key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Geocoding API error:', response.status, errorText);
        return null;
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error('Geocoding failed with status:', data.status, data.error_message);
        return null;
      }
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding request failed:', error);
      return null;
    }
  }

  private static calculatePickupFee(distanceKm: number): number {
    // Implement fee structure from CLAUDE.md
    for (const band of this.FEE_BANDS) {
      if (distanceKm >= band.minKm && distanceKm < band.maxKm) {
        if (band.fee === 1.25) {
          // Dynamic fee: 1.25 * km, rounded to nearest $5, clamped between $30-$50
          const rawFee = distanceKm * 1.25;
          const roundedToFive = Math.round(rawFee / 5) * 5;
          return Math.max(30, Math.min(50, roundedToFive));
        }
        return band.fee;
      }
    }
    
    // Over 60km - manual review required
    return 50;
  }

  private static estimateDistanceBySuburb(address: string): number {
    // Fallback distance estimation based on Sydney suburb patterns
    const addressLower = address.toLowerCase();
    
    // Distance estimates from Penrith to major Sydney areas
    if (addressLower.includes('penrith') || addressLower.includes('2750')) return 5;
    if (addressLower.includes('blacktown') || addressLower.includes('2148')) return 18;
    if (addressLower.includes('parramatta') || addressLower.includes('2150')) return 25;
    if (addressLower.includes('sydney') || addressLower.includes('cbd')) return 50;
    if (addressLower.includes('bondi') || addressLower.includes('randwick')) return 60;
    if (addressLower.includes('manly') || addressLower.includes('northern beaches')) return 65;
    if (addressLower.includes('cronulla') || addressLower.includes('sutherland')) return 55;
    
    // Default estimate for unknown areas
    return 35;
  }

  private static calculateHaversineDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static async optimizeRoute(
    appointments: Array<{
      id: string;
      address: string;
      timeWindow: { start: string; end: string };
      priority: 'low' | 'medium' | 'high';
      deviceValue: number;
    }>
  ): Promise<RouteOptimization> {
    if (appointments.length <= 1) {
      const singleWaypoint = appointments.length === 1 ? [{
        pickupId: appointments[0].id,
        address: appointments[0].address,
        coordinates: this.BASE_LOCATION, // Fallback coordinates
        estimatedArrival: new Date(),
        drivingTime: 0
      }] : [];

      return {
        optimizedOrder: appointments.map(a => a.id),
        totalDistance: 0,
        totalDuration: 0,
        estimatedFuelCost: 0,
        efficiency: 'excellent',
        waypoints: singleWaypoint
      };
    }

    try {
      // Use Google Routes API for multi-waypoint optimization if available
      if (process.env.GOOGLE_ROUTES_API_KEY && appointments.length <= 25) {
        return await this.optimizeWithGoogleRoutes(appointments);
      }
      
      // Fallback to simple optimization
      return await this.optimizeWithFallback(appointments);
      
    } catch (error) {
      console.error('Route optimization error:', error);
      return await this.optimizeWithFallback(appointments);
    }
  }

  private static async optimizeWithGoogleRoutes(
    appointments: Array<{
      id: string;
      address: string;
      timeWindow: { start: string; end: string };
      priority: 'low' | 'medium' | 'high';
      deviceValue: number;
    }>
  ): Promise<RouteOptimization> {
    const requestWaypoints = appointments.map(apt => ({
      address: apt.address
    }));

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: this.BASE_LOCATION.lat,
            longitude: this.BASE_LOCATION.lng
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: this.BASE_LOCATION.lat,
            longitude: this.BASE_LOCATION.lng
          }
        }
      },
      intermediates: requestWaypoints,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
      optimizeWaypointOrder: true,
      languageCode: 'en-AU',
      units: 'METRIC'
    };

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_ROUTES_API_KEY!,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndex'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google Routes optimization failed: ${response.status}`);
    }

    const data = await response.json();
    const route = data.routes[0];
    
    // Extract optimized order
    const optimizedIndices = route.optimizedIntermediateWaypointIndex || 
                           appointments.map((_, i) => i);
    
    const optimizedOrder = optimizedIndices.map((index: number) => appointments[index].id);
    const totalDistance = route.distanceMeters / 1000;
    const totalDuration = Math.round(parseInt(route.duration.replace('s', '')) / 60);
    const estimatedFuelCost = totalDistance * this.FUEL_COST_PER_KM;
    
    // Calculate efficiency
    let efficiency: RouteOptimization['efficiency'] = 'excellent';
    if (totalDistance > 100) efficiency = 'good';
    if (totalDistance > 150) efficiency = 'fair';
    if (totalDistance > 200) efficiency = 'poor';

    // Generate waypoints with estimated arrival times
    const waypoints: RouteOptimization['waypoints'] = [];
    let cumulativeTime = new Date();
    
    for (let i = 0; i < optimizedIndices.length; i++) {
      const aptIndex = optimizedIndices[i];
      const appointment = appointments[aptIndex];
      
      // Add driving time to next waypoint
      const segmentTime = totalDuration / (optimizedIndices.length + 1);
      cumulativeTime = new Date(cumulativeTime.getTime() + segmentTime * 60000);
      
      waypoints.push({
        pickupId: appointment.id,
        address: appointment.address,
        coordinates: this.BASE_LOCATION, // Would be geocoded in production
        estimatedArrival: new Date(cumulativeTime),
        drivingTime: segmentTime
      });
      
      // Add pickup time
      cumulativeTime = new Date(cumulativeTime.getTime() + this.PICKUP_DURATION * 60000);
    }

    return {
      optimizedOrder,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration,
      estimatedFuelCost: Math.round(estimatedFuelCost * 100) / 100,
      efficiency,
      waypoints
    };
  }

  private static async optimizeWithFallback(
    appointments: Array<{
      id: string;
      address: string;
      timeWindow: { start: string; end: string };
      priority: 'low' | 'medium' | 'high';
      deviceValue: number;
    }>
  ): Promise<RouteOptimization> {
    // Simple nearest-neighbor optimization with priority consideration
    const unvisited = [...appointments];
    const optimizedOrder: string[] = [];
    let totalDistance = 0;
    let currentTime = new Date();
    const waypoints: RouteOptimization['waypoints'] = [];

    // Start with highest priority appointment
    const startAppointment = unvisited.find(a => a.priority === 'high') || 
                             unvisited.find(a => a.priority === 'medium') || 
                             unvisited[0];
    
    optimizedOrder.push(startAppointment.id);
    unvisited.splice(unvisited.indexOf(startAppointment), 1);
    
    // Estimate distance from base to first appointment
    const firstDistance = this.estimateDistanceBySuburb(startAppointment.address);
    totalDistance += firstDistance;
    currentTime = new Date(currentTime.getTime() + (firstDistance / this.AVERAGE_SPEED * 60) * 60000);
    
    waypoints.push({
      pickupId: startAppointment.id,
      address: startAppointment.address,
      coordinates: this.BASE_LOCATION, // Simplified
      estimatedArrival: new Date(currentTime),
      drivingTime: firstDistance / this.AVERAGE_SPEED * 60
    });

    // Add remaining appointments using nearest neighbor
    while (unvisited.length > 0) {
      let nextAppointment = unvisited[0];
      let shortestDistance = Infinity;

      // Find nearest unvisited appointment
      for (const appointment of unvisited) {
        const distance = this.estimateDistanceBetweenSuburbs(
          waypoints[waypoints.length - 1].address,
          appointment.address
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nextAppointment = appointment;
        }
      }

      optimizedOrder.push(nextAppointment.id);
      unvisited.splice(unvisited.indexOf(nextAppointment), 1);
      totalDistance += shortestDistance;
      
      // Update time estimates
      currentTime = new Date(currentTime.getTime() + 
        (shortestDistance / this.AVERAGE_SPEED * 60 + this.PICKUP_DURATION) * 60000);
      
      waypoints.push({
        pickupId: nextAppointment.id,
        address: nextAppointment.address,
        coordinates: this.BASE_LOCATION, // Simplified
        estimatedArrival: new Date(currentTime),
        drivingTime: shortestDistance / this.AVERAGE_SPEED * 60
      });
    }

    // Add return to base distance
    const returnDistance = this.estimateDistanceBySuburb(waypoints[waypoints.length - 1].address);
    totalDistance += returnDistance;

    const totalDuration = Math.round((totalDistance / this.AVERAGE_SPEED * 60) + 
                                   (appointments.length * this.PICKUP_DURATION));
    const estimatedFuelCost = totalDistance * this.FUEL_COST_PER_KM;
    
    let efficiency: RouteOptimization['efficiency'] = 'excellent';
    if (totalDistance > 100) efficiency = 'good';
    if (totalDistance > 150) efficiency = 'fair';
    if (totalDistance > 200) efficiency = 'poor';

    return {
      optimizedOrder,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration,
      estimatedFuelCost: Math.round(estimatedFuelCost * 100) / 100,
      efficiency,
      waypoints
    };
  }

  private static estimateDistanceBetweenSuburbs(address1: string, address2: string): number {
    // Simplified distance estimation between suburbs
    const dist1 = this.estimateDistanceBySuburb(address1);
    const dist2 = this.estimateDistanceBySuburb(address2);
    
    // Rough approximation: average of distances from base
    return Math.abs(dist1 - dist2) + Math.min(dist1, dist2) * 0.3;
  }

  static async createRouteFromAppointments(date: string, appointmentIds: string[]): Promise<Route | null> {
    try {
      // Get appointments from database
      const appointments = await prisma.appointment.findMany({
        where: {
          id: { in: appointmentIds },
          status: { in: ['scheduled', 'confirmed'] }
        },
        include: {
          lead: {
            include: {
              quote: {
                include: {
                  device: true
                }
              }
            }
          },
          slot: true,
          address: true
        }
      });

      if (appointments.length === 0) {
        return null;
      }

      // Convert to optimization format
      const optimizationInput = appointments.map(apt => ({
        id: apt.id,
        address: apt.address?.formattedAddress || apt.lead.address || '',
        timeWindow: {
          start: apt.slot.startTime.toTimeString().slice(0, 5),
          end: apt.slot.endTime.toTimeString().slice(0, 5)
        },
        priority: (apt.lead.quote?.finalQuote || 0) > 500 ? 'high' : 'medium' as 'high' | 'medium',
        deviceValue: apt.lead.quote?.finalQuote || 0
      }));

      // Optimize the route
      const optimization = await this.optimizeRoute(optimizationInput);
      
      // Create pickups array
      const pickups: PickupLocation[] = appointments.map(apt => {
        const waypoint = optimization.waypoints.find(w => w.pickupId === apt.id);
        
        return {
          id: apt.id,
          leadId: apt.leadId,
          customerName: `${apt.lead.firstName || ''} ${apt.lead.lastName || ''}`.trim() || 'Customer',
          address: apt.address?.formattedAddress || apt.lead.address || '',
          phone: apt.lead.phoneNumber || '',
          appointmentId: apt.id,
          timeWindow: {
            start: apt.slot.startTime.toTimeString().slice(0, 5),
            end: apt.slot.endTime.toTimeString().slice(0, 5)
          },
          estimatedDuration: this.PICKUP_DURATION,
          status: 'pending',
          priority: (apt.lead.quote?.finalQuote || 0) > 500 ? 'high' : 'medium',
          deviceValue: apt.lead.quote?.finalQuote || 0,
          coordinates: waypoint?.coordinates,
          notes: apt.notes || undefined
        };
      });

      // Create route
      const route: Route = {
        id: `route_${date}_${Date.now()}`,
        date,
        status: 'planning',
        pickups: pickups.sort((a, b) => 
          optimization.optimizedOrder.indexOf(a.id) - optimization.optimizedOrder.indexOf(b.id)
        ),
        estimatedDistance: optimization.totalDistance,
        estimatedDuration: optimization.totalDuration,
        totalValue: pickups.reduce((sum, p) => sum + p.deviceValue, 0)
      };

      // Track route creation
      await analytics.track({
        event: 'route_created',
        category: 'routing',
        action: 'created',
        properties: {
          pickupCount: pickups.length,
          totalDistance: optimization.totalDistance,
          totalValue: route.totalValue,
          efficiency: optimization.efficiency
        }
      });

      console.log('🗺️ ROUTE CREATED:', {
        id: route.id,
        pickups: pickups.length,
        distance: optimization.totalDistance + 'km',
        duration: Math.round(optimization.totalDuration / 60) + 'h',
        efficiency: optimization.efficiency
      });

      return route;
    } catch (error) {
      console.error('Failed to create route:', error);
      return null;
    }
  }

  static getNavigationUrl(address: string): string {
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}&navigate=yes`;
  }

  // Legacy methods for admin UI compatibility (stub implementations)
  static getRoutesByDate(date: string): Route[] {
    // TODO: Implement database query to get routes by date
    return [];
  }

  static getTodaysActiveRoute(): Route | null {
    // TODO: Implement database query to get today's active route
    return null;
  }

  static getRouteStats(): any {
    // TODO: Implement route statistics calculation
    return {
      totalRoutes: 0,
      totalDistance: 0,
      totalPickups: 0,
      averageEfficiency: 0
    };
  }

  static updatePickupStatus(pickupId: string, status: PickupLocation['status']): void {
    // TODO: Implement database update for pickup status
    console.log(`Updating pickup ${pickupId} to status: ${status}`);
  }

  static generateETA(pickupId: string): Date {
    // TODO: Calculate actual ETA based on current location and traffic
    // For now, return a mock ETA
    const now = new Date();
    return new Date(now.getTime() + 15 * 60000); // 15 minutes from now
  }

  static async validatePickupEligibility(
    address: string,
    quoteValue: number
  ): Promise<{ 
    eligible: boolean; 
    reason?: string;
    distance?: number;
    fee?: number;
    profit?: number;
  }> {
    try {
      const calculation = await this.calculateDistanceAndFee(address);
      
      if (!calculation.isEligible) {
        return {
          eligible: false,
          reason: `Distance (${calculation.distance}km) exceeds maximum pickup range (${this.MAX_PICKUP_DISTANCE}km)`,
          distance: calculation.distance,
          fee: calculation.pickupFee
        };
      }

      // Calculate expected profit
      const margin = quoteValue * 0.30; // 30% margin from CLAUDE.md
      const profit = margin - calculation.pickupFee;
      
      // Check minimum profit requirements for distance bands
      const band = this.FEE_BANDS.find(b => 
        calculation.distance >= b.minKm && calculation.distance < b.maxKm
      );
      
      if (band && profit < band.minProfit) {
        return {
          eligible: false,
          reason: `Insufficient profit margin. Need minimum $${band.minProfit}, calculated $${Math.round(profit)}`,
          distance: calculation.distance,
          fee: calculation.pickupFee,
          profit
        };
      }

      return {
        eligible: true,
        distance: calculation.distance,
        fee: calculation.pickupFee,
        profit
      };
    } catch (error) {
      console.error('Pickup eligibility validation error:', error);
      return {
        eligible: false,
        reason: 'Unable to validate pickup location'
      };
    }
  }
}

// Route caching for performance
const routeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCachedRoute(key: string): any | null {
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  routeCache.delete(key);
  return null;
}

function setCachedRoute(key: string, data: any): void {
  routeCache.set(key, { data, timestamp: Date.now() });
}