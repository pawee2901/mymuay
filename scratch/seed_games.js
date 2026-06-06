const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
console.log('Connecting to database at:', dbPath);
const db = new Database(dbPath);

function getPlayStoreIcon(packageName, lang = 'th', country = 'th') {
  return new Promise((resolve) => {
    const url = `https://play.google.com/store/apps/details?id=${packageName}&hl=${lang}&gl=${country}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const match = data.match(/<meta property="og:image" content="([^"]+)"/);
        if (match && match[1]) {
          let cleanUrl = match[1];
          if (cleanUrl.includes('=')) {
            cleanUrl = cleanUrl.split('=')[0] + '=w240-h240';
          } else {
            cleanUrl += '=w240-h240';
          }
          resolve(cleanUrl);
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

const gamesList = [
  {
    key: 'rov',
    name: 'Garena ROV',
    packageName: 'com.garena.game.kgth',
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/Uezg8ZC7krrxV1VfE03Mahzr174mlPoYQBraGypDXeGamJZszE0kZ_Jl0CtpwQELYWe9fw4M55Tqiucpm0tzi7E=w240-h240',
    packages: [
      { id: 'rov_90', name: '90 คูปอง (+แถมเพิ่ม)', price: 79 },
      { id: 'rov_210', name: '210 คูปอง (+แถมเพิ่ม)', price: 179 },
      { id: 'rov_450', name: '450 คูปอง (+แถมเพิ่ม)', price: 379 },
      { id: 'rov_900', name: '900 คูปอง (+แถมเพิ่ม)', price: 749 },
      { id: 'rov_1800', name: '1,800 คูปอง (+แถมเพิ่ม)', price: 1479 }
    ]
  },
  {
    key: 'freefire',
    name: 'Free Fire',
    packageName: 'com.dts.freefireth',
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/9t4ZJ5sD4f0d_jTj8J3a-B8XvXh8pY9=w240-h240',
    packages: [
      { id: 'ff_70', name: '70 Diamonds', price: 39 },
      { id: 'ff_210', name: '210 Diamonds', price: 109 },
      { id: 'ff_530', name: '530 Diamonds', price: 279 },
      { id: 'ff_1080', name: '1,080 Diamonds', price: 549 },
      { id: 'ff_2200', name: '2,200 Diamonds', price: 1079 }
    ]
  },
  {
    key: 'undawn',
    name: 'Garena Undawn',
    packageName: 'com.garena.game.lmjx', // Using the correct working package name for Undawn
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/2s442m30g1jJ1s1c0R51L4V0n1_4=w240-h240',
    packages: [
      { id: 'ud_80', name: '80 RC', price: 39 },
      { id: 'ud_400', name: '400 RC', price: 189 },
      { id: 'ud_800', name: '800 RC', price: 369 },
      { id: 'ud_2000', name: '2,000 RC', price: 919 }
    ]
  },
  {
    key: 'codm',
    name: 'Call of Duty Mobile',
    packageName: 'com.garena.game.codm',
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/Gj3H99LzSleE9zR6R5HkE6_mEoqLSw-tWwt4m4=w240-h240',
    packages: [
      { id: 'cod_80', name: '80 CP', price: 39 },
      { id: 'cod_400', name: '400 CP', price: 189 },
      { id: 'cod_800', name: '800 CP', price: 369 },
      { id: 'cod_2000', name: '2,000 CP', price: 919 }
    ]
  },
  {
    key: 'deltaforce',
    name: 'Delta Force',
    packageName: 'com.proxima.dfm',
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/mLgL7u-F5_q_gdqiPgtQbEZZk-0Mmn6fGP15VbwHiNO3lIcpsc_RzDYhUG8XynBxltU=w240-h240',
    packages: [
      { id: 'df_60', name: '60 Coins', price: 39 },
      { id: 'df_300', name: '300 Coins', price: 189 },
      { id: 'df_980', name: '980 Coins', price: 569 },
      { id: 'df_1980', name: '1,980 Coins', price: 1099 }
    ]
  },
  {
    key: 'haikyu',
    name: 'Haikyu Fly High',
    packageName: 'com.haifura.cyoujp.gp', // Using Japanese package name which is active and scrapes correctly
    lang: 'ja',
    country: 'jp',
    fallbackIcon: 'https://play-lh.googleusercontent.com/haikyu-icon=w240-h240',
    packages: [
      { id: 'hq_60', name: '60 Tokens', price: 39 },
      { id: 'hq_300', name: '300 Tokens', price: 189 },
      { id: 'hq_980', name: '980 Tokens', price: 569 },
      { id: 'hq_1980', name: '1,980 Tokens', price: 1099 }
    ]
  },
  {
    key: 'pubg',
    name: 'PUBG Mobile',
    packageName: 'com.tencent.ig',
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/com.tencent.ig=w240-h240',
    packages: [
      { id: 'pubg_60', name: '60 UC', price: 39 },
      { id: 'pubg_325', name: '325 UC', price: 189 },
      { id: 'pubg_660', name: '660 UC', price: 369 },
      { id: 'pubg_1800', name: '1,800 UC', price: 919 },
      { id: 'pubg_3850', name: '3,850 UC', price: 1819 }
    ]
  },
  {
    key: 'mlbb',
    name: 'Mobile Legends',
    packageName: 'com.mobile.legends',
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/com.mobile.legends=w240-h240',
    packages: [
      { id: 'ml_50', name: '50 Diamonds', price: 39 },
      { id: 'ml_150', name: '150 Diamonds', price: 109 },
      { id: 'ml_500', name: '500 Diamonds', price: 369 },
      { id: 'ml_1000', name: '1,000 Diamonds', price: 729 }
    ]
  },
  {
    key: 'valorant',
    name: 'Valorant',
    packageName: null, // PC only
    fallbackIcon: 'https://avatars.githubusercontent.com/u/60320490?s=280&v=4',
    packages: [
      { id: 'val_375', name: '375 VP', price: 129 },
      { id: 'val_750', name: '750 VP', price: 249 },
      { id: 'val_1650', name: '1,650 VP', price: 519 },
      { id: 'val_2850', name: '2,850 VP', price: 879 },
      { id: 'val_5800', name: '5,800 VP', price: 1729 }
    ]
  },
  {
    key: 'heartopia',
    name: 'Heartopia',
    packageName: 'com.xd.xdtglobal.gp',
    lang: 'th',
    country: 'th',
    fallbackIcon: 'https://play-lh.googleusercontent.com/com.xd.xdtglobal.gp=w240-h240',
    packages: [
      { id: 'ht_60', name: '60 Coins', price: 39 },
      { id: 'ht_300', name: '300 Coins', price: 189 },
      { id: 'ht_980', name: '980 Coins', price: 569 },
      { id: 'ht_1980', name: '1,980 Coins', price: 1099 }
    ]
  }
];

async function seed() {
  console.log('Starting seed process...');
  
  for (const game of gamesList) {
    let iconUrl = game.fallbackIcon;
    
    if (game.packageName) {
      console.log(`Scraping icon for ${game.name}...`);
      const scraped = await getPlayStoreIcon(game.packageName, game.lang, game.country);
      if (scraped) {
        iconUrl = scraped;
        console.log(`  Scraped: ${iconUrl}`);
      } else {
        console.log(`  Scrape failed, using fallback: ${iconUrl}`);
      }
    }
    
    // Find or create category
    let category = db.prepare('SELECT id FROM Category WHERE name = ?').get(game.name);
    let categoryId;
    
    if (category) {
      categoryId = category.id;
      db.prepare('UPDATE Category SET image = ? WHERE id = ?').run(iconUrl, categoryId);
      console.log(`Updated existing category ${game.name}`);
    } else {
      categoryId = game.key + '_cat';
      db.prepare('INSERT INTO Category (id, name, image) VALUES (?, ?, ?)').run(categoryId, game.name, iconUrl);
      console.log(`Created new category ${game.name} with ID ${categoryId}`);
    }
    
    // Insert packages
    for (const pkg of game.packages) {
      const existingProduct = db.prepare('SELECT id FROM Product WHERE id = ?').get(pkg.id);
      const description = `บริการเติมเงินเกม ${game.name} ระบบออโต้ รวดเร็ว ทันใจ ได้รับเครดิตทันที 24 ชั่วโมง ปลอดภัย 100% เพียงระบุ Player ID / OpenID`;
      
      if (existingProduct) {
        db.prepare('UPDATE Product SET name = ?, price = ?, image = ?, description = ? WHERE id = ?').run(
          pkg.name,
          pkg.price,
          iconUrl,
          description,
          pkg.id
        );
        console.log(`  Updated package ${pkg.name} (${pkg.id})`);
      } else {
        db.prepare('INSERT INTO Product (id, name, description, price, image, type, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          pkg.id,
          pkg.name,
          description,
          pkg.price,
          iconUrl,
          'TOPUP',
          categoryId
        );
        console.log(`  Inserted package ${pkg.name} (${pkg.id})`);
      }
    }
  }
  
  console.log('Seeding finished successfully!');
}

async function run() {
  try {
    await seed();
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    db.close();
  }
}

run();
