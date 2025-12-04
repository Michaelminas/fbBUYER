import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.media.deleteMany();
  await prisma.stateLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.device.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.address.deleteMany();

  // Create sample devices
  const iphone15Pro = await prisma.device.create({
    data: {
      model: 'iPhone 15 Pro',
      storage: '128',
      family: 'iPhone 15',
      type: 'Pro'
    }
  });

  const iphone14 = await prisma.device.create({
    data: {
      model: 'iPhone 14',
      storage: '128',
      family: 'iPhone 14',
      type: 'Standard'
    }
  });

  // Create sample lead
  const lead = await prisma.lead.create({
    data: {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Smith',
      phoneNumber: '0412345678',
      address: '123 George Street, Sydney NSW 2000',
      sellMethod: 'pickup',
      pickupFee: 0,
      distance: 15.5,
      isVerified: true
    }
  });

  // Create sample quote
  const quote = await prisma.quote.create({
    data: {
      leadId: lead.id,
      deviceId: iphone15Pro.id,
      damages: JSON.stringify(['Screen (scratches/cracks)']),
      hasBox: true,
      hasCharger: true,
      isActivationLocked: false,
      basePrice: 800.0,
      damageDeduction: 100.0,
      margin: 240.0,
      finalQuote: 460.0,
      pickupFee: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  // Create verification token
  await prisma.verification.create({
    data: {
      leadId: lead.id,
      token: `sample_verified_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: true
    }
  });

  // Create sample schedule slot
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

  const slot = await prisma.scheduleSlot.create({
    data: {
      date: tomorrow,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
      isAvailable: false
    }
  });

  // Create sample appointment
  await prisma.appointment.create({
    data: {
      leadId: lead.id,
      slotId: slot.id,
      status: 'confirmed',
      notes: 'Please call when arriving'
    }
  });

  // Create sample admin user with hashed password
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  await prisma.adminUser.create({
    data: {
      email: 'admin@sellphones.sydney',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      passwordHash
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Sample lead: john@example.com');
  console.log('🔑 Admin login: admin@sellphones.sydney (password: admin123)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });