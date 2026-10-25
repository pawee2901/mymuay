'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Gamepad2,
  Layers,
  Database,
  Users,
  Wallet,
  Image as ImageIcon,
  Store,
  Bell,
  KeyRound,
  Cpu,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import PinGate from './PinGate';
import OverviewPanel from './OverviewPanel';
import OrdersPanel from './OrdersPanel';
import WepayPanel from './WepayPanel';
import PaymentSettingsPanel from './PaymentSettingsPanel';

// `legacy` = tab name rendered by the older AdminDashboard component
const SECTIONS = [
  { id: 'overview', label: 'ภาพรวม', icon: LayoutDashboard, group: 'ร้านค้า' },
  { id: 'orders', label: 'ออเดอร์', icon: Receipt, group: 'ร้านค้า' },
  { id: 'wepay', label: 'เติมเกม & บัตร', icon: Gamepad2, group: 'ร้านค้า' },
  { id: 'products', label: 'แอปพรีเมียม', icon: Layers, group: 'ร้านค้า', legacy: 'products' },
  { id: 'stock', label: 'สต๊อกสินค้า', icon: Database, group: 'ร้านค้า', legacy: 'stock' },
  { id: 'users', label: 'สมาชิก', icon: Users, group: 'ร้านค้า', legacy: 'users' },
  { id: 'payment', label: 'การชำระเงิน & wePAY', icon: Wallet, group: 'ตั้งค่า' },
  { id: 'web', label: 'แบนเนอร์หน้าเว็บ', icon: ImageIcon, group: 'ตั้งค่า', legacy: 'ctacards' },
  { id: 'site', label: 'โลโก้ & ชื่อร้าน', icon: Store, group: 'ตั้งค่า', legacy: 'siteSettings' },
  { id: 'line', label: 'แจ้งเตือน LINE', icon: Bell, group: 'ตั้งค่า', legacy: 'lineSettings' },
  { id: 'otpEmail', label: 'อีเมล OTP', icon: KeyRound, group: 'ระบบ OTP', legacy: 'emailSettings' },
  { id: 'apiRequests', label: 'คำขอใช้ API', icon: Cpu, group: 'ระบบ OTP', legacy: 'apiRequests' },
];
const GROUPS = [...new Set(SECTIONS.map((s) => s.group))];
const MOBILE_TABS = ['overview', 'orders', 'wepay', 'products'];
const STORAGE_KEY = 'admin_section';

const subscribeNoop = () => () => {};
function readStorage(read, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return read();
  } catch {
    return fallback;
  }
}

export default function AdminShell(props) {
  const router = useRouter();
  // Nothing is rendered on the server, so reading browser storage in initializers is hydration-safe
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [verified, setVerified] = useState(() => readStorage(() => sessionStorage.getItem('admin_pin_verified') === 'true', false));
  const [section, setSection] = useState(() =>
    readStorage(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      return SECTIONS.some((s) => s.id === saved) ? saved : 'overview';
    }, 'overview')
  );
  const [menuOpen, setMenuOpen] = useState(false);

  // Log out after 1 hour of inactivity
  useEffect(() => {
    if (!verified) return;
    let timeoutId;
    const reset = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        sessionStorage.removeItem('admin_pin_verified');
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        window.location.href = '/auth/signin';
      }, 60 * 60 * 1000);
    };
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timeoutId);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [verified]);

  // Refresh server data every 2 minutes
  useEffect(() => {
    if (!verified) return;
    const id = setInterval(() => router.refresh(), 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [verified, router]);

  const go = (id) => {
    setSection(id);
    setMenuOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    window.scrollTo({ top: 0 });
  };

  if (!isClient) return null;
  if (!verified) return <PinGate onVerified={() => setVerified(true)} />;

  const current = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const pendingCount = props.orders.filter((o) => o.status === 'PENDING').length;

  const navButton = (s, compact = false) => {
    const Icon = s.icon;
    const active = s.id === section;
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => go(s.id)}
        className={`w-full flex items-center gap-3 rounded-xl px-3 ${compact ? 'py-3' : 'py-2.5'} text-sm font-bold transition ${
          active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span className="flex-1 text-left">{s.label}</span>
        {s.id === 'orders' && pendingCount > 0 && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-amber-100 text-amber-700'}`}>{pendingCount}</span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full flex font-sans min-h-[calc(100dvh-64px)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-100 sticky top-[64px] h-[calc(100dvh-64px)] overflow-y-auto p-3">
        <div className="flex items-center gap-2 px-3 py-3 mb-1">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-black text-slate-900 leading-none">จัดการร้าน</p>
            <p className="text-[11px] text-slate-400 mt-1">{props.adminUser?.username}</p>
          </div>
        </div>
        {GROUPS.map((group) => (
          <div key={group} className="mt-3">
            <p className="px-3 mb-1 text-[11px] font-bold text-slate-400">{group}</p>
            <div className="space-y-0.5">{SECTIONS.filter((s) => s.group === group).map((s) => navButton(s))}</div>
          </div>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 px-4 md:px-8 py-5 pb-28 md:pb-10">
        <h1 className="text-xl font-black text-slate-900 mb-5">{current.label}</h1>

        {section === 'overview' && <OverviewPanel {...props} onNavigate={go} />}
        {section === 'orders' && <OrdersPanel orders={props.orders} />}
        {section === 'wepay' && <WepayPanel products={props.products} />}
        {section === 'payment' && <PaymentSettingsPanel depositSetting={props.depositSetting} />}
        {current.legacy && <AdminDashboard {...props} embedded forcedTab={current.legacy} />}
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-100 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {MOBILE_TABS.map((id) => {
          const s = SECTIONS.find((x) => x.id === id);
          const Icon = s.icon;
          const active = section === id;
          return (
            <button key={id} type="button" onClick={() => go(id)} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${active ? 'text-blue-600' : 'text-slate-500'}`}>
              <Icon className="w-5 h-5" />
              {s.label.split(' ')[0]}
              {id === 'orders' && pendingCount > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] leading-4">{pendingCount}</span>
              )}
            </button>
          );
        })}
        <button type="button" onClick={() => setMenuOpen(true)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${MOBILE_TABS.includes(section) ? 'text-slate-500' : 'text-blue-600'}`}>
          <Menu className="w-5 h-5" />
          เมนู
        </button>
      </nav>

      {/* Mobile full menu sheet */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-full max-h-[85dvh] overflow-y-auto bg-white rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-black text-slate-900">เมนูทั้งหมด</p>
              <button type="button" onClick={() => setMenuOpen(false)} className="p-2 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            {GROUPS.map((group) => (
              <div key={group} className="mt-2">
                <p className="px-3 mb-1 text-[11px] font-bold text-slate-400">{group}</p>
                {SECTIONS.filter((s) => s.group === group).map((s) => navButton(s, true))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
