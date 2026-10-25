'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  CheckCircle,
  Zap,
  Clock,
  ShoppingCart,
} from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';

export default function ProductView({ product }) {
  const { addItem, openCheckout } = useCart();
  const [currentUser, setCurrentUser] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Product Option Selection State (default to first option if exists)
  const [selectedOptionId, setSelectedOptionId] = useState(
    product.options && product.options.length > 0 ? product.options[0].id : null
  );

  useEffect(() => {
    fetch(`/api/auth/me?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => data.authenticated && setCurrentUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  const selectedOption = product.options?.find(o => o.id === selectedOptionId) || null;
  const isAgent = currentUser?.role === 'AGENT';
  const optionPrice = selectedOption 
    ? (isAgent && selectedOption.agentPrice > 0 ? selectedOption.agentPrice : selectedOption.price)
    : selectedOption?.price || 0;
  const mainPrice = isAgent && product.agentPrice > 0 ? product.agentPrice : product.price;
  const currentPrice = selectedOption ? optionPrice : mainPrice;
  const availableStock = selectedOption ? selectedOption.stockCount : product.stockCount;
  const isOutOfStock = product.type === 'ACCOUNT' && availableStock === 0;

  // Reset quantity to 1 whenever selected option changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedOptionId]);

  const buildItem = () => ({
    productId: product.id,
    productOptionId: selectedOptionId,
    quantity,
    name: product.name,
    optionName: selectedOption?.name || '',
    image: product.image,
    price: currentPrice,
  });

  const handleCheckout = (e) => {
    e.preventDefault();
    openCheckout([buildItem()]);
  };


  const totalPrice = currentPrice * quantity;
  const isWarningCard = product.name.includes('อ่านรายละเอียด');

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 font-sans">
      
      {/* Breadcrumbs / Back button */}
      <Link 
        href="/categories" 
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563eb] hover:text-[#1d4ed8] text-xs font-bold rounded-xl transition-premium border border-blue-100/40 w-fit mb-6 shadow-3xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        กลับไปหมวดหมู่ทั้งหมด
      </Link>

      <div className="bg-white border border-[#c7daf7]/80 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 hover:shadow-premium transition-premium">
        
        {/* Left Side: Product Image Display */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-2xs">
            <img 
              src={product.image} 
              alt={product.name} 
              className="object-cover w-full h-full"
            />
            {isOutOfStock && !isWarningCard && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center animate-fadeIn">
                <span className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full border border-red-500 uppercase tracking-widest shadow-md">
                  สินค้าหมดสต๊อก
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-sans px-2">
            <span className="flex items-center gap-1 font-semibold text-slate-500">
              <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
              หมวดหมู่: {product.categoryName}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-500">ขายไปแล้ว {product.soldCount} ชิ้น</span>
          </div>
        </div>

        {/* Right Side: Product Details & Configurator */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="bg-blue-50 text-[#2563eb] text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase">
              {isWarningCard ? 'รายละเอียดเงื่อนไขสำคัญ' : product.type === 'TOPUP' ? 'เติมเงินเกมระบบออโต้' : 'ไอดี/รหัสสินค้าจัดส่งทันที'}
            </span>
            <h1 className="text-lg md:text-xl font-black text-slate-800 mt-4 leading-tight">
              {product.name}
            </h1>
            
            {/* Price display (based on selected option) */}
            {!isWarningCard && (
              <div className="flex flex-wrap items-end gap-2 mt-2">
                {isAgent && (selectedOption ? selectedOption.agentPrice > 0 : product.agentPrice > 0) ? (
                  <>
                    <span className="text-slate-400 line-through text-base font-semibold mb-0.5">
                      {selectedOption ? selectedOption.price.toLocaleString() : product.price.toLocaleString()} บาท
                    </span>
                    <span className="text-[#2563eb] text-2xl font-black">
                      {currentPrice.toLocaleString()} <span className="text-xs font-bold text-slate-400">บาท (ส่งตัวแทน)</span>
                    </span>
                  </>
                ) : (
                  <p className="text-[#2563eb] text-2xl font-black">
                    {currentPrice.toLocaleString()} <span className="text-xs font-bold text-slate-400">บาท</span>
                  </p>
                )}
              </div>
            )}

            {/* Description Box */}
            <div className="border-t border-[#c7daf7]/40 my-4 pt-4">
              <h3 className="text-xs font-bold text-slate-700">รายละเอียดสินค้า</h3>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed font-sans whitespace-pre-wrap">
                {product.description}
              </div>
            </div>

            {/* ========== OPTION SELECTOR (ตัวเลือกสินค้า) ========== */}
            {product.options && product.options.length > 0 && (
              <div className="border-t border-[#c7daf7]/40 my-4 pt-4">
                <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1">
                  <span>ตัวเลือกสินค้า</span>
                </h3>
                <div className="space-y-2">
                  {product.options.map((opt) => {
                    const optOutOfStock = opt.stockCount === 0;
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-premium ${
                          isSelected
                            ? 'border-[#2563eb] bg-blue-50/20 shadow-premium'
                            : 'border-slate-200 bg-white hover:border-[#c7daf7]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${isSelected ? 'text-[#2563eb]' : 'text-slate-700'} ${optOutOfStock ? 'line-through opacity-60' : ''}`}>
                            {opt.name}
                          </p>
                          <p className={`text-xs font-black mt-1 ${isSelected ? 'text-[#2563eb]' : 'text-slate-800'} ${optOutOfStock ? 'line-through opacity-60' : ''}`}>
                            {isAgent && opt.agentPrice > 0 ? (
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="text-slate-400 line-through text-[10px] font-semibold">{opt.price.toLocaleString()} ฿</span>
                                <span className="text-purple-600">{opt.agentPrice.toLocaleString()} ฿ (ส่ง)</span>
                              </span>
                            ) : (
                              <span>{opt.price.toLocaleString()} บาท</span>
                            )}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold shrink-0 px-2.5 py-1 rounded-full ${
                          optOutOfStock 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {optOutOfStock ? 'สินค้าหมด' : `เหลือ ${opt.stockCount} ชิ้น`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Action */}
          <form onSubmit={handleCheckout} className="border-t border-[#c7daf7]/40 pt-4 mt-4">
            
            {/* Quantity */}
            {!isWarningCard ? (
              <div className="mb-4 flex items-center justify-between gap-4">
                <label className="text-xs font-bold text-slate-700">
                  จำนวนสินค้า
                </label>
                <div className="flex items-center gap-1 border border-slate-200 rounded-xl overflow-hidden bg-white shrink-0">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= 1}
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-premium cursor-pointer border-r border-slate-200"
                  >
                    －
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={quantity}
                    className="w-12 text-center text-xs font-black text-slate-800 bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= availableStock}
                    onClick={() => setQuantity(prev => Math.min(availableStock, prev + 1))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-premium cursor-pointer border-l border-slate-200"
                  >
                    ＋
                  </button>
                </div>
              </div>
            ) : null}

            {isWarningCard || isOutOfStock ? (
              <button type="button" disabled className="w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed">
                {isWarningCard ? 'รายละเอียดเงื่อนไข' : 'สินค้าหมดชั่วคราว'}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem(buildItem())}
                  className="px-4 py-3.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm flex items-center gap-1.5 shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                  ใส่ตะกร้า
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-sm active:scale-[0.98] transition-premium"
                >
                  ซื้อเลย • {totalPrice.toLocaleString()} ฿
                </button>
              </div>
            )}

            {!isWarningCard && (
              <p className="text-center text-[10px] text-slate-500 mt-2.5 font-medium">
                {product.type === 'ACCOUNT' ? `เหลือสินค้าในระบบอีก ${availableStock} ชิ้น` : 'เติมออโต้เข้าไอดีของคุณโดยตรง'}
              </p>
            )}

            {/* Guaranteed Badges */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400">
              <span className="flex items-center justify-center gap-1 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                จัดส่งด่วนออโต้
              </span>
              <span className="flex items-center justify-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                รับประกัน 24 ชม.
              </span>
              <span className="flex items-center justify-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ฐานข้อมูลปลอดภัย
              </span>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
