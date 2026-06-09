const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const imaps = require('imap-simple');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});
const prisma = new PrismaClient({ adapter });

const email = 'mymuay002@hotmail.com';
const newPassword = 'lyjnxalnojssmkek';

async function updateAndTest() {
  console.log('Updating password in database...');
  await prisma.emailImapSetting.update({
    where: { domain: email },
    data: { password: newPassword }
  });
  console.log('Password updated!');

  const hosts = ['outlook.office365.com', 'imap-mail.outlook.com'];
  for (const host of hosts) {
    console.log(`Testing host: ${host}...`);
    try {
      const connection = await imaps.connect({
        imap: {
          user: email,
          password: newPassword,
          host: host,
          port: 993,
          tls: true,
          authTimeout: 15000,
          connTimeout: 15000,
          tlsOptions: { rejectUnauthorized: false }
        }
      });
      console.log(`SUCCESS with ${host}!`);
      connection.end();
      return;
    } catch (err) {
      console.error(`FAILED with ${host}:`, err.message);
    }
  }
}

updateAndTest();
