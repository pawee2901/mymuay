import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const searchStarts = [
    process.cwd(),
    typeof __dirname !== 'undefined' ? __dirname : null,
    process.argv[1] ? path.dirname(process.argv[1]) : null
  ].filter(Boolean);

  for (const start of searchStarts) {
    let current = path.resolve(start);
    // Go up to 5 levels to find the directory containing the 'prisma' folder
    for (let i = 0; i < 5; i++) {
      const dbDir = path.join(current, 'prisma');
      const dbPath = path.join(dbDir, 'dev.db');
      if (fs.existsSync(dbDir)) {
        const resolvedPath = dbPath.replace(/\\/g, '/');
        console.log(`[DB AUTO-DISCOVER]: Found database directory at: ${resolvedPath}`);
        return `file:${resolvedPath}`;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  // Fallback to absolute path from current process working directory
  const fallbackPath = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  console.log(`[DB FALLBACK]: Falling back to: ${fallbackPath}`);
  return `file:${fallbackPath}`;
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
