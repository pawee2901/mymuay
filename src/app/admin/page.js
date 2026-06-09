import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/db';
import AdminDashboard from '@/components/AdminDashboard';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

export const revalidate = 0; // Disable cache

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth/signin');
  }

  let adminUser = null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'ADMIN') {
      redirect('/'); // Demote normal user to home page
    }
    adminUser = decoded;
  } catch (err) {
    redirect('/auth/signin');
  }

  // 1. Fetch categories and subcategories
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const subcategories = await prisma.subcategory.findMany({
    orderBy: { name: 'asc' }
  });

  // 2. Fetch products with stock details and options
  const products = await prisma.product.findMany({
    include: {
      category: true,
      stockItems: { where: { isUsed: false } },
      options: {
        orderBy: [
          { position: 'asc' },
          { price: 'asc' }
        ]
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Fetch all orders for logs and stats
  const orders = await prisma.order.findMany({
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });

  // 4. Fetch users for role management
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const ctaCards = prisma.ctaCard 
    ? await prisma.ctaCard.findMany({ orderBy: { id: 'asc' } }) 
    : [];

  // Fetch or Seed Carousel slides
  let carouselSlides = await prisma.carouselSlide.findMany({
    orderBy: { createdAt: 'asc' }
  });

  if (carouselSlides.length === 0) {
    const defaultSlides = [
      {
        title: 'แอปพรีเมียม สตรีมมิ่ง แท้ 100%',
        description: 'บริการแอปพรีเมียม Netflix, Disney+, Spotify บัญชีแท้ ราคาประหยัด ส่งของอัตโนมัติตลอด 24 ชั่วโมง ได้รับรหัสทันทีหลังชำระเงิน',
        badge: 'STREAMS 24/7',
        iconName: 'Sparkles',
        bgGradient: 'from-slate-900 to-indigo-950',
        btnText: 'เลือกซื้อแอปพรีเมียม',
        image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg'
      },
      {
        title: 'บริการเติมเกมออโต้ เปิดบริการ 24 ชม.',
        description: 'เติมเงินคูปอง RoV, Free Fire, Valorant ราคาถูกที่สุด ปลอดภัย 100% ใช้เพียงแค่ UID/OpenID ดำเนินรายการสำเร็จภายใน 10 วินาที',
        badge: 'INSTANT GAME TOPUP',
        iconName: 'Flame',
        bgGradient: 'from-slate-950 to-indigo-900',
        btnText: 'เติมเกมออโต้ทันที',
        image: 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png'
      },
      {
        title: 'ระบบอัตโนมัติ ไม่ใช้ XAMPP เสถียรสูงสุด',
        description: 'ทางร้านใช้ระบบ SQLite & Next.js ไร้รอยต่อ ป้องกันปัญหาร้านค้าขัดข้องและส่งของล่าช้า เพื่อการทำธุรกรรมที่ปลอดภัยสูงสุดสำหรับคุณ',
        badge: 'SECURE AUTOMATED DB',
        iconName: 'ShieldCheck',
        bgGradient: 'from-slate-900 via-slate-950 to-indigo-950',
        btnText: 'ตรวจสอบความปลอดภัย',
        image: 'https://img.rdcw.co.th/images/be45613bbc4077dcc0cabe4080138e8be1a039648f2fba705b61fbb9848b8259.png'
      }
    ];

    for (const slide of defaultSlides) {
      await prisma.carouselSlide.create({ data: slide });
    }

    carouselSlides = await prisma.carouselSlide.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }

  // Fetch or Seed Deposit Settings
  let depositSetting = await prisma.depositSetting.findUnique({
    where: { id: 'default' }
  });
  
  if (!depositSetting) {
    depositSetting = await prisma.depositSetting.create({
      data: {
        id: 'default',
        bankName: 'ธนาคารกสิกรไทย (KASIKORNBANK)',
        accountNumber: '112-8-94819-3',
        accountName: 'บริษัท มวยสโตร์ จำกัด (mymuayy Store Co., Ltd.)',
        qrImageUrl: ''
      }
    });
  }

  const siteSetting = await prisma.siteSetting.findUnique({
    where: { id: 'default' }
  }) || await prisma.siteSetting.create({
    data: { id: 'default', storeName: 'mymuayy', logoUrl: '' }
  });


  // Sanitize objects to pass to Client Component safely
  const serializedCategories = categories.map(c => ({ id: c.id, name: c.name, image: c.image }));

  const serializedSubcategories = subcategories.map(s => ({
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    image: s.image || ''
  }));
  
  const serializedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    agentPrice: p.agentPrice || 0.0,
    image: p.image,
    type: p.type,
    gameServiceCode: p.gameServiceCode || '',
    externalPackCode: p.externalPackCode || '',
    categoryName: p.category.name,
    categoryId: p.categoryId,
    subCategoryId: p.subCategoryId,
    stockCount: p.stockItems.length,
    options: p.options.map(opt => ({ id: opt.id, name: opt.name, price: opt.price, agentPrice: opt.agentPrice || 0.0, externalPackCode: opt.externalPackCode || '', position: opt.position || 0 }))
  }));

  const serializedOrders = orders.map(o => ({
    id: o.id,
    productName: o.product.name,
    targetId: o.targetId,
    quantity: o.quantity,
    totalPrice: o.totalPrice,
    status: o.status,
    content: o.content,
    createdAt: o.createdAt.toISOString()
  }));

  const serializedUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt.toISOString()
  }));

  const serializedCtaCards = ctaCards.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    imageUrl: c.imageUrl,
    linkUrl: c.linkUrl
  }));

  const serializedCarouselSlides = carouselSlides.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    badge: s.badge,
    iconName: s.iconName,
    bgGradient: s.bgGradient,
    btnText: s.btnText,
    image: s.image,
    slideType: s.slideType,
    linkUrl: s.linkUrl
  }));

  const serializedDepositSetting = {
    bankName: depositSetting.bankName,
    accountNumber: depositSetting.accountNumber,
    accountName: depositSetting.accountName,
    qrImageUrl: depositSetting.qrImageUrl,
    lineChannelAccessToken: depositSetting.lineChannelAccessToken,
    lineAdminUserId: depositSetting.lineAdminUserId
  };

  const serializedSiteSetting = {
    storeName: siteSetting.storeName,
    logoUrl: siteSetting.logoUrl
  };


  return (
    <div className="flex-1 bg-slate-50/50">
      <AdminDashboard 
        categories={serializedCategories}
        subcategories={serializedSubcategories}
        products={serializedProducts}
        orders={serializedOrders}
        users={serializedUsers}
        adminUser={adminUser}
        ctaCards={serializedCtaCards}
        depositSetting={serializedDepositSetting}
        carouselSlides={serializedCarouselSlides}
        siteSetting={serializedSiteSetting}
      />
    </div>
  );
}
