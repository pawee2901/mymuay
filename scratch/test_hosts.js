const imaps = require('imap-simple');

const email = 'mymuay002@hotmail.com';
const password = 'uasyppidthwwmovl';

async function testHosts() {
  const hosts = ['outlook.office365.com', 'imap-mail.outlook.com'];

  for (const host of hosts) {
    console.log(`Testing host: ${host}...`);
    const config = {
      imap: {
        user: email,
        password: password,
        host: host,
        port: 993,
        tls: true,
        authTimeout: 10000,
        connTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    try {
      const connection = await imaps.connect(config);
      console.log(`SUCCESS with host: ${host}!`);
      connection.end();
      return;
    } catch (err) {
      console.error(`FAILED with host: ${host}. Error:`, err.message || err);
    }
  }
}

testHosts();
