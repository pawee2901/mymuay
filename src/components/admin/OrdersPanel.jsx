'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, X, Loader2, Copy } from 'lucide-react';
import Swal from 'sweetalert2';

const baht = (n) => `฿${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const FILTERS = [
  { id: 'ALL', label: 'ทั้งหมด' },
  { id: 'PENDING', label: 'รอดำเนินการ' },
  { id: 'COMPLETED', label: 'สำเร็จ' },
  { id: 'FAILED', label: 'ไม่สำเร็จ' },
];
const STATUS = {
  COMPLETED: { text: 'สำเร็จ', className: 'bg-emerald-50 text-emerald-700' },
  PENDING: { text: 'รอดำเนินการ', className: 'bg-amber-50 text-amber-700' },
  FAILED: { text: 'ไม่สำเร็จ/คืนเงิน', className: 'bg-rose-50 text-rose-700' },
};
const PAGE = 40;

async function callAdmin(body) {
  const res = await fetch('/api/admin/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ไม่สำเร็จ');
  return data;
}

export default function OrdersPanel({ orders }) {
  const router = useRouter();
  const [filter, setFilter] = useState(orders.some((o) => o.status === 'PENDING') ? 'PENDING' : 'ALL');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState('');

  const counts = useMemo(() => {
    const c = { ALL: orders.length, PENDING: 0, COMPLETED: 0, FAILED: 0 };
    orders.forEach((o) => (c[o.status] = (c[o.status] || 0) + 1));
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'ALL' && o.status !== filter) return false;
      if (!q) return true;
      return [o.id, o.username, o.productName, o.optionName, o.targetId, o.externalOrderId].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [orders, filter, query]);

  const run = async (label, body, successText) => {
    setBusy(label);
    try {
      const data = await callAdmin(body);
      Swal.fire({ icon: 'success', title: successText(data), timer: 1600, showConfirmButton: false });
      setSelected(null);
      router.refresh();
    } catch (error) {
      Swal.fire({ icon: 'error', title: error.message });
    } finally {
      setBusy('');
    }
  };

  const syncAll = () => run('all', { action: 'sync-all' }, (d) => `ตรวจ ${d.checked} รายการ อัปเดต ${d.updated} รายการ`);

  const refund = async (order) => {
    const ok = await Swal.fire({ icon: 'warning', title: 'ยกเลิกและคืนเงิน?', text: `คืน ${baht(order.totalPrice)} ให้ ${order.username}`, showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#e11d48' });
    if (ok.isConfirmed) run('refund', { action: 'refund', orderId: order.id }, () => 'คืนเงินแล้ว');
  };

  const complete = async (order) => {
    const { value, isConfirmed } = await Swal.fire({ title: 'ทำเครื่องหมายว่าสำเร็จ', input: 'textarea', inputPlaceholder: 'ข้อความถึงลูกค้า (ไม่บังคับ)', showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก' });
    if (isConfirmed) run('complete', { action: 'complete', orderId: order.id, content: value }, () => 'บันทึกแล้ว');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหา ชื่อผู้ใช้ / สินค้า / ID เกม / เลขออเดอร์" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {counts.PENDING > 0 && (
          <button type="button" onClick={syncAll} disabled={busy === 'all'} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${busy === 'all' ? 'animate-spin' : ''}`} /> เช็คสถานะ wePAY ทั้งหมด
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => { setFilter(f.id); setLimit(PAGE); }} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold ${filter === f.id ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600'}`}>
            {f.label} <span className="opacity-60">{counts[f.id] || 0}</span>
          </button>
        ))}
      </div>

      <ul className="mt-4 bg-white rounded-2xl ring-1 ring-slate-100 divide-y divide-slate-50">
        {filtered.slice(0, limit).map((o) => {
          const st = STATUS[o.status] || STATUS.PENDING;
          return (
            <li key={o.id}>
              <button type="button" onClick={() => setSelected(o)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {o.productName}
                    {o.optionName && <span className="font-medium text-slate-500"> • {o.optionName}</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {o.username}
                    {o.targetId ? ` • ID ${o.targetId}` : ''} • {new Date(o.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">{baht(o.totalPrice)}</p>
                  <span className={`inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${st.className}`}>{st.text}</span>
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="py-12 text-center text-sm text-slate-400">ไม่มีออเดอร์</li>}
      </ul>
      {filtered.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="mt-3 w-full py-3 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-bold text-slate-600">
          ดูเพิ่ม ({filtered.length - limit})
        </button>
      )}

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSelected(null)} />
          <div className="relative w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-black text-slate-900">{selected.productName}</p>
                {selected.optionName && <p className="text-sm text-slate-500">{selected.optionName}</p>}
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">ออเดอร์</dt><dd className="font-mono text-xs break-all">{selected.id}</dd>
              <dt className="text-slate-500">ผู้ใช้</dt><dd className="font-bold">{selected.username}</dd>
              <dt className="text-slate-500">ยอด</dt><dd className="font-bold">{baht(selected.totalPrice)} {selected.quantity > 1 && `(${selected.quantity} ชิ้น)`}</dd>
              <dt className="text-slate-500">สถานะ</dt><dd><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(STATUS[selected.status] || STATUS.PENDING).className}`}>{(STATUS[selected.status] || STATUS.PENDING).text}</span></dd>
              {selected.targetId && (<><dt className="text-slate-500">ID ปลายทาง</dt><dd className="font-bold break-all">{selected.targetId}</dd></>)}
              {selected.externalOrderId && (<><dt className="text-slate-500">wePAY TX</dt><dd className="font-mono text-xs">{selected.externalOrderId} {selected.externalStatus && <span className="text-slate-400">({selected.externalStatus})</span>}</dd></>)}
              <dt className="text-slate-500">เวลา</dt><dd>{new Date(selected.createdAt).toLocaleString('th-TH')}</dd>
            </dl>

            {selected.content && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 flex items-start gap-2">
                <pre className="flex-1 min-w-0 whitespace-pre-wrap break-all text-xs font-mono text-slate-700">{selected.content}</pre>
                <button type="button" onClick={() => navigator.clipboard.writeText(selected.content)} className="p-1 text-slate-400 hover:text-blue-600" aria-label="คัดลอก"><Copy className="w-4 h-4" /></button>
              </div>
            )}

            {selected.status === 'PENDING' && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selected.externalOrderId && (
                  <button type="button" disabled={!!busy} onClick={() => run('sync', { action: 'sync', orderId: selected.id }, (d) => `สถานะ: ${STATUS[d.status]?.text || d.status}`)} className="py-3 rounded-xl bg-blue-600 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
                    {busy === 'sync' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} เช็คสถานะ
                  </button>
                )}
                <button type="button" disabled={!!busy} onClick={() => complete(selected)} className="py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold disabled:opacity-60">ทำว่าสำเร็จ</button>
                <button type="button" disabled={!!busy} onClick={() => refund(selected)} className="py-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold disabled:opacity-60">ยกเลิก + คืนเงิน</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
