'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, Loader2 } from 'lucide-react';
import PromptPayPayment from '@/components/PromptPayPayment';

const QUICK_AMOUNTS = [50, 100, 200, 300, 500, 1000];

export default function DepositPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  // ?amount= preset; the form only renders after the auth check, so reading window here is hydration-safe
  const [amount, setAmount] = useState(() =>
    typeof window === 'undefined' ? 0 : Number(new URLSearchParams(window.location.search).get('amount')) || 0
  );
  const [amountInput, setAmountInput] = useState(amount ? String(amount) : '');

  useEffect(() => {
    fetch(`/api/auth/me?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setCurrentUser(data.user);
        else router.push('/auth/signin');
      })
      .catch(() => router.push('/auth/signin'))
      .finally(() => setAuthChecking(false));
  }, [router]);

  const chooseAmount = (value) => {
    setAmountInput(String(value));
    setAmount(value);
  };

  const confirmAmount = (event) => {
    event.preventDefault();
    const value = Math.round(Number(amountInput) * 100) / 100;
    if (value >= 1) setAmount(value);
  };

  const handlePaid = ({ balance }) => {
    setCurrentUser((user) => (user ? { ...user, balance } : user));
    setTimeout(() => {
      const back = new URLSearchParams(window.location.search).get('back');
      router.push(back && back.startsWith('/') ? back : '/');
      router.refresh();
    }, 1800);
  };

  if (authChecking) {
    return (
      <div className="flex-1 min-h-[50vh] flex items-center justify-center text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }
  if (!currentUser) return null;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 flex-1 font-sans">
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <Wallet className="w-4 h-4 text-blue-600" />
          {currentUser.balance.toLocaleString()} ฿
        </span>
      </div>

      <h1 className="text-xl font-black text-slate-900">เติมเงินเข้ากระเป๋า</h1>
      <p className="text-sm text-slate-500 mt-1">เลือกจำนวนเงิน สแกน QR แล้วแนบสลิป ยอดเข้าทันที</p>

      {/* Step 1: amount */}
      <form onSubmit={confirmAmount} className="mt-5">
        <div className="grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseAmount(value)}
              className={`py-3 rounded-2xl text-sm font-black transition ${
                amount === value ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-blue-300'
              }`}
            >
              ฿{value.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="หรือระบุจำนวนเงินเอง"
            className="flex-1 min-w-0 rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-5 rounded-2xl bg-slate-900 text-white text-sm font-bold">
            สร้าง QR
          </button>
        </div>
      </form>

      {/* Step 2: QR + slip */}
      {amount > 0 && (
        <div className="mt-6 bg-white rounded-3xl p-5 ring-1 ring-slate-100 animate-fadeIn">
          <PromptPayPayment key={amount} amount={amount} onPaid={handlePaid} />
        </div>
      )}
    </div>
  );
}
