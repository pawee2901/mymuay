import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

let prisma;

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  });
  prisma = new PrismaClient({ adapter });
} else {
  // In development, use a global variable so the client isn't recreated on hot reload.
  // Self-heal: if global.prisma is missing or stale (lacks key models like user, depositSetting, carouselSlide, or emailImapSetting), re-instantiate it.
  if (!global.prisma || !global.prisma.user || !global.prisma.depositSetting || !global.prisma.carouselSlide || !global.prisma.emailImapSetting) {
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    });
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export { prisma };
export { sendLineNotification } from './lineNotify';
