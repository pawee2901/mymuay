const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});
const prisma = new PrismaClient({ adapter });

async function seed() {
  const defaultProvider = {
    name: 'Maily Space หลัก',
    apiUrl: 'https://api.maily.space/mail/public/mails',
    domains: 'lico.moe,rdcw.plus,gooddaymail.com,rdcw.co.th',
    isActive: true
  };

  await prisma.otpProvider.upsert({
    where: { name: defaultProvider.name },
    update: {
      apiUrl: defaultProvider.apiUrl,
      domains: defaultProvider.domains,
      isActive: defaultProvider.isActive
    },
    create: defaultProvider
  });
  console.log(`Seeded OTP provider: ${defaultProvider.name}`);
}

seed()
  .then(() => console.log('Seed completed successfully!'))
  .catch(err => console.error('Seed failed:', err));
