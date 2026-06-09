const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});
const prisma = new PrismaClient({ adapter });

async function remove() {
  const result = await prisma.emailImapSetting.delete({
    where: { domain: 'mymuay002@hotmail.com' }
  });
  console.log('Deleted:', result.domain);
}

remove().catch(console.error);
