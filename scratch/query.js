const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});
const prisma = new PrismaClient({ adapter });

prisma.otpApp.findMany()
  .then(res => {
    console.log('OTP_APPS:', JSON.stringify(res, null, 2));
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
