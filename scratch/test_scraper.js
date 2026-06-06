const https = require('https');

function getPlayStoreIcon(packageName) {
  return new Promise((resolve) => {
    const url = `https://play.google.com/store/apps/details?id=${packageName}&hl=th`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const match = data.match(/<meta property="og:image" content="([^"]+)"/);
        if (match && match[1]) {
          resolve(match[1]);
        } else {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error('Error fetching package', packageName, err.message);
      resolve(null);
    });
  });
}

async function run() {
  const icon = await getPlayStoreIcon('com.garena.game.kgth');
  console.log('Scraped Icon URL for ROV:', icon);
}

run();
