'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const SECTIONS = [
  { type: 'gtopup', title: 'เติมเกม' },
  { type: 'cashcard', title: 'บัตรเติมเงิน / Gift Card' },
  { type: 'mtopup', title: 'เติมเงินมือถือ' },
];

export default function GameGrid({ items }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;

  if (items.length === 0) {
    return <p className="mt-10 text-center text-sm text-slate-400">ยังไม่มีเกมเปิดขาย</p>;
  }

  return (
    <>
      <div className="relative mt-4 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาเกม เช่น ROV, Free Fire"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white ring-1 ring-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {SECTIONS.map(({ type, title }) => {
        const list = filtered.filter((item) => item.wepayType === type);
        if (list.length === 0) return null;
        return (
          <section key={type} className="mt-7">
            <h2 className="text-base font-black text-slate-800 mb-3">{title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {list.map((item) => (
                <Link key={item.id} href={`/games/${item.id}`} className="group block">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                  <p className="text-[11px] text-slate-400">เริ่ม ฿{item.minPrice.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && <p className="mt-10 text-center text-sm text-slate-400">ไม่พบเกมที่ค้นหา</p>}
    </>
  );
}
