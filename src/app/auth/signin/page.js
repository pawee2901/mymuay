'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowLeft, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export default function SignIn() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password states
  const [isForgot, setIsForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPasswordState, setNewPasswordState] = useState('');
  const [confirmNewPasswordState, setConfirmNewPasswordState] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        // Redirect to homepage
        router.push('/');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotEmail }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success) {
        setForgotStep(2);
      } else {
        setErrorMsg(data.error || 'ไม่พบอีเมล / ชื่อผู้ใช้นี้ในระบบ');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPasswordState !== confirmNewPasswordState) {
      setErrorMsg('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน');
      return;
    }

    if (newPasswordState.length < 6) {
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotEmail, newPassword: newPasswordState }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success) {
        setForgotSuccess('🎉 ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว! กำลังกลับไปหน้าล็อกอิน...');
        setTimeout(() => {
          setIsForgot(false);
          setForgotStep(1);
          setForgotEmail('');
          setNewPasswordState('');
          setConfirmNewPasswordState('');
          setForgotSuccess('');
        }, 3000);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-50/50 font-sans min-h-[75vh]">
      
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-fadeIn">
        {/* Back Link */}
        <button 
          onClick={() => {
            if (isForgot) {
              setIsForgot(false);
              setForgotStep(1);
              setErrorMsg('');
            } else {
              router.push('/');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563eb] hover:text-[#1d4ed8] text-xs font-bold rounded-xl transition-premium border border-blue-100/40 w-fit mb-6 shadow-3xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isForgot ? 'กลับไปเข้าสู่ระบบ' : 'กลับไปหน้าแรก'}
        </button>

        {!isForgot ? (
          /* SIGN IN VIEW */
          <>
            {/* Title Header */}
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-800 tracking-wide">
                🔑 เข้าสู่ระบบ
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">ยินดีต้อนรับกลับมาค่ะ! กรุณากรอกข้อมูลของคุณเพื่อดำเนินการต่อ</p>
            </div>

            {/* Error Alert Box */}
            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-600 animate-slideDown">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  ชื่อผู้ใช้งาน หรือ อีเมล (Username / Email)
                </label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    required
                    placeholder="ป้อนชื่อผู้ใช้หรืออีเมลของคุณ" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                  />
                  <User className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgot(true);
                      setErrorMsg('');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input 
                    type="password" 
                    required
                    placeholder="ป้อนรหัสผ่านของคุณ" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                  />
                  <Lock className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            {/* Toggle link */}
            <p className="text-center text-xs text-slate-400 mt-6 font-medium">
              ยังไม่มีบัญชีใช่หรือไม่?{' '}
              <Link href="/auth/signup" className="font-bold text-indigo-600 hover:underline">
                สมัครสมาชิกใหม่ที่นี่
              </Link>
            </p>
          </>
        ) : (
          /* FORGOT PASSWORD FLOW */
          <>
            {/* Title Header */}
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-800 tracking-wide flex items-center gap-1">
                🔒 ลืมรหัสผ่าน
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {forgotStep === 1 
                  ? 'กรุณากรอกอีเมลหรือชื่อผู้ใช้ที่ผูกกับบัญชี เพื่อทำรายการตั้งรหัสผ่านใหม่ค่ะ' 
                  : 'ระบุรหัสผ่านใหม่ที่คุณต้องการใช้งานต่อจากนี้ค่ะ'
                }
              </p>
            </div>

            {/* Success Alert Box */}
            {forgotSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-600 animate-scaleUp">
                <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Error Alert Box */}
            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-600 animate-slideDown">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              /* Step 1: Input Email */
              <form onSubmit={handleForgotStep1} className="space-y-4">
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    อีเมล หรือ ชื่อผู้ใช้งาน (Email / Username)
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      required
                      placeholder="กรอกชื่อผู้ใช้หรืออีเมลของคุณ" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                    />
                    <User className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบข้อมูล'}
                </button>
              </form>
            ) : (
              /* Step 2: Input New Password */
              <form onSubmit={handleForgotStep2} className="space-y-4">
                <div className="p-2.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center text-xs font-bold text-indigo-700 mb-2">
                  👤 บัญชีผู้ใช้: {forgotEmail}
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    รหัสผ่านใหม่ (New Password)
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="password" 
                      required
                      minLength={6}
                      placeholder="ตั้งรหัสผ่านใหม่ 6 ตัวอักษรขึ้นไป" 
                      value={newPasswordState}
                      onChange={(e) => setNewPasswordState(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                    />
                    <Lock className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    ยืนยันรหัสผ่านใหม่ (Confirm Password)
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="password" 
                      required
                      minLength={6}
                      placeholder="ป้อนรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน" 
                      value={confirmNewPasswordState}
                      onChange={(e) => setConfirmNewPasswordState(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                    />
                    <Lock className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || forgotSuccess}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </form>
            )}
          </>
        )}

      </div>

    </div>
  );
}
