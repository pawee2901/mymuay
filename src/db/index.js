import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // Resolve absolute path in both dev and production to avoid relative path issues when CWD changes
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  return `file:${dbPath}`;
};

let prisma;

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaBetterSqlite3({
    url: getDatabaseUrl(),
  });
  prisma = new PrismaClient({ adapter });
} else {
  // In development, use a global variable so the client isn't recreated on hot reload.
  // Self-heal: if global.prisma is missing or stale (lacks key models like user, depositSetting, carouselSlide, or emailImapSetting), re-instantiate it.
  if (!global.prisma || !global.prisma.user || !global.prisma.depositSetting || !global.prisma.carouselSlide || !global.prisma.emailImapSetting) {
    const adapter = new PrismaBetterSqlite3({
      url: getDatabaseUrl(),
    });
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export { prisma };
export { sendLineNotification } from './lineNotify';
// Force reload prisma client configuration after schema migration
