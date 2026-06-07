import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/db';
import LiveActivity from '@/components/LiveActivity';
import { 
  Users, 
  ShoppingBag, 
  Layers, 
  CheckCircle2, 
  ChevronRight,
  Sparkles, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import HomeCarousel from '@/components/HomeCarousel';
import CtaGrid from '@/components/CtaGrid';
import ClientPrice from '@/components/ClientPrice';

export const revalidate = 0; // Disable caching to keep stats and stock count fully live

export default async function Home() {
  // Fetch stats directly from SQLite using Prisma
  const totalUsers = await prisma.user.count();
  const totalProducts = await prisma.product.count();
  const totalStock = await prisma.stockItem.count({ where: { isUsed: false } });
  const ctaCards = prisma.ctaCard 
    ? await prisma.ctaCard.findMany({ orderBy: { id: 'asc' } }) 
    : [];

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
  
  // Sum quantities of COMPLETED orders
  const completedOrders = await prisma.order.findMany({
    where: { status: 'COMPLETED' },
    select: { quantity: true }
  });
  const totalSold = completedOrders.reduce((sum, order) => sum + order.quantity, 0);

  // Fetch categories with product counts
  const categories = await prisma.category.findMany({
    include: {
      products: {
        include: {
          stockItems: { where: { isUsed: false } }
        }
      }
    }
  });

  // Fetch featured products with stock status
  const products = await prisma.product.findMany({
    include: {
      category: true,
      stockItems: { where: { isUsed: false } },
      orders: { where: { status: 'COMPLETED' } }
    },
    take: 12
  });

  return (
    <div className="flex-1 w-full bg-slate-50/50 pb-16 font-sans">
      
      {/* 1. Header Hero / Carousel Banner */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-6">
        <HomeCarousel slides={carouselSlides} />
      </div>

      {/* 2. Interactive CTA Cards Row */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-8">
        <CtaGrid cards={ctaCards} />
      </div>

      {/* 3. Live Stats Panel */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 hover:shadow-2xs hover:border-blue-100 transition-premium">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-3xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผู้ใช้ทั้งหมด</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalUsers} <span className="text-xs font-medium text-slate-400">คน</span></h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 hover:shadow-2xs hover:border-blue-100 transition-premium">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-3xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สินค้าในร้าน</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalProducts} <span className="text-xs font-medium text-slate-400">รายการ</span></h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 hover:shadow-2xs hover:border-blue-100 transition-premium">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-3xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สต๊อกพร้อมส่ง</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalStock} <span className="text-xs font-medium text-slate-400">ชิ้น</span></h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 hover:shadow-2xs hover:border-blue-100 transition-premium">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-3xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">จัดส่งสำเร็จแล้ว</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalSold} <span className="text-xs font-medium text-slate-400">ชิ้น</span></h3>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Featured Categories Folders */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              หมวดหมู่แนะนำสำหรับคุณ
            </h2>
            <p className="text-xs text-slate-400">เลือกหมวดหมู่สินค้าที่ต้องการสั่งซื้อ</p>
          </div>
          <Link 
            href="/categories" 
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-premium"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {categories.map((cat) => {
            // Count total available stock inside this category
            const categoryStock = cat.products.reduce(
              (sum, prod) => sum + prod.stockItems.length, 0
            );

            return (
              <Link 
                key={cat.id} 
                href={`/categories?id=${cat.id}`} 
                className="group block bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-2xs transition-premium"
              >
                <div className="relative aspect-[4/2] bg-slate-100 overflow-hidden">
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-premium"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50/50 flex items-center justify-center text-blue-300">
                      <Layers className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-premium truncate max-w-[150px]">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">มีสินค้าทั้งหมด {cat.products.length} ชิ้น</p>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-600 rounded-full px-2.5 py-1">
                    สินค้าทั้งหมด
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Featured Products Grid */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-5 h-5 text-blue-500" />
              สินค้าแนะนำสำหรับคุณ
            </h2>
            <p className="text-xs text-slate-400">สินค้าคัดสรรพิเศษ ราคาดีที่สุด</p>
          </div>
          <Link 
            href="/categories" 
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-premium"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-6">
          {products.map((prod) => {
            const stockCount = prod.stockItems.length;
            const soldCount = prod.orders.reduce((sum, order) => sum + order.quantity, 0);
            const isOutOfStock = prod.type === 'ACCOUNT' && stockCount === 0;

            return (
              <div 
                key={prod.id} 
                className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-2xs transition-premium flex flex-col justify-between"
              >
                <Link href={`/product/${prod.id}`} className="block group">
                  <div className="relative aspect-square w-full bg-slate-50 overflow-hidden border-b border-slate-100">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-premium"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full border border-red-500 uppercase tracking-widest shadow-xs">
                          สินค้าหมด
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-premium" title={prod.name}>
                      {prod.name}
                    </h3>
                    <ClientPrice price={prod.price} agentPrice={prod.agentPrice} />
                  </div>
                </Link>

                <div className="p-3 pt-0 mt-auto">
                  <Link href={`/product/${prod.id}`} className="block">
                    <button 
                      disabled={isOutOfStock}
                      className={`w-full py-2 rounded-2xl text-xs font-bold transition-premium cursor-pointer ${
                        isOutOfStock 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-3xs hover:shadow-2xs active:scale-[0.98]'
                      }`}
                    >
                      {isOutOfStock ? 'สินค้าหมด' : 'ดูรายละเอียด'}
                    </button>
                  </Link>

                  <p className="text-center text-[9px] text-slate-400 mt-2 flex items-center justify-center gap-1 font-sans">
                    {prod.type === 'ACCOUNT' ? (
                      <>
                        <span>เหลือทั้งหมด {stockCount} ชิ้น</span>
                        <span>•</span>
                        <span>ขายแล้ว {soldCount} ชิ้น</span>
                      </>
                    ) : (
                      <>
                        <span>ระบบเติมออโต้</span>
                        <span>•</span>
                        <span>ขายแล้ว {soldCount} ชิ้น</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
