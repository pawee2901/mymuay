const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
require('dotenv').config();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

const games = [
  ['rov_cat', 'ROV', 'rov', 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png'],
  ['freefire_cat', 'Free Fire', 'freefire', 'https://placehold.co/320x320/fef08a/2563eb?text=Free+Fire'],
  ['undawn_cat', 'Undawn', 'undawn', 'https://placehold.co/320x320/fed7aa/2563eb?text=Undawn'],
  ['codm_cat', 'Call of Duty mobile', 'callofduty', 'https://placehold.co/320x320/bae6fd/2563eb?text=Call+of+Duty'],
  ['deltaforce_cat', 'Delta Force', 'deltaforce', 'https://placehold.co/320x320/cbd5e1/2563eb?text=Delta+Force'],
  ['haikyu_cat', 'Haikyu Fly High', 'haikyuflyhigh', 'https://placehold.co/320x320/fed7aa/2563eb?text=Haikyu'],
  ['pubg_cat', 'PubG Mobile', 'pubg', 'https://placehold.co/320x320/dbeafe/2563eb?text=PUBG+Mobile'],
  ['mlbb_cat', 'Mobile Legends', 'mlbb', 'https://placehold.co/320x320/fecaca/2563eb?text=Mobile+Legends'],
  ['valorant_cat', 'Valorant', 'val', 'https://placehold.co/320x320/f8fafc/f43f5e?text=VALORANT'],
  ['heartopia_cat', 'Heartopia', 'htp', 'https://placehold.co/320x320/fce7f3/2563eb?text=Heartopia'],
];

const couponLabel = '\u0e04\u0e39\u0e1b\u0e2d\u0e07';

const rovPacks = [
  [11, 10, 9.45, 'R00011'], [24, 20, 18.90, 'R00024'], [60, 50, 47.25, 'R00060'], [110, 90, 85.05, 'R00110'],
  [185, 150, 141.75, 'R00185'], [209, 170, 160.65, 'R00209'], [256, 210, 198.45, 'R00257'], [295, 240, 226.80, 'R00295'],
  [306, 250, 236.25, 'R00307'], [370, 300, 283.50, 'R00370'], [405, 330, 311.85, 'R00406'], [504, 410, 387.45, 'R00504'],
  [555, 450, 425.25, 'R00555'], [620, 500, 472.50, 'R00620'], [704, 570, 538.65, 'R00704'], [805, 650, 614.25, 'R00805'],
  [915, 740, 699.30, 'R00915'], [1240, 1000, 945.00, 'R01240'], [1860, 1500, 1417.50, 'R01860'], [2230, 1800, 1701.00, 'R02230'],
  [2480, 2000, 1890.00, 'R02480'], [2850, 2300, 2173.50, 'R02850'], [3100, 2500, 2362.50, 'R03100'], [3160, 2550, 2409.75, 'R03160'],
  [3604, 2910, 2749.95, 'R03604'], [3830, 3090, 2920.05, 'R03830'], [4090, 3300, 3118.50, 'R04090'], [4525, 3650, 3449.25, 'R04525'],
  [4710, 3800, 3591.00, 'R04710'], [4960, 4000, 3780.00, 'R04960'], [5020, 4050, 3827.25, 'R05020'], [5580, 4500, 4252.50, 'R05580'],
  [6200, 5000, 4725.00, 'R06200'],
];

const gamePacks = {
  freefire_cat: [
    ['33 เพชร', 9.45], ['68 เพชร', 18.90], ['101 เพชร', 28.35], ['136 เพชร', 37.80], ['172 เพชร', 47.25], ['205 เพชร', 56.70],
    ['240 เพชร', 66.15], ['273 เพชร', 75.60], ['310 เพชร', 85.05], ['343 เพชร', 94.50], ['378 เพชร', 103.95], ['411 เพชร', 113.40],
    ['446 เพชร', 122.85], ['482 เพชร', 132.30], ['517 เพชร', 141.75], ['620 เพชร', 170.10], ['690 เพชร', 189.00], ['862 เพชร', 236.25],
    ['1052 เพชร', 283.50], ['1224 เพชร', 330.75], ['1362 เพชร', 368.55], ['1801 เพชร', 472.50], ['1973 เพชร', 519.75], ['2111 เพชร', 557.55],
    ['2318 เพชร', 614.25], ['2853 เพชร', 756.00], ['3698 เพชร', 945.00], ['5499 เพชร', 1417.50], ['7396 เพชร', 1890.00], ['9197 เพชร', 2362.50],
    ['11094 เพชร', 2835.00], ['18490 เพชร', 4725.00], ['สมาชิกเพชร (รายสัปดาห์)', 63.10], ['สมาชิกเพชร (สมาชิกเพชรแบบคู่)', 31.50],
    ['สมาชิกเพชร (รายเดือน)', 283.50], ['บูย่าพาส', 85.05],
  ],
  undawn_cat: [
    ['55 RC', 18.90], ['138 RC', 47.25], ['253 RC', 85.05], ['440 RC', 141.75], ['880 RC', 283.50], ['1485 RC', 472.50],
    ['2970 RC', 945.00], ['4510 RC', 1417.50], ['6050 RC', 1890.00], ['9218 RC', 2835.00], ['15642 RC', 4725.00],
    ['คูปองเสบียงรายสัปดาห์', 74.34], ['คูปองเสบียงรายเดือน', 121.59], ['กองทุนเติบโต', 253.89], ['Advanced Glory Pass', 357.84],
    ['กองทุนเฉลี่ย', 329.49], ['Ace Fund', 357.84],
  ],
  codm_cat: [
    ['48 CP', 18.90], ['126 CP', 47.25], ['227 CP', 85.05], ['252 CP', 94.50], ['378 CP', 141.75], ['792 CP', 283.50],
    ['1440 CP', 472.50], ['3000 CP', 945.00],
  ],
  deltaforce_cat: [
    ['19 Coins', 9.45], ['32 Coins', 16.38], ['63 Coins', 32.13], ['336 Coins', 165.69], ['482 Coins', 231.84], ['785 Coins', 326.34],
    ['1544 Coins', 652.05], ['2065 Coins', 817.74], ['4114 Coins', 1634.85], ['8424 Coins', 3269.70], ['16848 Coins', 6539.40], ['25272 Coins', 9828.00],
    ['Echo Supplies', 22.68], ['Echo Supplies - Advanced', 69.31],
  ],
  haikyu_cat: [
    ['60 Star Gems', 31.50], ['300 Star Gems', 157.50], ['980 Star Gems', 472.50], ['1980 Star Gems', 945.00], ['3280 Star Gems', 1575.00], ['6480 Star Gems', 3150.00],
    ['แพ็กสำหรับผู้เล่นใหม่', 28.35], ['แพ็กเบิร์ดครั้งแรก', 198.45], ['แพ็กความหวังจากดั้งแรก', 708.75], ['แพ็กการเติบโตครั้งแรก', 850.50],
    ['โบนัสเพิ่มเสน่ห์', 283.50], ['ตั๋วเริ่มมิตรอัลตร้า I', 28.35], ['ตั๋วเริ่มมิตรอัลตร้า II', 141.75], ['ตั๋วเริ่มมิตรอัลตร้า III', 368.55],
    ['ตั๋วเริ่มมิตรอัลตร้า IV', 850.50], ['ตั๋วเริ่มมิตรอัลตร้า V', 1417.50], ['ตั๋วเริ่มมิตรอัลตร้า VI', 2835.00],
    ['ตั๋วรับสมัคร x1', 28.35], ['ตั๋วรับสมัคร x5', 141.75], ['ตั๋วรับสมัคร x10', 368.55], ['ตั๋วรับสมัคร x20', 850.50], ['ตั๋วรับสมัคร x30', 1417.50], ['ตั๋วรับสมัคร x55', 2835.00],
  ],
  pubg_cat: [
    ['60 UC', 30.88], ['180 UC', 92.66], ['325 UC', 147.86], ['385 UC', 178.74], ['660 UC', 295.72], ['720 UC', 326.60],
    ['985 UC', 443.58], ['1045 UC', 474.47], ['1320 UC', 591.44], ['1800 UC', 725.08], ['1920 UC', 786.86], ['2125 UC', 872.94],
    ['2460 UC', 1020.80], ['3850 UC', 1435.46], ['4510 UC', 1731.19], ['5650 UC', 2160.55], ['8100 UC', 2836.17], ['9900 UC', 3561.25],
    ['11950 UC', 4271.63], ['24300 UC', 8508.50],
  ],
  mlbb_cat: [
    ['86 เพชร', 40.64], ['172 เพชร', 79.86], ['257 เพชร', 115.12], ['275 เพชร', 125.08], ['343 เพชร', 158.90], ['429 เพชร', 195.00],
    ['600 เพชร', 271.61], ['706 เพชร', 314.23], ['792 เพชร', 351.12], ['1049 เพชร', 465.69], ['2195 เพชร', 989.52], ['3688 เพชร', 1588.44],
    ['5532 เพชร', 2413.04], ['9288 เพชร', 3949.40], ['50+5 Diamonds (เติมครั้งแรกได้โบนัสเพิ่ม 50)', 29.69],
    ['150+15 Diamonds (เติมครั้งแรกได้โบนัสเพิ่ม 150)', 88.16], ['250+25 Diamonds (เติมครั้งแรกได้โบนัสเพิ่ม 250)', 142.75],
    ['500+65 Diamonds (เติมครั้งแรกได้โบนัสเพิ่ม 500 เพชร)', 291.76], ['Twilight Miya Pass', 294.18], ['One Time Weekly', 56.09],
  ],
  valorant_cat: [
    ['475 Point', 122.20], ['1000 Point', 244.40], ['2050 Point', 488.80], ['3650 Point', 864.80], ['5350 Point', 1240.80], ['11000 Point', 2481.60],
  ],
  heartopia_cat: [
    ['20 เพชรหัวใจ', 19.00], ['60 เพชรหัวใจ', 35.00], ['320 เพชรหัวใจ', 165.00], ['730 เพชรหัวใจ', 349.00],
    ['1370 เพชรหัวใจ', 629.00], ['2130 เพชรหัวใจ', 956.00], ['3550 เพชรหัวใจ', 1585.00], ['7050 เพชรหัวใจ', 3070.00],
  ],
};

const packCodesByGame = {
  freefire_cat: [
    'F00033', 'F00068', 'F00101', 'F00136', 'F00172', 'F00205',
    'F00240', 'F00273', 'F00310', 'F00343', 'F00378', 'F00411',
    'F00446', 'F00482', 'F00517', 'F00620', 'F00690', 'F00862',
    'F01052', 'F01224', 'F01362', 'F01801', 'F01973', 'F02111',
    'F02318', 'F02853', 'F03698', 'F05499', 'F07396', 'F09197',
    'F11094', 'F18490', 'FDIM63', 'FDIM32', 'FMON280', 'FBPC84',
  ],
  undawn_cat: [
    'U00055', 'U00138', 'U00253', 'U00440', 'U00880', 'U01485',
    'U02970', 'U04510', 'U06050', 'U09218', 'U15642', 'UWEEK79',
    'UMON129', 'UBIG269', 'UGLO379', 'UPRO349', 'UACE379',
  ],
  codm_cat: [
    'C00048', 'C00126', 'C00227', 'C00252', 'C00378', 'C00792',
    'C01440', 'C03000',
  ],
  deltaforce_cat: [
    'D00019', 'D00032', 'D00063', 'D00336', 'D00482', 'D00785',
    'D01544', 'D02065', 'D04114', 'D08424', 'D016848', 'D025272',
    'DMS0036', 'DMSA110',
  ],
  haikyu_cat: [
    'H00060', 'H00300', 'H00980', 'H01980', 'H03280', 'H6480',
    'HNEW0045', 'HFIR0315', 'HMEM1125', 'HBIG1350', 'HLVL0450',
    'HULT0001', 'HULT0002', 'HULT0003', 'HULT0004', 'HULT0005',
    'HULT0006', 'HREG0001', 'HREG0005', 'HREG0010', 'HREG0020',
    'HREG0030', 'HREG0055',
  ],
  pubg_cat: [
    'UC00060', 'UC00180', 'UC00325', 'UC00385', 'UC00660', 'UC00720',
    'UC00985', 'UC01045', 'UC01320', 'UC01800', 'UC01920', 'UC02125',
    'UC02460', 'UC03850', 'UC04510', 'UC05650', 'UC08100', 'UC09909',
    'UC11950', 'UC24300',
  ],
  mlbb_cat: [
    'ML00086', 'ML00172', 'ML00257', 'ML00275', 'ML00343', 'ML00429',
    'ML00600', 'ML00706', 'ML00792', 'ML01049', 'ML02195', 'ML03688',
    'ML05532', 'ML09288', 'MLFT055', 'MLFT165', 'MLFT275', 'MLFT565',
    'MLTMP01', 'MLOTW01',
  ],
  valorant_cat: ['VL00475', 'VL01000', 'VL02050', 'VL03650', 'VL05350', 'VL11000'],
  heartopia_cat: [
    'HTP00020', 'HTP00060', 'HTP00320', 'HTP00730',
    'HTP01370', 'HTP02130', 'HTP03550', 'HTP07050',
  ],
};

function buildOptionId(productId, index, packCode) {
  const suffix = packCode ? packCode.toLowerCase() : `pack_${String(index + 1).padStart(3, '0')}`;
  return `${productId}_${suffix}`;
}

async function upsertGame([id, name, serviceCode, image]) {
  const category = await prisma.category.upsert({
    where: { id },
    update: { name, image },
    create: { id, name, image },
  });

  const product = await prisma.product.upsert({
    where: { id: `${id}_topup` },
    update: {
      name,
      description: `เติมเกม ${name} อัตโนมัติ`,
      image,
      type: 'TOPUP',
      categoryId: category.id,
      gameServiceCode: serviceCode,
    },
    create: {
      id: `${id}_topup`,
      name,
      description: `เติมเกม ${name} อัตโนมัติ`,
      price: 0,
      agentPrice: 0,
      image,
      type: 'TOPUP',
      categoryId: category.id,
      gameServiceCode: serviceCode,
    },
  });

  const packs = id === 'rov_cat'
    ? rovPacks.map(([point, originalPrice, price, packCode], index) => ({
        optionName: `${point} ${couponLabel} | ${originalPrice}`,
        price,
        packCode,
        optionId: buildOptionId(product.id, index, packCode),
      }))
    : (gamePacks[id] || []).map(([optionName, price, packCode = ''], index) => ({
        optionName,
        price,
        packCode: packCodesByGame[id]?.[index] || packCode,
        optionId: buildOptionId(product.id, index, packCodesByGame[id]?.[index] || packCode),
      }));

  await prisma.productOption.deleteMany({
    where: {
      productId: product.id,
      NOT: { id: { in: packs.map((pack) => pack.optionId) } },
    },
  });

  for (const { optionName, price, packCode, optionId } of packs) {
    await prisma.productOption.upsert({
      where: { id: optionId },
      update: {
        name: optionName,
        price,
        agentPrice: 0,
        externalPackCode: packCode,
      },
      create: {
        id: optionId,
        productId: product.id,
        name: optionName,
        price,
        agentPrice: 0,
        externalPackCode: packCode,
      },
    });
  }

  return { name, count: packs.length };
}

async function main() {
  const results = [];

  for (const game of games) {
    results.push(await upsertGame(game));
  }

  console.log(`Seeded ${games.length} game categories and topup products.`);
  for (const result of results) {
    console.log(`- ${result.name}: ${result.count} packs`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
