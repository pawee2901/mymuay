'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Loader2, PlugZap, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import { buildPromptpayPayload, isValidPromptpayId } from '@/lib/promptpay';

function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <input {...props} className="mt-1 w-full rounded-xl ring-1 ring-slate-200 px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Card({ title, children }) {
  return (
    <section className="bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-slate-100 space-y-3">
      <h2 className="text-sm font-black text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function PaymentSettingsPanel({ depositSetting }) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    promptpayId: depositSetting.promptpayId || '',
    bankName: depositSetting.bankName || '',
    accountNumber: depositSetting.accountNumber || '',
    accountName: depositSetting.accountName || '',
    bankLogoUrl: depositSetting.bankLogoUrl || '',
    slipOkApiKey: depositSetting.slipOkApiKey || '',
    slipOkBranchId: depositSetting.slipOkBranchId || '',
    wepayUsername: depositSetting.wepayUsername || '',
    wepayPassword: depositSetting.wepayPassword || '',
  }));
  const [qr, setQr] = useState({ payload: '', url: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  // Only rendered client-side (AdminShell renders nothing on the server)
  const [callbackUrl] = useState(() => (typeof window === 'undefined' ? '' : `${window.location.origin}/api/wepay/callback`));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const payload = isValidPromptpayId(form.promptpayId) ? buildPromptpayPayload(form.promptpayId, 1) : '';
  const preview = qr.payload === payload ? qr.url : '';

  useEffect(() => {
    if (!payload) return;
    QRCode.toDataURL(payload, { margin: 1, width: 240 })
      .then((url) => setQr({ payload, url }))
      .catch(() => setQr({ payload, url: '' }));
  }, [payload]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/deposit-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      Swal.fire({ icon: 'success', title: 'บันทึกแล้ว', timer: 1300, showConfirmButton: false });
      router.refresh();
    } catch (error) {
      Swal.fire({ icon: 'error', title: error.message });
    } finally {
      setSaving(false);
    }
  };

  const testWepay = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/wepay?action=balance');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Swal.fire({ icon: 'success', title: 'เชื่อมต่อ wePAY สำเร็จ', text: `ยอดเงินคงเหลือ ฿${Number(data.balance.available_balance).toLocaleString()}` });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เชื่อมต่อไม่สำเร็จ', text: error.message });
    } finally {
      setTesting(false);
    }
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body });
    const data = await res.json();
    if (res.ok) setForm((f) => ({ ...f, bankLogoUrl: data.url }));
    else Swal.fire({ icon: 'error', title: data.error || 'อัปโหลดไม่สำเร็จ' });
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card title="พร้อมเพย์ (QR ตามยอดเงิน)">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <Field label="เบอร์พร้อมเพย์ / เลขบัตรประชาชน / e-Wallet ID" value={form.promptpayId} onChange={set('promptpayId')} inputMode="numeric" placeholder="0812345678" hint="ลูกค้าจะได้ QR ที่มียอดเงินตรงกับที่ต้องจ่ายอัตโนมัติ" />
            {form.promptpayId && !isValidPromptpayId(form.promptpayId) && <p className="text-xs font-bold text-rose-600">รูปแบบไม่ถูกต้อง</p>}
          </div>
          {preview && (
            <div className="text-center shrink-0">
              <img src={preview} alt="ตัวอย่าง QR" className="w-32 h-32 mx-auto" />
              <p className="text-[11px] text-slate-400 mt-1">ทดลองสแกน (฿1)</p>
            </div>
          )}
        </div>
      </Card>

      <Card title="บัญชีธนาคาร (แสดงเป็นทางเลือก)">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="ธนาคาร" value={form.bankName} onChange={set('bankName')} />
          <Field label="เลขบัญชี" value={form.accountNumber} onChange={set('accountNumber')} />
          <Field label="ชื่อบัญชี" value={form.accountName} onChange={set('accountName')} />
          <div>
            <span className="text-xs font-bold text-slate-500">โลโก้ธนาคาร</span>
            <label className="mt-1 flex items-center gap-3 rounded-xl ring-1 ring-slate-200 px-3 py-2 cursor-pointer">
              {form.bankLogoUrl ? <img src={form.bankLogoUrl} alt="" className="w-7 h-7 object-contain" /> : <Upload className="w-5 h-5 text-slate-400" />}
              <span className="text-sm text-slate-600">เลือกรูป</span>
              <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
            </label>
          </div>
        </div>
      </Card>

      <Card title="ตรวจสลิปอัตโนมัติ (SlipOK)">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="API Key" value={form.slipOkApiKey} onChange={set('slipOkApiKey')} autoComplete="off" />
          <Field label="Branch ID" value={form.slipOkBranchId} onChange={set('slipOkBranchId')} />
        </div>
      </Card>

      <Card title="wePAY (เติมเกม / บัตรเติมเงิน)">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Username" value={form.wepayUsername} onChange={set('wepayUsername')} autoComplete="off" />
          <Field label="Password" type="password" value={form.wepayPassword} onChange={set('wepayPassword')} autoComplete="new-password" hint="ระบบส่งเป็น MD5 ตามคู่มือ wePAY" />
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <p>• ต้องแจ้ง wePAY ให้อนุญาต <b>IP ของเซิร์ฟเวอร์</b> และเปิดใช้งาน API (ถ้าไม่เปิดจะขึ้น error 20004/20005)</p>
          <p className="break-all">• Callback URL (ระบบส่งให้อัตโนมัติทุกรายการ): <b>{callbackUrl}</b></p>
          <p>• ถ้าเว็บอยู่หลัง proxy ให้ตั้ง <code>PUBLIC_BASE_URL</code> ใน .env เป็นโดเมนจริง</p>
        </div>
        <button type="button" onClick={testWepay} disabled={testing} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold disabled:opacity-60">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />} ทดสอบการเชื่อมต่อ (บันทึกก่อน)
        </button>
      </Card>

      <div className="sticky bottom-20 md:bottom-4">
        <button type="button" onClick={save} disabled={saving} className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg disabled:opacity-60">
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
        </button>
      </div>
    </div>
  );
}
