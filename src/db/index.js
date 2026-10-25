import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Supabase Postgres. DATABASE_URL should be the pooled connection string (port 6543).
function createClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set (Supabase connection string)');
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development
const prisma = globalThis.prisma ?? createClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export { prisma };
export { sendLineNotification } from './lineNotify';
