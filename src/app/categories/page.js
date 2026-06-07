import Link from 'next/link';
import { prisma } from '@/db';
import { Layers, Sparkles, AlertCircle, Inbox, ChevronRight, Eye } from 'lucide-react';
import ClientPrice from '@/components/ClientPrice';

export const revalidate = 0;

export default async function CategoriesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeCategoryId = resolvedSearchParams.id || null;
  const activeSubcategoryId = resolvedSearchParams.subid || null;
  const search = resolvedSearchParams.search || '';

  const gameCategoryIds = [
    'rov_cat', 'freefire_cat', 'undawn_cat', 'codm_cat', 'deltaforce_cat',
    'haikyu_cat', 'pubg_cat', 'mlbb_cat', 'valorant_cat', 'heartopia_cat'
  ];

  // 1. Fetch Categories for list view
  const categories = await prisma.category.findMany({
    where: { NOT: { id: { in: gameCategoryIds } } },
    include: {
      subcategories: {
        include: {
          products: {
            include: { stockItems: { where: { isUsed: false } } }
          }
        }
      },
      products: {
        include: { stockItems: { where: { isUsed: false } } }
      }
    }
  });

  const activeCategory = activeCategoryId
    ? categories.find(c => c.id === activeCategoryId)
    : null;

  // 2. Fetch Subcategories under active category if applicable
  const subcategories = activeCategory
    ? await prisma.subcategory.findMany({
        where: { categoryId: activeCategoryId },
        include: {
          products: {
            include: {
              stockItems: { where: { isUsed: false } },
              options: {
                include: { stockItems: { where: { isUsed: false } } }
              }
            }
          }
        }
      })
    : [];

  const activeSubcategory = activeSubcategoryId
    ? subcategories.find(s => s.id === activeSubcategoryId)
    : null;

  // 3. Fetch products under current selection
  let whereCondition = {};
  if (activeSubcategoryId) {
    whereCondition.subCategoryId = activeSubcategoryId;
  } else if (activeCategoryId) {
    whereCondition.categoryId = activeCategoryId;
    // If category has subcategories, we shouldn't show products directly unless they aren't assigned to any subcategory
    if (subcategories.length > 0) {
      whereCondition.subCategoryId = null; 
    }
  } else {
    whereCondition.categoryId = { notIn: gameCategoryIds };
  }

  if (search) {
    whereCondition.OR = [
      { name: { contains: search } },
      { description: { contains: search } }
    ];
  }

  const products = await prisma.product.findMany({
    where: whereCondition,
    include: {
      stockItems: { where: { isUsed: false } },
      options: {
        include: { stockItems: { where: { isUsed: false } } }
      },
      orders: { where: { status: 'COMPLETED' } }
    }
  });

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex-1 font-sans">

      {/* Breadcrumbs */}
      <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500 font-medium mb-6">
        <Link href="/" className="hover:text-[#2563eb] transition-premium">หน้าแรก</Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        
        {!activeCategoryId && !search ? (
          <span className="text-[#2563eb] font-semibold">หมวดหมู่ทั้งหมด</span>
        ) : (
          <>
            <Link href="/categories" className="hover:text-[#2563eb] transition-premium">หมวดหมู่ทั้งหมด</Link>
            {activeCategory && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                {activeSubcategory ? (
                  <Link href={`/categories?id=${activeCategory.id}`} className="hover:text-[#2563eb] transition-premium">
                    {activeCategory.name}
                  </Link>
                ) : (
                  <span className="text-[#2563eb] font-semibold">{activeCategory.name}</span>
                )}
              </>
            )}
            {activeSubcategory && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-[#2563eb] font-semibold">{activeSubcategory.name}</span>
              </>
            )}
            {search && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-[#2563eb] font-semibold">ค้นหา: "{search}"</span>
              </>
            )}
          </>
        )}
      </div>

      {/* ========== BOX 1: CATEGORIES GRID (Home/Main view) ========== */}
      {!activeCategoryId && !search ? (
        <div className="animate-fadeIn">
          {/* Section Header */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2563eb] mb-1">Premium Apps</p>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">เลือกหมวดหมู่ที่คุณสนใจ</h1>
          </div>

          {/* Categories Grid (Clean 4-column cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {categories.map((cat) => {
              // Calculate total products under this category
              const subcatsProductsCount = cat.subcategories.reduce(
                (sum, sub) => sum + sub.products.length, 0
              );
              const directProductsCount = cat.products.filter(p => !p.subCategoryId).length;
              const totalProducts = subcatsProductsCount + directProductsCount;

              return (
                <Link
                  key={cat.id}
                  href={`/categories?id=${cat.id}`}
                  className="group block bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-[#2563eb]/30 hover:shadow-premium transition-premium"
                >
                  <div className="relative aspect-[4/2] bg-slate-100 overflow-hidden">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-premium"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-50/50 flex items-center justify-center text-[#2563eb]/30">
                        <Layers className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#2563eb] transition-premium truncate max-w-[170px]">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">มีสินค้าทั้งหมด {totalProducts} ชิ้น</p>
                    </div>
                    <span className="text-[9px] font-bold bg-blue-50 text-[#2563eb] rounded-full px-2.5 py-1">
                      สินค้าทั้งหมด
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : activeCategory && subcategories.length > 0 && !activeSubcategoryId ? (
        
        /* ========== BOX 2: SUBCATEGORIES GRID (Category Detail View) ========== */
        <div className="animate-fadeIn">
          {/* Header */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">ข้อมูลหมวดหมู่</p>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 mt-1">{activeCategory.name}</h1>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {subcategories.map((subcat) => {
              // Count total products under this subcategory
              const totalProducts = subcat.products.length;

              return (
                <div
                  key={subcat.id}
                  className="group flex flex-col justify-between bg-white border border-[#c7daf7]/80 rounded-2xl overflow-hidden hover:shadow-premium hover:border-[#2563eb]/30 transition-premium"
                >
                  <div className="relative w-full aspect-[16/9] bg-slate-50 overflow-hidden">
                    {subcat.image ? (
                      <img
                        src={subcat.image}
                        alt={subcat.name}
                        className="object-cover w-full h-full group-hover:scale-103 transition-premium"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Layers className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-[#2563eb] transition-premium">
                        {subcat.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        มีสินค้าทั้งหมด {totalProducts} ชิ้น
                      </p>
                    </div>
                    <Link
                      href={`/categories?id=${activeCategory.id}&subid=${subcat.id}`}
                      className="shrink-0 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-premium whitespace-nowrap active:scale-95 shadow-3xs"
                    >
                      สินค้าทั้งหมด
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (

        /* ========== BOX 3: PRODUCTS GRID (Subcategory Products View) ========== */
        <div className="animate-fadeIn">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">ข้อมูลหมวดหมู่ย่อย</p>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 mt-1">
                {search ? `ผลการค้นหา: "${search}"` : activeSubcategory?.name || activeCategory?.name}
              </h1>
            </div>
            <Link 
              href={activeSubcategory ? `/categories?id=${activeCategory.id}` : "/categories"} 
              className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] underline transition-premium"
            >
              ← ย้อนกลับ
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border border-[#c7daf7]/80 rounded-3xl p-12 text-center flex flex-col items-center max-w-md mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-[#2563eb]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">ไม่พบสินค้าในหมวดหมู่นี้</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">ขณะนี้ยังไม่มีสินค้าพร้อมบริการในหมวดหมู่ที่เลือก</p>
              <Link 
                href={activeCategory ? `/categories?id=${activeCategory.id}` : "/categories"} 
                className="mt-5 px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-premium"
              >
                ดูหมวดหมู่ทั้งหมด
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((prod) => {
                // Calculate stock across options or directly
                let totalStock = 0;
                if (prod.options && prod.options.length > 0) {
                  totalStock = prod.options.reduce((sum, opt) => sum + opt.stockItems.length, 0);
                } else {
                  totalStock = prod.stockItems.length;
                }
                const isOutOfStock = prod.type === 'ACCOUNT' && totalStock === 0;

                // Price display formatter
                let priceDisplay = `${prod.price.toLocaleString()} บาท`;
                if (prod.options && prod.options.length > 0) {
                  const prices = prod.options.map(o => o.price);
                  const minP = Math.min(...prices);
                  const maxP = Math.max(...prices);
                  priceDisplay = minP === maxP
                    ? `${minP.toLocaleString()} บาท`
                    : `${minP.toLocaleString()} – ${maxP.toLocaleString()} บาท`;
                }

                const isWarning = prod.name.includes('อ่านรายละเอียด');
                if (isWarning) {
                  priceDisplay = "9,999 บาท";
                }

                return (
                  <div
                    key={prod.id}
                    className="bg-white border border-[#c7daf7]/80 rounded-2xl overflow-hidden hover:shadow-premium hover:border-[#2563eb]/30 transition-premium flex flex-col justify-between"
                  >
                    <Link href={`/product/${prod.id}`} className="block group">
                      <div className="relative aspect-square w-full bg-blue-50 overflow-hidden border-b border-slate-100">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-premium"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest shadow-md">
                              สินค้าหมด
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px] group-hover:text-[#2563eb] transition-premium" title={prod.name}>
                          {prod.name}
                        </h3>
                        {isWarning ? (
                          <p className="text-[#2563eb] text-xs font-black mt-1">9,999 บาท</p>
                        ) : (
                          <ClientPrice price={prod.price} agentPrice={prod.agentPrice} options={prod.options} />
                        )}
                      </div>
                    </Link>

                    <div className="px-3 pb-3 mt-auto">
                      <Link href={`/product/${prod.id}`}>
                        <button
                          disabled={isOutOfStock}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-premium cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                              : isWarning
                              ? 'bg-blue-50 text-[#2563eb] hover:bg-blue-100/70 border border-[#2563eb]/20'
                              : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] active:scale-95 shadow-3xs'
                          }`}
                        >
                          {isOutOfStock ? 'สินค้าหมด' : isWarning ? 'ดูสินค้า' : 'ซื้อสินค้านี้'}
                        </button>
                      </Link>
                      <p className="text-center text-[9px] text-slate-500 mt-2 flex items-center justify-center gap-1 font-sans">
                        {isWarning ? (
                          <>
                            <span>คำอธิบายเพิ่มเติม</span>
                          </>
                        ) : prod.type === 'ACCOUNT' ? (
                          <>
                            <Inbox className="w-2.5 h-2.5" />
                            <span>เหลือทั้งหมด {totalStock} ชิ้น</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-2.5 h-2.5 text-[#2563eb]" />
                            <span>ระบบเติมออโต้ 24 ชม.</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
