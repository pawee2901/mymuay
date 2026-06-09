const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const imaps = require('imap-simple');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});
const prisma = new PrismaClient({ adapter });

async function testConnection() {
  const setting = await prisma.emailImapSetting.findUnique({
    where: { domain: 'mymuay002@hotmail.com' }
  });

  if (!setting) {
    console.error('No setting found for mymuay002@hotmail.com');
    return;
  }

  console.log('Testing connection with:');
  console.log('User:', setting.user);
  console.log('Host:', setting.host);
  console.log('Port:', setting.port);
  console.log('TLS:', setting.tls);
  console.log('Password length:', setting.password ? setting.password.length : 0);

  const config = {
    imap: {
      user: setting.user,
      password: setting.password,
      host: setting.host,
      port: setting.port,
      tls: setting.tls,
      authTimeout: 15000,
      connTimeout: 15000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    const connection = await imaps.connect(config);
    console.log('SUCCESS! Connected to IMAP.');
    connection.end();
  } catch (err) {
    console.error('IMAP CONNECT ERROR:', err);
  }
}

testConnection();
