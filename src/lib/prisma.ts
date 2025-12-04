import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Optimized Prisma configuration for performance and concurrent connections
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  ...(process.env.DATABASE_URL && {
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  // Note: Advanced connection pool settings removed for build compatibility
  // These should be configured at the database level in production
})

// Optimize for development environment
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}