import { IPhoneModel, IPhonePricing, RepairCost } from '@/types'

// iPhone pricing data from CSV
export const iphonePricing: IPhonePricing[] = [
  { id: 1, model: 'iPhone X', storage: '128GB', basePrice: 150, createdAt: '2025-08-12 12:42:34' },
  { id: 2, model: 'iPhone X', storage: '256GB', basePrice: 200, createdAt: '2025-08-12 12:42:34' },
  { id: 3, model: 'iPhone 11', storage: '64GB', basePrice: 200, createdAt: '2025-08-12 12:42:34' },
  { id: 4, model: 'iPhone 11', storage: '128GB', basePrice: 250, createdAt: '2025-08-12 12:42:35' },
  { id: 5, model: 'iPhone 11', storage: '256GB', basePrice: 250, createdAt: '2025-08-12 12:42:35' },
  { id: 6, model: 'iPhone 11 Pro', storage: '128GB', basePrice: 250, createdAt: '2025-08-12 12:42:35' },
  { id: 7, model: 'iPhone 11 Pro', storage: '256GB', basePrice: 300, createdAt: '2025-08-12 12:42:35' },
  { id: 8, model: 'iPhone 11 Pro', storage: '512GB', basePrice: 350, createdAt: '2025-08-12 12:42:35' },
  { id: 9, model: 'iPhone 11 Pro Max', storage: '128GB', basePrice: 300, createdAt: '2025-08-12 12:42:35' },
  { id: 10, model: 'iPhone 11 Pro Max', storage: '256GB', basePrice: 350, createdAt: '2025-08-12 12:42:35' },
  { id: 11, model: 'iPhone 11 Pro Max', storage: '512GB', basePrice: 400, createdAt: '2025-08-12 12:42:35' },
  { id: 12, model: 'iPhone 12', storage: '128GB', basePrice: 350, createdAt: '2025-08-12 12:42:35' },
  { id: 13, model: 'iPhone 12', storage: '256GB', basePrice: 350, createdAt: '2025-08-12 12:42:35' },
  { id: 14, model: 'iPhone 12', storage: '512GB', basePrice: 400, createdAt: '2025-08-12 12:42:35' },
  { id: 15, model: 'iPhone 12 Mini', storage: '128GB', basePrice: 300, createdAt: '2025-08-12 12:42:35' },
  { id: 16, model: 'iPhone 12 Mini', storage: '256GB', basePrice: 350, createdAt: '2025-08-12 12:42:35' },
  { id: 17, model: 'iPhone 12 Mini', storage: '512GB', basePrice: 350, createdAt: '2025-08-12 12:42:35' },
  { id: 18, model: 'iPhone 12 Pro', storage: '128GB', basePrice: 400, createdAt: '2025-08-12 12:42:35' },
  { id: 19, model: 'iPhone 12 Pro', storage: '256GB', basePrice: 450, createdAt: '2025-08-12 12:42:35' },
  { id: 20, model: 'iPhone 12 Pro', storage: '512GB', basePrice: 500, createdAt: '2025-08-12 12:42:35' },
  { id: 21, model: 'iPhone 12 Pro Max', storage: '128GB', basePrice: 450, createdAt: '2025-08-12 12:42:35' },
  { id: 22, model: 'iPhone 12 Pro Max', storage: '256GB', basePrice: 500, createdAt: '2025-08-12 12:42:35' },
  { id: 23, model: 'iPhone 12 Pro Max', storage: '512GB', basePrice: 550, createdAt: '2025-08-12 12:42:35' },
  { id: 24, model: 'iPhone 13', storage: '128GB', basePrice: 450, createdAt: '2025-08-12 12:42:35' },
  { id: 25, model: 'iPhone 13', storage: '256GB', basePrice: 500, createdAt: '2025-08-12 12:42:35' },
  { id: 26, model: 'iPhone 13', storage: '512GB', basePrice: 550, createdAt: '2025-08-12 12:42:35' },
  { id: 27, model: 'iPhone 13 Mini', storage: '128GB', basePrice: 400, createdAt: '2025-08-12 12:42:35' },
  { id: 28, model: 'iPhone 13 Mini', storage: '256GB', basePrice: 450, createdAt: '2025-08-12 12:42:35' },
  { id: 29, model: 'iPhone 13 Mini', storage: '512GB', basePrice: 500, createdAt: '2025-08-12 12:42:35' },
  { id: 30, model: 'iPhone 13 Pro', storage: '128GB', basePrice: 550, createdAt: '2025-08-12 12:42:35' },
  { id: 31, model: 'iPhone 13 Pro', storage: '256GB', basePrice: 600, createdAt: '2025-08-12 12:42:35' },
  { id: 32, model: 'iPhone 13 Pro', storage: '512GB', basePrice: 650, createdAt: '2025-08-12 12:42:35' },
  { id: 33, model: 'iPhone 13 Pro', storage: '1TB', basePrice: 700, createdAt: '2025-08-12 12:42:35' },
  { id: 34, model: 'iPhone 13 Pro Max', storage: '128GB', basePrice: 600, createdAt: '2025-08-12 12:42:35' },
  { id: 35, model: 'iPhone 13 Pro Max', storage: '256GB', basePrice: 650, createdAt: '2025-08-12 12:42:35' },
  { id: 36, model: 'iPhone 13 Pro Max', storage: '512GB', basePrice: 700, createdAt: '2025-08-12 12:42:35' },
  { id: 37, model: 'iPhone 13 Pro Max', storage: '1TB', basePrice: 700, createdAt: '2025-08-12 12:42:35' },
  { id: 38, model: 'iPhone 14', storage: '128GB', basePrice: 600, createdAt: '2025-08-12 12:42:35' },
  { id: 39, model: 'iPhone 14', storage: '256GB', basePrice: 650, createdAt: '2025-08-12 12:42:35' },
  { id: 40, model: 'iPhone 14', storage: '512GB', basePrice: 700, createdAt: '2025-08-12 12:42:35' },
  { id: 41, model: 'iPhone 14 Plus', storage: '128GB', basePrice: 650, createdAt: '2025-08-12 12:42:35' },
  { id: 42, model: 'iPhone 14 Plus', storage: '256GB', basePrice: 700, createdAt: '2025-08-12 12:42:35' },
  { id: 43, model: 'iPhone 14 Plus', storage: '512GB', basePrice: 750, createdAt: '2025-08-12 12:42:35' },
  { id: 44, model: 'iPhone 14 Pro', storage: '128GB', basePrice: 750, createdAt: '2025-08-12 12:42:35' },
  { id: 45, model: 'iPhone 14 Pro', storage: '256GB', basePrice: 800, createdAt: '2025-08-12 12:42:35' },
  { id: 46, model: 'iPhone 14 Pro', storage: '512GB', basePrice: 850, createdAt: '2025-08-12 12:42:35' },
  { id: 47, model: 'iPhone 14 Pro', storage: '1TB', basePrice: 900, createdAt: '2025-08-12 12:42:35' },
  { id: 48, model: 'iPhone 14 Pro Max', storage: '128GB', basePrice: 850, createdAt: '2025-08-12 12:42:35' },
  { id: 49, model: 'iPhone 14 Pro Max', storage: '256GB', basePrice: 850, createdAt: '2025-08-12 12:42:35' },
  { id: 50, model: 'iPhone 14 Pro Max', storage: '512GB', basePrice: 900, createdAt: '2025-08-12 12:42:35' },
  { id: 51, model: 'iPhone 14 Pro Max', storage: '1TB', basePrice: 950, createdAt: '2025-08-12 12:42:35' },
  { id: 52, model: 'iPhone 15', storage: '128GB', basePrice: 850, createdAt: '2025-08-12 12:42:35' },
  { id: 53, model: 'iPhone 15', storage: '256GB', basePrice: 850, createdAt: '2025-08-12 12:42:35' },
  { id: 54, model: 'iPhone 15', storage: '512GB', basePrice: 900, createdAt: '2025-08-12 12:42:35' },
  { id: 55, model: 'iPhone 15 Plus', storage: '128GB', basePrice: 900, createdAt: '2025-08-12 12:42:35' },
  { id: 56, model: 'iPhone 15 Plus', storage: '256GB', basePrice: 950, createdAt: '2025-08-12 12:42:35' },
  { id: 57, model: 'iPhone 15 Plus', storage: '512GB', basePrice: 1000, createdAt: '2025-08-12 12:42:35' },
  { id: 58, model: 'iPhone 15 Pro', storage: '128GB', basePrice: 1050, createdAt: '2025-08-12 12:42:35' },
  { id: 59, model: 'iPhone 15 Pro', storage: '256GB', basePrice: 1050, createdAt: '2025-08-12 12:42:35' },
  { id: 60, model: 'iPhone 15 Pro', storage: '512GB', basePrice: 1100, createdAt: '2025-08-12 12:42:35' },
  { id: 61, model: 'iPhone 15 Pro', storage: '1TB', basePrice: 1150, createdAt: '2025-08-12 12:42:35' },
  { id: 62, model: 'iPhone 15 Pro Max', storage: '128GB', basePrice: 1150, createdAt: '2025-08-12 12:42:35' },
  { id: 63, model: 'iPhone 15 Pro Max', storage: '256GB', basePrice: 1150, createdAt: '2025-08-12 12:42:35' },
  { id: 64, model: 'iPhone 15 Pro Max', storage: '512GB', basePrice: 1200, createdAt: '2025-08-12 12:42:35' },
  { id: 65, model: 'iPhone 15 Pro Max', storage: '1TB', basePrice: 1250, createdAt: '2025-08-12 12:42:35' },
  { id: 66, model: 'iPhone 16', storage: '128GB', basePrice: 950, createdAt: '2025-08-12 12:42:35' },
  { id: 67, model: 'iPhone 16', storage: '256GB', basePrice: 1000, createdAt: '2025-08-12 12:42:35' },
  { id: 68, model: 'iPhone 16', storage: '512GB', basePrice: 1050, createdAt: '2025-08-12 12:42:35' },
  { id: 69, model: 'iPhone 16 Plus', storage: '128GB', basePrice: 1050, createdAt: '2025-08-12 12:42:35' },
  { id: 70, model: 'iPhone 16 Plus', storage: '256GB', basePrice: 1050, createdAt: '2025-08-12 12:42:35' },
  { id: 71, model: 'iPhone 16 Plus', storage: '512GB', basePrice: 1100, createdAt: '2025-08-12 12:42:35' },
  { id: 72, model: 'iPhone 16 Pro', storage: '128GB', basePrice: 1200, createdAt: '2025-08-12 12:42:35' },
  { id: 73, model: 'iPhone 16 Pro', storage: '256GB', basePrice: 1200, createdAt: '2025-08-12 12:42:35' },
  { id: 74, model: 'iPhone 16 Pro', storage: '512GB', basePrice: 1250, createdAt: '2025-08-12 12:42:35' },
  { id: 75, model: 'iPhone 16 Pro', storage: '1TB', basePrice: 1300, createdAt: '2025-08-12 12:42:35' },
  { id: 76, model: 'iPhone 16 Pro Max', storage: '128GB', basePrice: 1300, createdAt: '2025-08-12 12:42:35' },
  { id: 77, model: 'iPhone 16 Pro Max', storage: '256GB', basePrice: 1300, createdAt: '2025-08-12 12:42:35' },
  { id: 78, model: 'iPhone 16 Pro Max', storage: '512GB', basePrice: 1350, createdAt: '2025-08-12 12:42:35' },
  { id: 79, model: 'iPhone 16 Pro Max', storage: '1TB', basePrice: 1400, createdAt: '2025-08-12 12:42:35' },
]

// Repair costs data from CSV
export const repairCosts: RepairCost[] = [
  { id: 1, model: 'iPhone X', screenRepair: 80, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 120, createdAt: '2025-08-12 12:42:34' },
  { id: 2, model: 'iPhone 11', screenRepair: 85, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 120, createdAt: '2025-08-12 12:42:34' },
  { id: 3, model: 'iPhone 11 Pro', screenRepair: 95, batteryRepair: 60, chargingPort: 80, cameraRepair: 120, backGlass: 150, createdAt: '2025-08-12 12:42:35' },
  { id: 4, model: 'iPhone 11 Pro Max', screenRepair: 100, batteryRepair: 60, chargingPort: 80, cameraRepair: 120, backGlass: 150, createdAt: '2025-08-12 12:42:35' },
  { id: 5, model: 'iPhone 12', screenRepair: 100, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 6, model: 'iPhone 12 Mini', screenRepair: 100, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 7, model: 'iPhone 12 Pro', screenRepair: 110, batteryRepair: 60, chargingPort: 80, cameraRepair: 120, backGlass: 160, createdAt: '2025-08-12 12:42:35' },
  { id: 8, model: 'iPhone 12 Pro Max', screenRepair: 120, batteryRepair: 60, chargingPort: 80, cameraRepair: 120, backGlass: 160, createdAt: '2025-08-12 12:42:35' },
  { id: 9, model: 'iPhone 13', screenRepair: 110, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 10, model: 'iPhone 13 Mini', screenRepair: 110, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 11, model: 'iPhone 13 Pro', screenRepair: 130, batteryRepair: 60, chargingPort: 80, cameraRepair: 120, backGlass: 180, createdAt: '2025-08-12 12:42:35' },
  { id: 12, model: 'iPhone 13 Pro Max', screenRepair: 130, batteryRepair: 60, chargingPort: 80, cameraRepair: 120, backGlass: 180, createdAt: '2025-08-12 12:42:35' },
  { id: 13, model: 'iPhone 14', screenRepair: 120, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 14, model: 'iPhone 14 Plus', screenRepair: 130, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 15, model: 'iPhone 14 Pro', screenRepair: 180, batteryRepair: 60, chargingPort: 80, cameraRepair: 150, backGlass: 220, createdAt: '2025-08-12 12:42:35' },
  { id: 16, model: 'iPhone 14 Pro Max', screenRepair: 200, batteryRepair: 60, chargingPort: 80, cameraRepair: 150, backGlass: 220, createdAt: '2025-08-12 12:42:35' },
  { id: 17, model: 'iPhone 15', screenRepair: 150, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 18, model: 'iPhone 15 Plus', screenRepair: 160, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 19, model: 'iPhone 15 Pro', screenRepair: 180, batteryRepair: 60, chargingPort: 80, cameraRepair: 150, backGlass: 220, createdAt: '2025-08-12 12:42:35' },
  { id: 20, model: 'iPhone 15 Pro Max', screenRepair: 200, batteryRepair: 60, chargingPort: 80, cameraRepair: 150, backGlass: 220, createdAt: '2025-08-12 12:42:35' },
  { id: 21, model: 'iPhone 16', screenRepair: 180, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 22, model: 'iPhone 16 Plus', screenRepair: 190, batteryRepair: 60, chargingPort: 80, cameraRepair: 100, backGlass: 130, createdAt: '2025-08-12 12:42:35' },
  { id: 23, model: 'iPhone 16 Pro', screenRepair: 220, batteryRepair: 60, chargingPort: 80, cameraRepair: 150, backGlass: 220, createdAt: '2025-08-12 12:42:35' },
  { id: 24, model: 'iPhone 16 Pro Max', screenRepair: 250, batteryRepair: 60, chargingPort: 80, cameraRepair: 150, backGlass: 220, createdAt: '2025-08-12 12:42:35' },
]

// Helper function to get unique iPhone models
export const getUniqueModels = (): string[] => {
  const models = new Set(iphonePricing.map(item => item.model))
  return Array.from(models).sort()
}

// Helper function to get storage options for a model
export const getStorageOptions = (model: string): string[] => {
  return iphonePricing
    .filter(item => item.model === model)
    .map(item => item.storage)
    .sort((a, b) => {
      const aNum = parseInt(a)
      const bNum = parseInt(b)
      return aNum - bNum
    })
}

// Helper function to get base price
export const getBasePrice = (model: string, storage: string): number => {
  const item = iphonePricing.find(p => p.model === model && p.storage === storage)
  return item?.basePrice || 0
}

// Helper function to get repair costs for a model
export const getRepairCosts = (model: string): RepairCost | undefined => {
  return repairCosts.find(r => r.model === model)
}

// Damage mapping for quote calculation
export const damageMap = {
  'screen_damage': (model: string) => getRepairCosts(model)?.screenRepair || 0,
  'battery_issues': (model: string) => getRepairCosts(model)?.batteryRepair || 0,
  'charging_port': (model: string) => getRepairCosts(model)?.chargingPort || 0,
  'camera_damage': (model: string) => getRepairCosts(model)?.cameraRepair || 0,
  'back_glass': (model: string) => getRepairCosts(model)?.backGlass || 0,
}

// Model categories for margin calculation
export const getModelCategory = (model: string): 'base' | 'pro' | 'pro_max' => {
  if (model.includes('Pro Max')) return 'pro_max'
  if (model.includes('Pro')) return 'pro'
  return 'base'
}