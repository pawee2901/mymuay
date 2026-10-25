'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Check, Loader2, RefreshCw, ChevronDown, Upload, Link2, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

const TYPE_LABELS = { gtopup: 'เกม', cashcard: 'บัตรเติมเงิน', mtopup: 'มือถือ' };
const baht = (n) => `฿${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

async function wepayAction(body) {
  const res = await fetch('/api/admin/wepay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ไม่สำเร็จ');
  return data;
}

const toast = (title, icon = 'success') => Swal.fire({ icon, title, timer: 1500, showConfirmButton: false });

function PricingControls({ pricing, setPricing }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="inline-flex items-center gap-2">
        <span className="text-slate-500 font-bold">บวกกำไร</span>
        <input
          type="number"
          step="0.5"
          value={pricing.markup}
          onChange={(e) => setPricing((p) => ({ ...p, markup: e.target.value }))}
          className="w-20 rounded-lg ring-1 ring-slate-200 px-2 py-1.5 text-right font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-slate-500">%</span>
      </label>
      <label className="inline-flex items-center gap-2 text-slate-600 font-bold">
        <input type="checkbox" checked={pricing.roundUp} onChange={(e) => setPricing((p) => ({ ...p, roundUp: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
        ปัดขึ้นเป็นบาทเต็ม
      </label>
    </div>
  );
}

function ProductEditor({ product, companies, pricing, onChanged }) {
  const [name, setName] = useState(product.name);
  const [image, setImage] = useState(product.categoryImage || product.image);
  const [description, setDescription] = useState(product.description || '');
  const [linkTarget, setLinkTarget] = useState('');
  const [busy, setBusy] = useState('');
  const [prices, setPrices] = useState(() => Object.fromEntries(product.options.map((o) => [o.id, { price: o.price, agentPrice: o.agentPrice || '' }])));
  const savedPrices = useRef(Object.fromEntries(product.options.map((o) => [o.id, { price: o.price, agentPrice: o.agentPrice || 0 }])));

  const linked = Boolean(product.wepayCompany);

  const run = async (label, fn) => {
    setBusy(label);
    try {
      await fn();
      onChanged();
    } catch (error) {
      Swal.fire({ icon: 'error', title: error.message });
    } finally {
      setBusy('');
    }
  };

  const uploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    run('upload', async () => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
      setImage(data.url);
      await wepayAction({ action: 'update', productId: product.id, image: data.url });
      toast('อัปเดตรูปแล้ว');
    });
  };

  const saveInfo = () =>
    run('info', async () => {
      await wepayAction({ action: 'update', productId: product.id, name, image, description });
      toast('บันทึกแล้ว');
    });

  // Saved without refreshing the page so other unsaved fields keep their values
  const savePrice = async (optionId) => {
    const { price, agentPrice } = prices[optionId];
    const saved = savedPrices.current[optionId];
    if (Number(price) === saved.price && (Number(agentPrice) || 0) === saved.agentPrice) return;
    if (!(Number(price) > 0)) {
      Swal.fire({ icon: 'error', title: 'ราคาขายต้องมากกว่า 0' });
      return;
    }
    const res = await fetch('/api/admin/options', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: optionId, price: Number(price), agentPrice: Number(agentPrice) || 0 }),
    });
    if (res.ok) {
      savedPrices.current[optionId] = { price: Number(price), agentPrice: Number(agentPrice) || 0 };
    } else {
      Swal.fire({ icon: 'error', title: (await res.json()).error || 'บันทึกราคาไม่สำเร็จ' });
    }
  };

  const sync = (reprice) =>
    run(reprice ? 'reprice' : 'sync', async () => {
      if (reprice) {
        const ok = await Swal.fire({ icon: 'question', title: `ตั้งราคาใหม่ทุกแพ็กเกจ (+${pricing.markup || 0}%)?`, text: 'ราคาที่แก้ไขเองจะถูกแทนที่', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก' });
        if (!ok.isConfirmed) return;
      }
      const data = await wepayAction({ action: 'sync', productId: product.id, reprice, markup: Number(pricing.markup) || 0, roundUp: pricing.roundUp });
      toast(`อัปเดตแล้ว ${data.total} แพ็กเกจ${data.removed ? ` (ลบ ${data.removed})` : ''}`);
    });

  const link = () =>
    run('link', async () => {
      const [type, companyId] = linkTarget.split(':');
      if (!companyId) throw new Error('กรุณาเลือกเกมใน wePAY');
      const data = await wepayAction({ action: 'link', productId: product.id, type, companyId, markup: Number(pricing.markup) || 0, roundUp: pricing.roundUp });
      toast(`เชื่อมแล้ว ${data.total} แพ็กเกจ`);
    });

  const remove = () =>
    run('delete', async () => {
      const ok = await Swal.fire({ icon: 'warning', title: `ลบ "${product.name}"?`, showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#e11d48' });
      if (!ok.isConfirmed) return;
      const data = await wepayAction({ action: 'delete', productId: product.id });
      toast(data.message || 'ลบแล้ว');
    });

  const suggestions = useMemo(() => {
    const words = product.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return [...companies].sort((a, b) => {
      const score = (c) => words.filter((w) => c.name.toLowerCase().includes(w) || c.companyId.toLowerCase().includes(w)).length;
      return score(b) - score(a);
    });
  }, [companies, product.name]);

  return (
    <div className="px-4 pb-4 space-y-4">
      {!linked && (
        <div className="rounded-xl bg-amber-50 p-3 space-y-2">
          <p className="text-sm font-bold text-amber-800 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> ยังไม่ได้เชื่อม wePAY — ลูกค้าซื้อไม่ได้
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={linkTarget} onChange={(e) => setLinkTarget(e.target.value)} className="flex-1 rounded-lg ring-1 ring-amber-200 bg-white px-3 py-2 text-sm">
              <option value="">เลือกเกม/บริการใน wePAY</option>
              {suggestions.map((c) => (
                <option key={`${c.type}:${c.companyId}`} value={`${c.type}:${c.companyId}`}>
                  {c.name} ({c.companyId}) • {TYPE_LABELS[c.type]}
                </option>
              ))}
            </select>
            <button type="button" onClick={link} disabled={!!busy} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
              {busy === 'link' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} เชื่อม + ดึงแพ็กเกจ
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <label className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer group">
          <img src={image} alt="" className="w-full h-full object-cover" />
          <span className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            {busy === 'upload' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </span>
          <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
        </label>
        <div className="flex-1 min-w-0 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="คำอธิบาย / วิธีหา ID (ไม่บังคับ)" className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <button type="button" onClick={saveInfo} disabled={!!busy} className="w-full sm:w-auto px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold disabled:opacity-60">
        {busy === 'info' ? 'กำลังบันทึก...' : 'บันทึกชื่อ/รายละเอียด'}
      </button>

      {product.options.length > 0 && (
        <div>
          <div className="grid grid-cols-[1fr,84px,84px] gap-2 px-1 text-[11px] font-bold text-slate-400">
            <span>แพ็กเกจ (ต้นทุนหน้าบัตร)</span>
            <span className="text-right">ราคาขาย</span>
            <span className="text-right">ราคาตัวแทน</span>
          </div>
          <ul className="mt-1 divide-y divide-slate-50">
            {product.options.map((o) => (
              <li key={o.id} className="grid grid-cols-[1fr,84px,84px] gap-2 items-center py-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 line-clamp-2">{o.name}</p>
                  <p className="text-[11px] text-slate-400">{o.wepayAmount ? baht(o.wepayAmount) : 'ไม่มีรหัส wePAY'}</p>
                </div>
                {['price', 'agentPrice'].map((field) => (
                  <input
                    key={field}
                    type="number"
                    step="0.01"
                    value={prices[o.id]?.[field] ?? ''}
                    placeholder="-"
                    onChange={(e) => setPrices((p) => ({ ...p, [o.id]: { ...p[o.id], [field]: e.target.value } }))}
                    onBlur={() => savePrice(o.id)}
                    className="w-full rounded-lg ring-1 ring-slate-200 px-2 py-1.5 text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-slate-400">แก้ราคาแล้วกดออกจากช่อง ระบบบันทึกให้อัตโนมัติ</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {linked && (
          <>
            <button type="button" onClick={() => sync(false)} disabled={!!busy} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${busy === 'sync' ? 'animate-spin' : ''}`} /> ดึงแพ็กเกจล่าสุด
            </button>
            <button type="button" onClick={() => sync(true)} disabled={!!busy} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-bold disabled:opacity-60">
              ตั้งราคาใหม่ทั้งหมด (+{pricing.markup || 0}%)
            </button>
          </>
        )}
        <button type="button" onClick={remove} disabled={!!busy} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
          <Trash2 className="w-4 h-4" /> ลบ
        </button>
      </div>
    </div>
  );
}

export default function WepayPanel({ products }) {
  const router = useRouter();
  const [tab, setTab] = useState('selling');
  const [companies, setCompanies] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [typeFilter, setTypeFilter] = useState('gtopup');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [importing, setImporting] = useState('');
  const [pricing, setPricing] = useState({ markup: 0, roundUp: false });

  const selling = products.filter((p) => p.type === 'TOPUP' || p.type === 'CASHCARD');
  const linkedKeys = new Set(selling.filter((p) => p.wepayCompany).map((p) => `${p.wepayType}:${p.wepayCompany}`));

  useEffect(() => {
    fetch('/api/admin/wepay?action=catalog')
      .then((res) => res.json())
      .then((data) => (data.success ? setCompanies(data.companies) : setCatalogError(data.error)))
      .catch(() => setCatalogError('โหลดรายการจาก wePAY ไม่สำเร็จ'));
  }, []);

  const toggleActive = async (product) => {
    try {
      await wepayAction({ action: 'update', productId: product.id, isActive: !product.isActive });
      router.refresh();
    } catch (error) {
      Swal.fire({ icon: 'error', title: error.message });
    }
  };

  const importCompany = async (company) => {
    const key = `${company.type}:${company.companyId}`;
    setImporting(key);
    try {
      const data = await wepayAction({ action: 'import', type: company.type, companyId: company.companyId, markup: Number(pricing.markup) || 0, roundUp: pricing.roundUp });
      toast(`เพิ่ม ${company.name} (${data.total} แพ็กเกจ)`);
      router.refresh();
    } catch (error) {
      Swal.fire({ icon: 'error', title: error.message });
    } finally {
      setImporting('');
    }
  };

  const missingCount = companies.filter((c) => !(c.type === 'mtopup' && c.companyId.endsWith('-AOP')) && !linkedKeys.has(`${c.type}:${c.companyId}`)).length;

  const importAll = async () => {
    const ok = await Swal.fire({
      icon: 'question',
      title: `เพิ่มทั้งหมด ${missingCount} รายการ?`,
      text: `เกมเดิมจะถูกเชื่อมกับ wePAY ก่อน แล้วเพิ่มเกม/บัตร/มือถือที่ยังไม่มี (ราคา +${pricing.markup || 0}%)`,
      showCancelButton: true,
      confirmButtonText: 'เพิ่มทั้งหมด',
      cancelButtonText: 'ยกเลิก',
    });
    if (!ok.isConfirmed) return;
    setImporting('all');
    try {
      const data = await wepayAction({ action: 'import-all', markup: Number(pricing.markup) || 0, roundUp: pricing.roundUp });
      Swal.fire({ icon: 'success', title: 'เพิ่มเรียบร้อย', text: `เชื่อมเกมเดิม ${data.linked} • เพิ่มใหม่ ${data.added} รายการ` });
      router.refresh();
    } catch (error) {
      Swal.fire({ icon: 'error', title: error.message });
    } finally {
      setImporting('');
    }
  };

  const catalogList = companies.filter((c) => c.type === typeFilter && (!query || `${c.name} ${c.companyId}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-100 space-y-2">
        <p className="text-sm font-black text-slate-900">การตั้งราคาเริ่มต้น</p>
        <PricingControls pricing={pricing} setPricing={setPricing} />
        <p className="text-[11px] text-slate-400">ใช้ตอนเพิ่มเกมใหม่ / เชื่อมเกม / ตั้งราคาใหม่ทั้งหมด — 0% = ขายเท่าราคาหน้าบัตร (กำไรจากส่วนลด wePAY)</p>
      </div>

      <div className="flex gap-2">
        {[
          ['selling', `เปิดขาย (${selling.length})`],
          ['catalog', 'เพิ่มจาก wePAY'],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`px-4 py-2 rounded-full text-sm font-bold ${tab === id ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'selling' && (
        <ul className="bg-white rounded-2xl ring-1 ring-slate-100 divide-y divide-slate-100">
          {selling.map((p) => {
            const open = openId === p.id;
            return (
              <li key={p.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => setOpenId(open ? null : p.id)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    <img src={p.categoryImage || p.image} alt="" className="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0" />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${p.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{p.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {p.wepayCompany ? (
                          <>
                            {TYPE_LABELS[p.wepayType]} • {p.wepayCompany} • {p.options.length} แพ็กเกจ
                          </>
                        ) : (
                          <span className="text-amber-600 font-bold">ยังไม่เชื่อม wePAY</span>
                        )}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <button type="button" onClick={() => toggleActive(p)} className={`p-2 rounded-lg ${p.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`} title={p.isActive ? 'กำลังขาย (กดเพื่อซ่อน)' : 'ซ่อนอยู่ (กดเพื่อเปิดขาย)'}>
                    {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {open && <ProductEditor key={JSON.stringify(p.options.map((o) => [o.id, o.price, o.agentPrice]))} product={p} companies={companies} pricing={pricing} onChanged={() => router.refresh()} />}
              </li>
            );
          })}
          {selling.length === 0 && <li className="py-12 text-center text-sm text-slate-400">ยังไม่มีเกม กด “เพิ่มจาก wePAY”</li>}
        </ul>
      )}

      {tab === 'catalog' && (
        <div className="space-y-3">
          {missingCount > 0 && (
            <button type="button" onClick={importAll} disabled={!!importing} className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-black inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {importing === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {importing === 'all' ? 'กำลังเพิ่ม... (อาจใช้เวลาสักครู่)' : `เพิ่มทั้งหมดที่ยังไม่มี (${missingCount})`}
            </button>
          )}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold ${typeFilter === type ? 'bg-blue-600 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600'}`}>
                {label} <span className="opacity-60">{companies.filter((c) => c.type === type).length}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาในรายการ wePAY" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {catalogError && <p className="rounded-xl bg-rose-50 text-rose-700 text-sm px-3 py-2">{catalogError}</p>}
          <ul className="bg-white rounded-2xl ring-1 ring-slate-100 divide-y divide-slate-50">
            {catalogList.map((c) => {
              const key = `${c.type}:${c.companyId}`;
              const added = linkedKeys.has(key);
              return (
                <li key={key} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.companyId} • {c.packages} แพ็กเกจ • เริ่ม {baht(c.minPrice)}</p>
                  </div>
                  {added ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 px-3 py-2"><Check className="w-4 h-4" /> เพิ่มแล้ว</span>
                  ) : (
                    <button type="button" onClick={() => importCompany(c)} disabled={!!importing} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-60">
                      {importing === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} เพิ่ม
                    </button>
                  )}
                </li>
              );
            })}
            {!catalogError && companies.length === 0 && (
              <li className="py-10 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
