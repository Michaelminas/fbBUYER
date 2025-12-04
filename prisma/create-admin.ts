import { PrismaClient } from '@prisma/client';
import { createDefaultAdmin } from '../src/lib/auth';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'admin@cashforphonestoday.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const admin = await createDefaultAdmin(
      'admin@cashforphonestoday.com',
      'SecurePassword123!',
      'Admin',
      'User'
    );

    console.log('✅ Default admin user created:');
    console.log('Email: admin@cashforphonestoday.com');
    console.log('Password: SecurePassword123!');
    console.log('Please change this password immediately after first login');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();