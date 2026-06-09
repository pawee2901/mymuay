'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Coins, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  QrCode,
  Loader2,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  Building2,
  ChevronRight
} from 'lucide-react';

export default function DepositPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Form states
  const [slipImage, setSlipImage] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
  
  // Notification states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    bankName: 'ธนาคารกสิกรไทย (KASIKORNBANK)',
    accountNumber: '21685536',
    accountName: 'ปวีณา สอนหมอก',
    qrImageUrl: '',
    bankLogoUrl: ''
  });

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`);
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setCurrentUser(data.user);
        } else {
          router.push('/auth/signin');
        }
      } catch (err) {
        console.error(err);
        router.push('/auth/signin');
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  // Fetch deposit bank/QR settings from DB
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`/api/admin/deposit-settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.setting) {
            setBankDetails({
              bankName: data.setting.bankName,
              accountNumber: data.setting.accountNumber,
              accountName: data.setting.accountName,
              qrImageUrl: data.setting.qrImageUrl,
              bankLogoUrl: data.setting.bankLogoUrl || ''
            });
          }
        }
      } catch (err) {
        console.error('Failed fetching deposit settings:', err);
      }
    }
    fetchSettings();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber.replace(/-/g, ''));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipImage(file);
      const url = URL.createObjectURL(file);
      setSlipPreviewUrl(url);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!slipImage) {
      setErrorMsg('กรุณาแนบภาพหลักฐานการโอนเงิน (สลิป) เพื่อยืนยันรายการ');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('slip', slipImage);

      const res = await fetch('/api/auth/deposit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      // Artificial delay for checking slip animation
      setTimeout(async () => {
        setIsSubmitting(false);

        if (res.ok && data.success) {
          setSuccessMsg(data.message);
          setSlipImage(null);
          setSlipPreviewUrl(null);
          
          // Fetch fresh user data
          const freshUserRes = await fetch(`/api/auth/me?t=${Date.now()}`);
          if (freshUserRes.ok) {
            const freshData = await freshUserRes.json();
            setCurrentUser(freshData.user);
          }

          // Redirect home after success
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 2000);
        } else {
          setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการตรวจสอบสลิปการโอนเงิน');
        }
      }, 2500);

    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setErrorMsg('เครือข่ายขัดข้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (authChecking) {
    return (
      <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center text-slate-500 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">กำลังเตรียมหน้าชำระเงิน...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex-1 font-sans">
      
      {/* Header Back Button & Balance */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition-premium font-semibold">
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
        <div className="bg-white border border-slate-200/50 rounded-xl px-4 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-700 shadow-3xs">
          <Coins className="w-4.5 h-4.5 text-indigo-500" />
          กระเป๋าเงิน: <span className="text-indigo-600 font-black">{currentUser.balance.toLocaleString()} บาท</span>
        </div>
      </div>

      {/* Title Header Banner */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-2xs mb-6">
        <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="w-5.5 h-5.5 text-indigo-600" />
          เติมเงินเข้าระบบ (Deposit)
        </h1>
        <p className="text-xs text-slate-400 mt-1">คัดลอกเลขบัญชีธนาคารเพื่อโอนเงิน หรือสแกนจ่ายผ่าน QR Code จากนั้นแนบสลิปด้านล่างเพื่ออัปเดตยอดเงินทันที</p>
      </div>

      {/* Message Alert Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-emerald-700 font-medium animate-slideDown mb-6">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{successMsg}</p>
            <p className="mt-0.5 opacity-90 text-[11px]">เครดิตถูกเติมเข้าบัญชีคุณเรียบร้อย ระบบกำลังนำคุณกลับไปหน้าแรกใน 2 วินาที...</p>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-rose-700 font-medium animate-slideDown mb-6">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SINGLE UNIFIED PAYMENT CARD */}
      <div className="w-full">
        <div className="bg-white border border-slate-200/60 hover:border-indigo-200 rounded-3xl p-6 md:p-8 shadow-sm transition-all duration-300 relative overflow-hidden flex flex-col w-full">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none transition-colors duration-300" />
          
          <div className="space-y-8 relative z-10">
            
            {/* Top Section: QR Code & Bank Info in Flex row (desktop) / col (mobile) */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-slate-100 pb-8">
              
              {/* QR Code Container */}
              <div className="flex flex-col items-center shrink-0">
                <div className="bg-[#004e7c] text-white px-4 py-2 rounded-t-2xl flex items-center justify-between w-full max-w-[280px] shadow-3xs">
                  <span className="font-sans font-black text-xs tracking-tight text-white flex items-center gap-1">
                    <span className="text-cyan-300">Prompt</span>Pay
                  </span>
                  <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">TH</span>
                </div>
                
                <div className="bg-white border-x border-b border-slate-100 p-5 rounded-b-2xl w-full max-w-[280px] flex flex-col items-center shadow-3xs">
                  {bankDetails.qrImageUrl ? (
                    <div className="border border-slate-200/80 p-2 rounded-2xl bg-white shadow-2xs relative w-56 h-56 flex items-center justify-center">
                      <img 
                        src={bankDetails.qrImageUrl} 
                        alt="Payment QR Code" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="border border-slate-200/80 p-5 rounded-2xl bg-white shadow-2xs relative w-56 h-56 flex items-center justify-center">
                      <QrCode className="w-28 h-28 text-slate-300" />
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 mt-3 font-bold tracking-wide text-center">
                    สแกนจ่ายด้วยแอปพลิเคชันธนาคาร
                  </span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="flex-1 w-full space-y-5">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shadow-md relative overflow-hidden shrink-0 border border-slate-100">
                      {bankDetails.bankLogoUrl ? (
                        <img 
                          src={bankDetails.bankLogoUrl} 
                          alt="Bank Logo" 
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-600 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-1 border border-white/20 rounded-xl flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-wider uppercase">Bank Transfer</span>
                      <h3 className="text-xs font-black text-slate-800 mt-1 tracking-wide">โอนผ่านบัญชีธนาคาร</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ธนาคาร</span>
                    <span className="text-sm font-bold text-slate-800">{bankDetails.bankName}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">เลขที่บัญชี</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 relative group">
                      <span className="text-lg font-black text-slate-800 font-mono tracking-widest">{bankDetails.accountNumber}</span>
                      <button 
                        onClick={copyToClipboard} 
                        className="text-[10px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-premium flex items-center gap-1 shrink-0 select-none shadow-3xs cursor-pointer"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedText ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ชื่อบัญชี</span>
                    <span className="text-sm font-black text-slate-800">{bankDetails.accountName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Slip Upload */}
            <div>
              <form onSubmit={handleSubmitDeposit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    อัปโหลดรูปภาพสลิปเงินโอน <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className={slipPreviewUrl ? "grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch" : "w-full"}>
                    {/* File Selection Box */}
                    <div 
                      onClick={handleTriggerFileInput}
                      className="border-2 border-dashed border-slate-200/80 hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50/50 transition-premium flex flex-col items-center justify-center gap-1.5 min-h-[120px] group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-premium flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">
                        {slipPreviewUrl ? 'เปลี่ยนรูปภาพสลิป' : 'เลือกไฟล์รูปภาพสลิปเงินโอน'}
                      </span>
                      <span className="text-[8px] text-slate-400 font-light">PNG, JPG, JPEG</span>
                    </div>

                    {/* Visual Preview Box (Only show if a slip is uploaded) */}
                    {slipPreviewUrl && (
                      <div className="border border-slate-200/80 rounded-2xl p-3 bg-slate-50/40 flex flex-col items-center justify-center min-h-[120px] text-center overflow-hidden">
                        <div className="relative border border-slate-200 rounded-xl overflow-hidden h-24 w-16 shadow-3xs bg-white flex items-center justify-center">
                          <img 
                            src={slipPreviewUrl} 
                            alt="Slip Preview" 
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <span className="text-[8px] text-slate-400 mt-1.5 font-bold">สลิปที่เลือกอัปโหลด</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-premium shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-100 disabled:text-slate-400 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังตรวจสอบหลักฐาน & เติมเครดิต...</span>
                    </>
                  ) : (
                    <span>ยืนยันการแจ้งโอนเงิน</span>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
