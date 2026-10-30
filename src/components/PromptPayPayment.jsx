'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Loader2, Upload, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { buildPromptpayPayload } from '@/lib/promptpay';

let settingsPromise = null;
function loadSettings() {
  if (!settingsPromise) {
    settingsPromise = fetch('/api/admin/deposit-settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => data.setting || {})
      .catch(() => {
        settingsPromise = null;
        return {};
      });
  }
  return settingsPromise;
}

/**
 * Shows a PromptPay QR for `amount`, then lets the customer upload the slip.
 * onPaid({ balance, message }) fires after the slip has been verified and credited.
 */
export default function PromptPayPayment({ amount, onPaid }) {
  const fileRef = useRef(null);
  const submittingRef = useRef(false); // กันกดส่งสลิปซ้ำเร็วๆ ก่อน state อัปเดต
  const [settings, setSettings] = useState(null);
  const [qr, setQr] = useState({ payload: '', url: '' });
  const [slip, setSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const payload = settings?.promptpayId && amount > 0 ? buildPromptpayPayload(settings.promptpayId, amount) : '';
  const qrDataUrl = qr.payload === payload ? qr.url : '';

  useEffect(() => {
    if (!payload) return;
    QRCode.toDataURL(payload, { margin: 1, width: 520, errorCorrectionLevel: 'M' })
      .then((url) => setQr({ payload, url }))
      .catch(() => setQr({ payload, url: '' }));
  }, [payload]);

  useEffect(() => () => slipPreview && URL.revokeObjectURL(slipPreview), [slipPreview]);

  const pickSlip = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSlip(file);
    setSlipPreview(URL.createObjectURL(file));
    setStatus('idle');
    setMessage('');
  };

  const submitSlip = async () => {
    if (!slip) {
      fileRef.current?.click();
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus('uploading');
    setMessage('');
    try {
      const form = new FormData();
      form.append('slip', slip);
      const res = await fetch('/api/auth/deposit', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'ตรวจสอบสลิปไม่สำเร็จ');
      setStatus('done');
      setMessage(data.message);
      setSlip(null);
      onPaid?.({ balance: data.balance, message: data.message });
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      submittingRef.current = false;
    }
  };

  const copyAccount = () => {
    navigator.clipboard.writeText((settings?.accountNumber || '').replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const hasPromptpay = Boolean(settings.promptpayId);

  return (
    <div className="space-y-5">
      {/* QR */}
      <div className="flex flex-col items-center text-center">
        <div className="w-full max-w-[280px] rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200">
          <div className="bg-[#0e3d6b] text-white text-sm font-black py-2 tracking-tight">
            <span className="text-sky-300">Prompt</span>Pay
          </div>
          <div className="p-4">
            {hasPromptpay ? (
              qrDataUrl ? (
                <img src={qrDataUrl} alt="PromptPay QR" className="w-full aspect-square" />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-slate-300">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )
            ) : settings.qrImageUrl ? (
              <img src={settings.qrImageUrl} alt="QR" className="w-full aspect-square object-contain" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center text-xs text-slate-400">ร้านยังไม่ได้ตั้งค่าพร้อมเพย์</div>
            )}
            <p className="mt-3 text-[11px] text-slate-500">ยอดที่ต้องโอน</p>
            <p className="text-3xl font-black text-slate-900 leading-tight">
              ฿{Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {settings.accountName && <p className="text-[11px] text-slate-500 mt-1">ชื่อบัญชี: {settings.accountName}</p>}
          </div>
        </div>

        {qrDataUrl && (
          <a href={qrDataUrl} download={`promptpay-${amount}.png`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <Download className="w-3.5 h-3.5" />
            บันทึกรูป QR
          </a>
        )}
        {!hasPromptpay && settings.qrImageUrl && (
          <p className="mt-2 text-[11px] text-amber-600">QR นี้ไม่มียอดเงินในตัว กรุณากรอกยอด ฿{Number(amount).toLocaleString()} เอง</p>
        )}
      </div>

      {/* Bank transfer fallback */}
      {settings.accountNumber && (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          {settings.bankLogoUrl ? (
            <img src={settings.bankLogoUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-white" />
          ) : (
            <span className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"><Building2 className="w-4 h-4" /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500 truncate">หรือโอนเข้าบัญชี {settings.bankName}</p>
            <p className="font-mono font-bold text-slate-800 tracking-wider">{settings.accountNumber}</p>
          </div>
          <button type="button" onClick={copyAccount} className="shrink-0 text-xs font-bold text-blue-600 flex items-center gap-1 px-2 py-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
        </div>
      )}

      {/* Slip */}
      <input ref={fileRef} type="file" accept="image/*" onChange={pickSlip} className="hidden" />
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 px-4 py-3 text-left transition"
        >
          {slipPreview ? (
            <img src={slipPreview} alt="สลิป" className="w-10 h-14 object-cover rounded-md" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Upload className="w-4 h-4" /></span>
          )}
          <span className="text-sm font-bold text-slate-700">{slip ? 'เปลี่ยนรูปสลิป' : 'แนบสลิปหลังโอนเงิน'}</span>
        </button>

        {message && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-medium ${status === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {status === 'done' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        <button
          type="button"
          onClick={submitSlip}
          disabled={status === 'uploading'}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2"
        >
          {status === 'uploading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {status === 'uploading' ? 'กำลังตรวจสอบสลิป...' : slip ? 'ยืนยันการโอนเงิน' : 'แนบสลิปเพื่อยืนยัน'}
        </button>
      </div>
    </div>
  );
}
