'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { getRefFields, validateRef } from '@/lib/wepayRefs';

const formatBaht = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function GameTopupView({ product }) {
  const { addItem, openCheckout } = useCart();
  const { fields, servers } = useMemo(() => getRefFields(product), [product]);
  const [values, setValues] = useState(() => fields.map(() => ''));
  const [server, setServer] = useState('');
  const [selectedId, setSelectedId] = useState(product.options.find((o) => o.available)?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [isAgent, setIsAgent] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setIsAgent(data.user?.role === 'AGENT'))
      .catch(() => {});
  }, []);

  const priceOf = (option) => (isAgent && option.agentPrice > 0 ? option.agentPrice : option.price);
  const selected = product.options.find((o) => o.id === selectedId);
  const isCashcard = product.wepayType === 'cashcard';
  const needsServer = servers.length > 0;

  const buildItem = () => {
    setError('');
    const parts = values.map((v) => v.trim());
    if (parts.some((v) => !v)) {
      setError(`กรุณากรอก ${fields[parts.findIndex((v) => !v)]}`);
      return null;
    }
    if (needsServer && !server) {
      setError('กรุณาเลือกเซิร์ฟเวอร์');
      return null;
    }
    const targetId = [...parts, ...(needsServer ? [server] : [])].join(' ');
    if (fields.length > 0 && !validateRef(targetId, product.wepayRefFormat)) {
      setError('รูปแบบ ID ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      return null;
    }
    if (!selected) {
      setError('กรุณาเลือกแพ็กเกจ');
      return null;
    }
    return {
      productId: product.id,
      productOptionId: selected.id,
      targetId: fields.length > 0 ? targetId : '',
      quantity,
      name: product.name,
      optionName: selected.name,
      image: product.image,
      price: priceOf(selected),
    };
  };

  const handleAdd = () => {
    const item = buildItem();
    if (item) addItem(item);
  };

  const handleBuy = () => {
    const item = buildItem();
    if (item) openCheckout([item]);
  };

  let step = 1;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-5 pb-32 font-sans text-slate-800">
      <Link href="/games" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600">
        <ChevronLeft className="w-4 h-4" />
        เกมทั้งหมด
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <img src={product.image} alt={product.name} className="w-20 h-20 rounded-2xl object-cover bg-slate-100" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{product.name}</h1>
          <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {isCashcard ? 'ได้รหัสบัตรทันทีหลังชำระเงิน' : 'เติมอัตโนมัติ เข้าภายใน 1-5 นาที'}
          </p>
        </div>
      </div>

      {fields.length > 0 && (
        <section className="mt-7">
          <h2 className="text-sm font-black text-slate-900 mb-3">
            <span className="inline-flex w-6 h-6 mr-2 items-center justify-center rounded-full bg-blue-600 text-white text-xs">{step++}</span>
            กรอกข้อมูลผู้เล่น
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((label, index) => (
              <label key={label} className="block">
                <span className="text-xs font-bold text-slate-500">{label}</span>
                <input
                  value={values[index]}
                  onChange={(e) => setValues((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))}
                  inputMode={product.wepayType === 'mtopup' ? 'tel' : 'text'}
                  placeholder={label}
                  className="mt-1 w-full rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            ))}
            {needsServer && (
              <label className="block">
                <span className="text-xs font-bold text-slate-500">เซิร์ฟเวอร์</span>
                <select
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกเซิร์ฟเวอร์</option>
                  {servers.map((s) => (
                    <option key={s.value} value={s.value}>{s.name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="text-sm font-black text-slate-900 mb-3">
          <span className="inline-flex w-6 h-6 mr-2 items-center justify-center rounded-full bg-blue-600 text-white text-xs">{step++}</span>
          เลือกแพ็กเกจ
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {product.options.map((option) => {
            const active = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!option.available}
                onClick={() => setSelectedId(option.id)}
                className={`relative text-left rounded-2xl px-3.5 py-3 transition ${
                  active ? 'bg-blue-50 ring-2 ring-blue-600' : 'bg-white ring-1 ring-slate-200 hover:ring-blue-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {active && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
                <p className="text-[13px] font-bold text-slate-800 leading-snug pr-5 line-clamp-2">{option.name}</p>
                <p className="mt-1 text-base font-black text-blue-600">฿{formatBaht(priceOf(option))}</p>
                {!option.available && <p className="text-[10px] font-bold text-rose-500">ปิดชั่วคราว</p>}
              </button>
            );
          })}
        </div>
      </section>

      {isCashcard && (
        <section className="mt-7 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">จำนวน</h2>
          <div className="flex items-center rounded-full ring-1 ring-slate-200 bg-white">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5" aria-label="ลด"><Minus className="w-4 h-4" /></button>
            <span className="w-8 text-center font-black">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(10, q + 1))} className="p-2.5" aria-label="เพิ่ม"><Plus className="w-4 h-4" /></button>
          </div>
        </section>
      )}

      {product.description && <p className="mt-7 text-xs text-slate-500 whitespace-pre-line">{product.description}</p>}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto">
          {error && <p className="mb-2 text-xs font-bold text-rose-600">{error}</p>}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-500 truncate">{selected ? selected.name : 'ยังไม่ได้เลือกแพ็กเกจ'}</p>
              <p className="text-xl font-black text-slate-900">฿{formatBaht(selected ? priceOf(selected) * quantity : 0)}</p>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="p-3.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100"
              aria-label="ใส่ตะกร้า"
              title="ใส่ตะกร้า"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <button type="button" onClick={handleBuy} className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm">
              ซื้อเลย
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
