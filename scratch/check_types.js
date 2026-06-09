const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function check() {
  const cats = await prisma.category.findMany({
    include: { products: { select: { id: true, name: true, type: true } } }
  });
  for (const cat of cats) {
    const types = [...new Set(cat.products.map(p => p.type))];
    console.log(`Category: "${cat.name}" (${cat.id}) — ${cat.products.length} products — types: [${types.join(', ')}]`);
  }
}

check().catch(console.error);
