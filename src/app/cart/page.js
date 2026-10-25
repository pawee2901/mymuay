'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';

const formatBaht = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function CartPage() {
  const { items, total, count, updateQuantity, removeItem, openCheckout } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center font-sans">
        <ShoppingCart className="w-14 h-14 text-slate-300" />
        <h1 className="mt-4 text-lg font-black text-slate-800">ตะกร้ายังว่างอยู่</h1>
        <p className="text-sm text-slate-500 mt-1">เลือกเติมเกม บัตรเติมเงิน หรือแอปพรีเมียมได้เลย</p>
        <div className="mt-6 flex gap-2">
          <Link href="/games" className="px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold">เติมเกม</Link>
          <Link href="/categories" className="px-5 py-3 rounded-2xl bg-white ring-1 ring-slate-200 text-slate-700 text-sm font-bold">แอปพรีเมียม</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-36 flex-1 font-sans">
      <h1 className="text-xl font-black text-slate-900">ตะกร้าสินค้า <span className="text-slate-400 font-bold text-base">({count})</span></h1>

      <ul className="mt-4 divide-y divide-slate-100 bg-white rounded-3xl ring-1 ring-slate-100 px-4">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 py-4">
            <img src={item.image} alt="" className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
              {item.optionName && <p className="text-xs text-slate-500 line-clamp-1">{item.optionName}</p>}
              {item.targetId && <p className="text-xs text-blue-600 font-semibold truncate">ID: {item.targetId}</p>}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center rounded-full ring-1 ring-slate-200">
                  <button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="p-1.5 text-slate-500" aria-label="ลด">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="p-1.5 text-slate-500" aria-label="เพิ่ม">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-sm font-black text-slate-900">฿{formatBaht(item.price * item.quantity)}</span>
              </div>
            </div>
            <button type="button" onClick={() => removeItem(item.key)} className="self-start p-1.5 text-slate-300 hover:text-rose-500" aria-label="ลบ">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      {/* Sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-slate-500">ยอดรวม</p>
            <p className="text-xl font-black text-slate-900">฿{formatBaht(total)}</p>
          </div>
          <button
            type="button"
            onClick={() => openCheckout(items, { fromCart: true })}
            className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm"
          >
            ชำระเงิน
          </button>
        </div>
      </div>
    </div>
  );
}
