'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignUp() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('สมัครสมาชิกสำเร็จแล้ว! กำลังนำทางไปหน้าเข้าสู่ระบบ...');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-50/50 font-sans min-h-[70vh]">
      
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 mb-6 transition-premium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับไปหน้าแรก
        </Link>

        {/* Title Header */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-slate-800 tracking-wide font-sans">
            สมัครสมาชิกใหม่
          </h2>
          <p className="text-[10px] text-slate-400 mt-1">สร้างบัญชีผู้ใช้ใหม่ เพื่อเข้าใช้งานและสั่งซื้อสินค้าระบบออโต้</p>
        </div>

        {/* Success Alert Box */}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-600 animate-scaleUp">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-600 animate-slideDown">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                required
                placeholder="เช่น user_muayy" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <User className="absolute left-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              รหัสผ่าน (Password)
            </label>
            <div className="relative flex items-center">
              <input 
                type="password" 
                required
                placeholder="ตั้งรหัสผ่าน 6 ตัวขึ้นไป" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              ยืนยันรหัสผ่าน (Confirm Password)
            </label>
            <div className="relative flex items-center">
              <input 
                type="password" 
                required
                placeholder="ป้อนรหัสผ่านอีกครั้งเพื่อยืนยัน" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading || successMsg}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-premium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'กำลังประมวลผล...' : 'ลงทะเบียนสมัครสมาชิก'}
          </button>
        </form>

        {/* Toggle link */}
        <p className="text-center text-[10px] text-slate-400 mt-6 font-sans">
          มีบัญชีอยู่แล้วใช่หรือไม่?{' '}
          <Link href="/auth/signin" className="font-bold text-indigo-600 hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>

      </div>

    </div>
  );
}
