const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
require('dotenv').config();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.user.updateMany({
    where: { username: 'admin' },
    data: { balance: 0.0 }
  });
  console.log(`Updated admin users count: ${updated.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
