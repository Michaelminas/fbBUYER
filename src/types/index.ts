// iPhone Models and Storage
export interface IPhoneModel {
  id: string
  name: string
  basePrice: number
  category: 'base' | 'pro' | 'pro_max'
  storageOptions: string[]
  isLocked?: boolean
}

export interface IPhonePricing {
  id: number
  model: string
  storage: string
  basePrice: number
  createdAt: string
}

export interface RepairCost {
  id: number
  model: string
  screenRepair: number
  batteryRepair: number
  chargingPort: number
  cameraRepair: number
  backGlass: number
  createdAt: string
}

// Quote and Lead Management
export interface QuoteRequest {
  model: string
  storage: string
  damages: string[]
  isLocked: boolean
  hasBox: boolean
  hasCharger: boolean
  pickupMethod: 'pickup' | 'dropoff'
  address?: string
}

export interface QuoteResult {
  basePrice: number
  damageDeductions: number
  margin: number
  pickupFee: number
  finalPayout: number
  validUntil: string
  distance?: number
  estimatedTime?: number
}

export interface Lead {
  id: string
  quoteId: string
  name: string
  phone: string
  email: string
  address?: string
  notes?: string
  photos?: string[]
  status: 'new' | 'verified' | 'scheduled' | 'completed' | 'cancelled'
  quote: QuoteResult
  device: QuoteRequest
  scheduledAt?: string
  createdAt: string
  updatedAt: string
}

// Authentication
export interface User {
  id: string
  email: string
  role: 'admin' | 'driver'
  name: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface AuthToken {
  token: string
  user: User
  expiresAt: string
}

// Calendar and Scheduling
export interface TimeSlot {
  date: string
  time: string
  available: boolean
  leadId?: string
}

export interface Appointment {
  id: string
  leadId: string
  driverId?: string
  scheduledAt: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  completedAt?: string
  paymentMethod?: 'cash' | 'payid'
  finalPayout?: number
}

// Business Logic
export interface BusinessConfig {
  baseMargin: number
  proMargin: number
  proMaxMargin: number
  pickupFeePerKm: number
  pickupFeeMin: number
  pickupFeeMax: number
  payoutFloor: number
  maxDistance: number
  maxTravelTime: number
  accessoryDeduction: number
  operatingHours: {
    start: number
    end: number
    excludeDays: number[]
  }
}