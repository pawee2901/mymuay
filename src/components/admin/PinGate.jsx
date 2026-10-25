'use client';

import { useState } from 'react';
import { ShieldCheck, Delete } from 'lucide-react';

const ADMIN_PIN = '2901';

export default function PinGate({ onVerified }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const press = (digit) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN) {
          sessionStorage.setItem('admin_pin_verified', 'true');
          onVerified();
        } else {
          setError(true);
          setPin('');
          setTimeout(() => setError(false), 1200);
        }
      }, 120);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100dvh-64px)] flex items-center justify-center bg-slate-900 px-4 font-sans select-none">
      <div className="w-full max-w-xs text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="mt-5 text-lg font-black text-white">ใส่รหัส PIN ผู้ดูแล</h2>
        <div className="flex justify-center gap-4 my-7">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`w-3.5 h-3.5 rounded-full transition ${error ? 'bg-rose-500' : pin.length > i ? 'bg-blue-400 scale-110' : 'bg-slate-600'}`} />
          ))}
        </div>
        <p className={`h-5 text-xs font-bold text-rose-400 ${error ? '' : 'invisible'}`}>PIN ไม่ถูกต้อง</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => press(d)} className="h-16 rounded-2xl bg-white/5 active:bg-white/20 text-2xl font-bold text-white">
              {d}
            </button>
          ))}
          <span />
          <button type="button" onClick={() => press('0')} className="h-16 rounded-2xl bg-white/5 active:bg-white/20 text-2xl font-bold text-white">
            0
          </button>
          <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} className="h-16 rounded-2xl text-slate-400 flex items-center justify-center" aria-label="ลบ">
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
