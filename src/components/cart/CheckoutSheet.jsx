'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Wallet, CheckCircle2, XCircle, Clock, Copy, Check, ArrowLeft } from 'lucide-react';
import PromptPayPayment from '@/components/PromptPayPayment';

const formatBaht = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 px-2 py-1 rounded-lg bg-blue-50"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
    </button>
  );
}

const STATUS_UI = {
  COMPLETED: { icon: CheckCircle2, text: 'สำเร็จ', className: 'text-emerald-600 bg-emerald-50' },
  PENDING: { icon: Clock, text: 'กำลังดำเนินการ', className: 'text-amber-600 bg-amber-50' },
  FAILED: { icon: XCircle, text: 'ไม่สำเร็จ (คืนเงินแล้ว)', className: 'text-rose-600 bg-rose-50' },
};

const fetchMe = () =>
  fetch(`/api/auth/me?t=${Date.now()}`)
    .then((res) => res.json())
    .then((data) => (data.authenticated ? data.user : null))
    .catch(() => null);

export default function CheckoutSheet({ items, onClose, onPurchased }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('review'); // review | paying | topup | result
  const [error, setError] = useState('');
  const [shortfall, setShortfall] = useState(0);
  const [orders, setOrders] = useState([]);
  const pollRef = useRef(null);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const refreshUser = () => fetchMe().then((me) => me && setUser(me));

  useEffect(() => {
    let active = true;
    fetchMe().then((me) => {
      if (!active) return;
      if (me) {
        setUser(me);
      } else {
        router.push('/auth/signin');
        onClose();
      }
    });
    document.body.style.overflow = 'hidden';
    return () => {
      active = false;
      document.body.style.overflow = '';
      clearInterval(pollRef.current);
    };
  }, [router, onClose]);

  const startPolling = (ids) => {
    clearInterval(pollRef.current);
    let rounds = 0;
    pollRef.current = setInterval(async () => {
      rounds++;
      const res = await fetch(`/api/orders?ids=${ids.join(',')}&t=${Date.now()}`).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (data.orders) {
        setOrders(data.orders);
        if (!data.orders.some((o) => o.status === 'PENDING')) {
          clearInterval(pollRef.current);
          refreshUser();
        }
      }
      if (rounds > 60) clearInterval(pollRef.current); // ~5 minutes
    }, 5000);
  };

  const pay = async () => {
    setStep('paying');
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ productId, productOptionId, targetId, quantity }) => ({ productId, productOptionId, targetId, quantity })),
        }),
      });
      const data = await res.json();

      if (res.status === 402 && data.code === 'INSUFFICIENT_BALANCE') {
        setShortfall(Math.max(1, Math.ceil(data.shortfall ?? total - (user?.balance || 0))));
        setStep('topup');
        return;
      }
      if (res.status === 401) {
        router.push('/auth/signin');
        onClose();
        return;
      }
      if (!res.ok) throw new Error(data.error || 'สั่งซื้อไม่สำเร็จ');

      setOrders(data.orders);
      setUser((u) => (u ? { ...u, balance: data.balance } : u));
      setStep('result');
      onPurchased?.();
      router.refresh();
      if (data.orders.some((o) => o.status === 'PENDING')) startPolling(data.orders.map((o) => o.id));
    } catch (err) {
      setError(err.message);
      setStep('review');
    }
  };

  const balance = user?.balance ?? 0;
  const enough = balance >= total;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50" onClick={step === 'paying' ? undefined : onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          {step === 'topup' ? (
            <button type="button" onClick={() => setStep('review')} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
              <ArrowLeft className="w-4 h-4" /> กลับ
            </button>
          ) : (
            <h2 className="text-lg font-black text-slate-900">{step === 'result' ? 'ผลการสั่งซื้อ' : 'ชำระเงิน'}</h2>
          )}
          <button type="button" onClick={onClose} disabled={step === 'paying'} className="p-2 -mr-2 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {(step === 'review' || step === 'paying') && (
          <>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.key} className="flex items-center gap-3 py-3">
                  <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.optionName}
                      {item.targetId ? ` • ID ${item.targetId}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">฿{formatBaht(item.price * item.quantity)}</p>
                    {item.quantity > 1 && <p className="text-[11px] text-slate-400">x{item.quantity}</p>}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 rounded-2xl bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between font-black text-slate-900 text-base">
                <span>ยอดชำระ</span>
                <span>฿{formatBaht(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="inline-flex items-center gap-1"><Wallet className="w-4 h-4" /> เครดิตคงเหลือ</span>
                <span className={enough ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>฿{formatBaht(balance)}</span>
              </div>
              {user && !enough && (
                <p className="text-xs text-slate-500">
                  ขาดอีก <b className="text-rose-600">฿{formatBaht(Math.ceil(total - balance))}</b> — กดชำระแล้วสแกน QR จ่ายส่วนที่ขาดได้เลย
                </p>
              )}
            </div>

            {error && <p className="mt-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium px-3 py-2">{error}</p>}

            <button
              type="button"
              onClick={pay}
              disabled={step === 'paying' || !user}
              className="mt-4 w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black text-base flex items-center justify-center gap-2"
            >
              {step === 'paying' && <Loader2 className="w-5 h-5 animate-spin" />}
              {step === 'paying' ? 'กำลังสั่งซื้อ...' : enough ? `ชำระ ฿${formatBaht(total)}` : `จ่ายส่วนที่ขาด ฿${formatBaht(Math.ceil(total - balance))}`}
            </button>
          </>
        )}

        {step === 'topup' && (
          <>
            <p className="text-sm text-slate-600 mb-4">
              เครดิตไม่พอ สแกนจ่ายส่วนที่ขาด <b>฿{formatBaht(shortfall)}</b> แล้วแนบสลิป ระบบจะสั่งซื้อให้อัตโนมัติ
            </p>
            <PromptPayPayment amount={shortfall} onPaid={() => setTimeout(pay, 600)} />
          </>
        )}

        {step === 'result' && (
          <>
            <ul className="space-y-3">
              {orders.map((order) => {
                const ui = STATUS_UI[order.status] || STATUS_UI.PENDING;
                const Icon = ui.icon;
                return (
                  <li key={order.id} className="rounded-2xl ring-1 ring-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">{order.productName}</p>
                        {order.optionName && <p className="text-xs text-slate-500">{order.optionName}</p>}
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${ui.className}`}>
                        <Icon className={`w-3.5 h-3.5 ${order.status === 'PENDING' ? 'animate-pulse' : ''}`} />
                        {ui.text}
                      </span>
                    </div>
                    {order.content && order.status !== 'PENDING' && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                        <pre className="flex-1 min-w-0 whitespace-pre-wrap break-all text-xs font-mono text-slate-700">{order.content}</pre>
                        {order.status === 'COMPLETED' && <CopyButton text={order.content} />}
                      </div>
                    )}
                    {order.guideImage && <img src={order.guideImage} alt="วิธีใช้งาน" className="mt-3 rounded-xl w-full" />}
                    {order.status === 'PENDING' && <p className="mt-2 text-xs text-slate-500">โดยปกติใช้เวลา 1-5 นาที ปิดหน้านี้ได้ ดูผลได้ที่ประวัติการสั่งซื้อ</p>}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={onClose} className="py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm">
                ช้อปต่อ
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/profile?tab=orders');
                }}
                className="py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm"
              >
                ประวัติการสั่งซื้อ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
