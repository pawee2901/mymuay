import { Suspense } from 'react';
import OTPClient from './OTPClient';

export const metadata = {
  title: 'รับรหัส OTP | ระบบดึงรหัสยืนยันอัตโนมัติ',
  description: 'ดึงรหัส OTP จากอีเมลอัตโนมัติ รองรับทุก email ทุกแอป ไม่ต้องกรอก password',
};

export default function OTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background:'linear-gradient(135deg,#fce4f3,#e8f4fd,#f0ebff)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🔐</div>
          <p className="text-slate-500 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <OTPClient />
    </Suspense>
  );
}
