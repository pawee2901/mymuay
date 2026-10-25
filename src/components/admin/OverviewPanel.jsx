'use client';

import { useEffect, useState } from 'react';
import { Wallet, Clock, AlertTriangle, TrendingUp, Users, RefreshCw, ChevronRight } from 'lucide-react';

const baht = (n) => `฿${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD local

function Stat({ icon: Icon, label, value, tone = 'blue', onClick }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="text-left bg-white rounded-2xl p-4 ring-1 ring-slate-100 disabled:cursor-default">
      <span className={`inline-flex w-9 h-9 rounded-xl items-center justify-center ${tones[tone]}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <p className="mt-3 text-xs font-bold text-slate-500">{label}</p>
      <p className="text-xl font-black text-slate-900 mt-0.5">{value}</p>
    </button>
  );
}

export default function OverviewPanel({ orders, users, products, onNavigate }) {
  const [wepay, setWepay] = useState({ loading: true });
  const [now] = useState(() => Date.now());

  const fetchBalance = () =>
    fetch('/api/admin/wepay?action=balance')
      .then((res) => res.json())
      .then((data) => setWepay(data.success ? { balance: data.balance.available_balance } : { error: data.error }))
      .catch(() => setWepay({ error: 'เชื่อมต่อไม่ได้' }));

  const loadBalance = () => {
    setWepay({ loading: true });
    fetchBalance();
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const today = dayKey(now);
  const monthPrefix = today.slice(0, 7);
  const completed = orders.filter((o) => o.status === 'COMPLETED');
  const todaySales = completed.filter((o) => dayKey(o.createdAt) === today).reduce((s, o) => s + o.totalPrice, 0);
  const monthSales = completed.filter((o) => dayKey(o.createdAt).startsWith(monthPrefix)).reduce((s, o) => s + o.totalPrice, 0);
  const pending = orders.filter((o) => o.status === 'PENDING');
  const newUsersToday = users.filter((u) => dayKey(u.createdAt) === today).length;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    return {
      key,
      label: d.toLocaleDateString('th-TH', { weekday: 'short' }),
      total: completed.filter((o) => dayKey(o.createdAt) === key).reduce((s, o) => s + o.totalPrice, 0),
    };
  });
  const max = Math.max(1, ...last7.map((d) => d.total));

  const lowStock = products
    .filter((p) => p.type === 'ACCOUNT')
    .flatMap((p) => (p.options.length ? p.options.map((o) => ({ name: `${p.name} • ${o.name}`, count: o.stockCount ?? null })) : [{ name: p.name, count: p.stockCount }]))
    .filter((x) => x.count !== null && x.count < 3)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={TrendingUp} label="ยอดขายวันนี้" value={baht(todaySales)} tone="green" />
        <Stat icon={TrendingUp} label="ยอดขายเดือนนี้" value={baht(monthSales)} />
        <Stat icon={Clock} label="รอดำเนินการ" value={`${pending.length} ออเดอร์`} tone="amber" onClick={() => onNavigate('orders')} />
        <Stat icon={Users} label="สมาชิกใหม่วันนี้" value={`${newUsersToday} คน`} tone="violet" onClick={() => onNavigate('users')} />
      </div>

      <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-100 flex items-center gap-3">
        <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-blue-600 text-white shrink-0">
          <Wallet className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500">ยอดเงินคงเหลือ wePAY</p>
          {wepay.loading ? (
            <p className="text-sm text-slate-400">กำลังโหลด...</p>
          ) : wepay.error ? (
            <button type="button" onClick={() => onNavigate('payment')} className="text-sm font-bold text-rose-600 text-left">{wepay.error}</button>
          ) : (
            <p className={`text-xl font-black ${wepay.balance < 500 ? 'text-rose-600' : 'text-slate-900'}`}>{baht(wepay.balance)}</p>
          )}
        </div>
        <button type="button" onClick={loadBalance} className="p-2 text-slate-400 hover:text-blue-600" aria-label="รีเฟรช">
          <RefreshCw className={`w-4 h-4 ${wepay.loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-100">
        <p className="text-sm font-black text-slate-900">ยอดขาย 7 วันล่าสุด</p>
        <div className="mt-4 flex items-end gap-2 h-36">
          {last7.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-500">{d.total ? Math.round(d.total).toLocaleString() : ''}</span>
              <div className="w-full max-w-[40px] rounded-t-lg bg-blue-500" style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }} />
              <span className="text-[11px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">ออเดอร์ล่าสุด</p>
            <button type="button" onClick={() => onNavigate('orders')} className="text-xs font-bold text-blue-600 inline-flex items-center">
              ทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <ul className="mt-2 divide-y divide-slate-50">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="py-2.5 flex items-center gap-3 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${o.status === 'COMPLETED' ? 'bg-emerald-500' : o.status === 'PENDING' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="flex-1 min-w-0 truncate text-slate-700">
                  <b>{o.username}</b> • {o.productName}
                </span>
                <span className="font-bold text-slate-900">{baht(o.totalPrice)}</span>
              </li>
            ))}
            {orders.length === 0 && <li className="py-6 text-center text-sm text-slate-400">ยังไม่มีออเดอร์</li>}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-900 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> สต๊อกใกล้หมด
            </p>
            <button type="button" onClick={() => onNavigate('stock')} className="text-xs font-bold text-blue-600 inline-flex items-center">
              เติมสต๊อก <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <ul className="mt-2 divide-y divide-slate-50">
            {lowStock.map((item) => (
              <li key={item.name} className="py-2.5 flex items-center justify-between text-sm">
                <span className="truncate text-slate-700">{item.name}</span>
                <span className={`font-bold ${item.count === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{item.count === 0 ? 'หมด' : `เหลือ ${item.count}`}</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="py-6 text-center text-sm text-slate-400">สต๊อกเพียงพอทุกรายการ</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
