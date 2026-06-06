const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');

// Load environment variables manually
require('dotenv').config();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Clean existing database
  await prisma.order.deleteMany({});
  await prisma.stockItem.deleteMany({});
  await prisma.productOption.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.subcategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.ctaCard.deleteMany({});
  await prisma.chatMessage.deleteMany({});

  // 2. Seed Admin and User
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const userPassword = await bcrypt.hash('user1234', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      balance: 1000.0
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      username: 'user',
      password: userPassword,
      role: 'USER',
      balance: 500.0
    },
  });

  console.log('Seeded Users:', { admin: admin.username, user: normalUser.username });

  // 3. Seed Categories
  const netflixCategory = await prisma.category.create({
    data: {
      name: 'รวม NETFLIX',
      image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
    },
  });

  const disneyCategory = await prisma.category.create({
    data: {
      name: 'Disney plus',
      image: 'https://img.rdcw.co.th/images/5d171ac1ae30f0734bc86828ea3f382cba40cc13c7754a40d2ceab971c9da023.jpg',
    },
  });

  const appPremiumCategory = await prisma.category.create({
    data: {
      name: 'รวม APP PREMIUM',
      image: 'https://img.rdcw.co.th/images/8360fc53760d0ea6123b4c2ead12a094e55d733479e53f38d8da66b8bbdca6b1.jpeg',
    },
  });

  const gameCategory = await prisma.category.create({
    data: {
      name: 'เติมเกม & บัตรเติมเงิน',
      image: 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png',
    },
  });

  console.log('Seeded Categories');

  // 4. Seed Subcategories
  // Subcategories for Netflix
  const nfDailySubcat = await prisma.subcategory.create({
    data: {
      name: 'NF รายวัน | แอคไทย - แอคนอก',
      image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
      categoryId: netflixCategory.id
    }
  });

  const nfThaiSubcat = await prisma.subcategory.create({
    data: {
      name: 'NF แอคไทย | ตัดซิม - วอเลท',
      image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
      categoryId: netflixCategory.id
    }
  });

  const nfOutSubcat = await prisma.subcategory.create({
    data: {
      name: 'NF แอคนอก',
      image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
      categoryId: netflixCategory.id
    }
  });

  // Subcategories for Disney
  const disneyDailySubcat = await prisma.subcategory.create({
    data: {
      name: 'Disney plus รายวัน',
      image: 'https://img.rdcw.co.th/images/5d171ac1ae30f0734bc86828ea3f382cba40cc13c7754a40d2ceab971c9da023.jpg',
      categoryId: disneyCategory.id
    }
  });

  // Subcategories for App Premium
  const spotifySubcat = await prisma.subcategory.create({
    data: {
      name: 'Spotify Premium ทั้งหมด',
      image: 'https://img.rdcw.co.th/images/8360fc53760d0ea6123b4c2ead12a094e55d733479e53f38d8da66b8bbdca6b1.jpeg',
      categoryId: appPremiumCategory.id
    }
  });

  console.log('Seeded Subcategories');

  // 5. Seed Products under Subcategories
  // Products under NF Daily
  const nfWarningProduct = await prisma.product.create({
    data: {
      name: 'อ่านรายละเอียดแต่ละแอพก่อนซื้อ',
      description: 'อ่านรายละเอียดสินค้าทุกครั้ง ในหน้าเมนูที่ต้องการซื้อ เพื่อสิทธิของตัวเองนะคะ\n\nกดรูปค้างไว้+อ่านรายละเอียดสินค้า หรือข้อความด้านล่าง',
      price: 9999.0,
      image: '/images/netflix_warning_card.png',
      type: 'ACCOUNT',
      categoryId: netflixCategory.id,
      subCategoryId: nfDailySubcat.id
    }
  });

  const nf1dProduct = await prisma.product.create({
    data: {
      name: 'Nf 1 D - EXP : 06/06/69 (ไทย - นอก)',
      description: '❌ แอคนอก - ไทย ผสมกัน ❌\n• แอคไทย ปิดไม่เคลม\n• แอคนอกปิดเคลม',
      price: 15.0,
      image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
      type: 'ACCOUNT',
      categoryId: netflixCategory.id,
      subCategoryId: nfDailySubcat.id
    }
  });

  const nf2dProduct = await prisma.product.create({
    data: {
      name: 'Nf 2 D - EXP : 07/06/69 (ไทย - นอก)',
      description: '❌ แอคนอก - ไทย ผสมกัน ❌\n• แอคไทย ปิดไม่เคลม\n• แอคนอกปิดเคลม',
      price: 20.0,
      image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
      type: 'ACCOUNT',
      categoryId: netflixCategory.id,
      subCategoryId: nfDailySubcat.id
    }
  });

  const nf3dProduct = await prisma.product.create({
    data: {
      name: 'Nf 3 D - EXP : 08/06/69 (ไทย - นอก)',
      description: '❌ แอคนอก - ไทย ผสมกัน ❌\n• แอคไทย ปิดไม่เคลม\n• แอคนอกปิดเคลม',
      price: 30.0,
      image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
      type: 'ACCOUNT',
      categoryId: netflixCategory.id,
      subCategoryId: nfDailySubcat.id
    }
  });

  await prisma.product.createMany({
    data: [
      {
        name: 'ตัด 23:59 - EXP : 05/06',
        description: 'บัญชีใช้งานรายวัน ตัดเวลา 23:59 น.',
        price: 8.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfDailySubcat.id
      },
      {
        name: 'ยกแอค NF 1 days',
        description: 'เหมาทั้งไอดี Netflix 1 วัน (แชร์ได้ 5 จอ)',
        price: 999.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfDailySubcat.id
      },
      {
        name: 'Nf 3 D - EXP : 08/06/69',
        description: 'Netflix 3 วัน บัญชีมาตรฐาน',
        price: 25.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfDailySubcat.id
      }
    ]
  });

  // Products under NF Thai Sim Wallet
  await prisma.product.createMany({
    data: [
      {
        name: 'NF แอคไทย 1 วัน (ตัดซิม - วอเลท)',
        description: 'Netflix แอคไทยแท้ ระบบตัดซิม สมัครผ่าน Wallet',
        price: 15.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfThaiSubcat.id
      },
      {
        name: 'NF แอคไทย 7 วัน (ตัดซิม - วอเลท)',
        description: 'Netflix แอคไทยแท้ ระบบตัดซิม สมัครผ่าน Wallet',
        price: 45.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfThaiSubcat.id
      },
      {
        name: 'NF แอคไทย 30 วัน (ตัดซิม - วอเลท)',
        description: 'Netflix แอคไทยแท้ ระบบตัดซิม สมัครผ่าน Wallet',
        price: 150.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfThaiSubcat.id
      },
      {
        name: 'NF แอคไทย 90 วัน (ตัดซิม - วอเลท)',
        description: 'Netflix แอคไทยแท้ ระบบตัดซิม สมัครผ่าน Wallet',
        price: 450.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfThaiSubcat.id
      }
    ]
  });

  // Products under NF Out
  await prisma.product.createMany({
    data: [
      {
        name: 'NF แอคนอก 1 วัน',
        description: 'Netflix บัญชีต่างประเทศ ปลดล็อคคอนเทนต์พิเศษ',
        price: 12.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfOutSubcat.id
      },
      {
        name: 'NF แอคนอก 30 วัน',
        description: 'Netflix บัญชีต่างประเทศ ปลดล็อคคอนเทนต์พิเศษ',
        price: 120.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfOutSubcat.id
      },
      {
        name: 'NF แอคนอก 90 วัน',
        description: 'Netflix บัญชีต่างประเทศ ปลดล็อคคอนเทนต์พิเศษ',
        price: 350.0,
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
        type: 'ACCOUNT',
        categoryId: netflixCategory.id,
        subCategoryId: nfOutSubcat.id
      }
    ]
  });

  // Products under Disney
  const disneyProduct = await prisma.product.create({
    data: {
      name: 'Disney plus 1 day Promo',
      description: 'ดิสนีย์พลัส รายวัน ราคาประหยัด ลิงก์ตรง คุณภาพคมชัด บริการจัดส่งข้อมูลออโต้ทันที\n• ลิงก์จัดส่งอัตโนมัติ\n• รับประกัน 24 ชั่วโมง',
      price: 30.0,
      image: 'https://img.rdcw.co.th/images/d2896d3f8a0d3a5f94c7cafb54bc9ce0235010c7815d3983aad98d8007f2f5a6.jpg',
      type: 'ACCOUNT',
      categoryId: disneyCategory.id,
      subCategoryId: disneyDailySubcat.id
    },
  });

  // Products under Spotify
  const spotifyProduct = await prisma.product.create({
    data: {
      name: 'Spotify Premium 30 Days (Family Plan)',
      description: 'ฟังเพลงไม่มีโฆษณาคั่น คุณภาพเสียงสูงสุด พร้อมระบบจัดส่งลิงก์เชิญเข้าครอบครัวออโต้ 24 ชั่วโมง',
      price: 59.0,
      image: 'https://img.rdcw.co.th/images/8360fc53760d0ea6123b4c2ead12a094e55d733479e53f38d8da66b8bbdca6b1.jpeg',
      type: 'ACCOUNT',
      categoryId: appPremiumCategory.id,
      subCategoryId: spotifySubcat.id
    },
  });

  // RoV Topup Product (No Subcategory needed)
  const rovProduct = await prisma.product.create({
    data: {
      name: 'RoV เติมเงินออโต้ 50 คูปอง',
      description: 'เติมเงินคูปอง RoV อัตโนมัติ ปลอดภัย 100% เพียงระบุ OpenID ของผู้เล่นเพื่อดำเนินรายการการเติมเงิน',
      price: 45.0,
      image: 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png',
      type: 'TOPUP',
      categoryId: gameCategory.id
    },
  });

  console.log('Seeded Products');

  // 6. Seed Options for Products
  // Options for Nf 1 D (Product 2 in NF Daily Subcategory)
  const nf1dOpt1 = await prisma.productOption.create({
    data: { productId: nf1dProduct.id, name: 'Nf 1 days นอก ( มือถือ / ไอแพด / คอม )', price: 15.0 }
  });
  const nf1dOpt2 = await prisma.productOption.create({
    data: { productId: nf1dProduct.id, name: 'thNf 1 days ไทย ( มือถือ / ไอแพด / คอม )', price: 15.0 }
  });
  const nf1dOpt3 = await prisma.productOption.create({
    data: { productId: nf1dProduct.id, name: 'Nf 1 days นอก ( Tv / กล่องรับสัญญาณ / โปรเจคเตอร์ )', price: 25.0 }
  });
  const nf1dOpt4 = await prisma.productOption.create({
    data: { productId: nf1dProduct.id, name: 'thNf 1 days ไทย ( Tv / กล่องรับสัญญาณ / โปรเจคเตอร์ )', price: 25.0 }
  });

  // Options for Disney
  const disneyOpt1 = await prisma.productOption.create({
    data: { productId: disneyProduct.id, name: 'Disney plus 1 days ( มือถือ / ไอแพด / คอม )', price: 30.0 }
  });
  const disneyOpt2 = await prisma.productOption.create({
    data: { productId: disneyProduct.id, name: 'thDisney plus 1 days ( มือถือ / ไอแพด / คอม )', price: 35.0 }
  });

  console.log('Seeded Product Options');

  // 7. Seed Stock Items for Account products
  // Seed 55 stock items for nf1dOpt1 (Outside TH, Mobile)
  const nf1dOpt1Stock = [];
  for (let i = 1; i <= 55; i++) {
    nf1dOpt1Stock.push({
      productId: nf1dProduct.id,
      productOptionId: nf1dOpt1.id,
      content: `nf_out_mob_user_${i}@licomail.com:pass_${Math.random().toString(36).substring(2, 8)}`
    });
  }
  await prisma.stockItem.createMany({ data: nf1dOpt1Stock });

  // Seed 18 stock items for nf1dOpt3 (Outside TH, TV)
  const nf1dOpt3Stock = [];
  for (let i = 1; i <= 18; i++) {
    nf1dOpt3Stock.push({
      productId: nf1dProduct.id,
      productOptionId: nf1dOpt3.id,
      content: `nf_out_tv_user_${i}@licomail.com:pass_${Math.random().toString(36).substring(2, 8)}`
    });
  }
  await prisma.stockItem.createMany({ data: nf1dOpt3Stock });

  // thNf 1 days options (opt2 and opt4) will have 0 stock items (Out of stock)

  // Seed Disney stock items
  await prisma.stockItem.createMany({
    data: [
      { productId: disneyProduct.id, productOptionId: disneyOpt1.id, content: 'disney_promo_link_001_code_xyz' },
      { productId: disneyProduct.id, productOptionId: disneyOpt1.id, content: 'disney_promo_link_002_code_abc' }
    ]
  });

  // Seed Spotify stock items
  await prisma.stockItem.createMany({
    data: [
      { productId: spotifyProduct.id, content: 'https://spoti.fi/invite-family-link-user1' },
      { productId: spotifyProduct.id, content: 'https://spoti.fi/invite-family-link-user2' }
    ]
  });

  console.log('Seeded Stock Items');

  // 8. Seed CTA Cards
  await prisma.ctaCard.createMany({
    data: [
      {
        id: 'card1',
        title: 'ห้องแชทแจ้งปัญหา & แชทกลุ่ม',
        description: 'แจ้งปัญหาการใช้งานกับแอดมิน และพูดคุยกับเพื่อนสมาชิก',
        imageUrl: 'https://img.rdcw.co.th/images/be45613bbc4077dcc0cabe4080138e8be1a039648f2fba705b61fbb9848b8259.png',
        linkUrl: '/chat',
      },
      {
        id: 'card2',
        title: 'สมัครตัวแทน / API ออโต้',
        description: 'ติดต่อร่วมเป็นพาร์ทเนอร์ร้านค้าตัวแทนและเชื่อมต่อ API ดึงข้อมูล',
        imageUrl: 'https://img.rdcw.co.th/images/51e6b2647841d95efb33640cf0eb76ca39af073837ac653750f7f2d641813218.png',
        linkUrl: '/agent',
      },
      {
        id: 'card3',
        title: 'ระบบรับ OTP 24 ชั่วโมง',
        description: 'รับรหัส OTP สำหรับยืนยันแอปพลิเคชันและบริการด้วยตัวเอง',
        imageUrl: 'https://img.rdcw.co.th/images/efcbe4ee453c1f00066809843b345b288eaf0660b5c4ccecaff789e7a3d02659.png',
        linkUrl: '/otp',
      },
      {
        id: 'card4',
        title: 'เติมเกม / เติมเงินมือถือ',
        description: 'บริการเติมเงิน RoV, Free Fire, Valorant และเครือข่ายมือถือออโต้',
        imageUrl: 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png',
        linkUrl: '/categories',
      },
    ],
  });

  console.log('Seeded CTA Cards');
  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
