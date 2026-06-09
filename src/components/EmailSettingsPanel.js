'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, RefreshCw, Mail, Server, Eye, EyeOff, 
  CheckCircle, XCircle, ToggleLeft, ToggleRight, AlertCircle,
  Smartphone, Edit, Upload, Image, X
} from 'lucide-react';
import Swal from 'sweetalert2';

// IMAP presets for popular providers
const IMAP_PRESETS = {
  'gmail.com':     { host: 'imap.gmail.com',        port: 993, tls: true  },
  'hotmail.com':   { host: 'outlook.office365.com', port: 993, tls: true  },
  'outlook.com':   { host: 'outlook.office365.com', port: 993, tls: true  },
  'live.com':      { host: 'outlook.office365.com', port: 993, tls: true  },
  'yahoo.com':     { host: 'imap.mail.yahoo.com',   port: 993, tls: true  },
  'icloud.com':    { host: 'imap.mail.me.com',      port: 993, tls: true  },
  'zoho.com':      { host: 'imap.zoho.com',         port: 993, tls: true  },
};

const DEFAULT_APP_ICONS = {
  chatgpt: '🤖',
  netflix: '🎬',
  disney: '✨',
  trueid: '📺',
  prime: '🎥',
  spotify: '🎵',
  youtube: '▶️',
  other: '📧'
};

export default function EmailSettingsPanel() {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState('emails'); // 'emails', 'apps', or 'providers'

  // IMAP settings states
  const [settings, setSettings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [showPw, setShowPw]       = useState(false);

  const [form, setForm] = useState({
    domain: '', host: '', port: '993', tls: true,
    user: '', password: '', appId: ''
  });

  // OTP apps states
  const [apps, setApps]           = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [showAppForm, setShowAppForm] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [appForm, setAppForm] = useState({
    id: '', name: '', senderEmails: '', regexPattern: '', logoUrl: '', isActive: true
  });

  // OTP providers states
  const [providers, setProviders]               = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [savingProvider, setSavingProvider]     = useState(false);

  const [providerForm, setProviderForm] = useState({
    id: '', name: '', apiUrl: '', domains: '', isActive: true
  });

  // Load IMAP settings
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email-settings');
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } finally { setLoading(false); }
  };

  // Load OTP apps
  const loadApps = async () => {
    setAppsLoading(true);
    try {
      const res = await fetch('/api/admin/otp-apps');
      const data = await res.json();
      if (data.success) setApps(data.apps);
    } finally { setAppsLoading(false); }
  };

  // Load OTP Providers
  const loadProviders = async () => {
    setProvidersLoading(true);
    try {
      const res = await fetch('/api/admin/otp-providers');
      const data = await res.json();
      if (data.success) setProviders(data.providers);
    } finally { setProvidersLoading(false); }
  };

  useEffect(() => {
    load();
    loadApps();
    loadProviders();
  }, []);

  // Save OTP Provider
  const handleSaveProvider = async (e) => {
    e.preventDefault();
    setSavingProvider(true);
    try {
      const res = await fetch('/api/admin/otp-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: providerForm.id || null,
          name: providerForm.name.trim(),
          apiUrl: providerForm.apiUrl.trim(),
          domains: providerForm.domains.trim(),
          isActive: providerForm.isActive
        })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกผู้ให้บริการ API เรียบร้อยแล้วค่ะ', timer: 1500, showConfirmButton: false });
        setShowProviderForm(false);
        setProviderForm({ id: '', name: '', apiUrl: '', domains: '', isActive: true });
        loadProviders();
      } else {
        Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: data.error || 'บันทึกไม่สำเร็จ' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'เครือข่ายขัดข้อง' });
    } finally {
      setSavingProvider(false);
    }
  };

  // Toggle OTP Provider active status
  const handleToggleProvider = async (id, current) => {
    try {
      const res = await fetch('/api/admin/otp-providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current })
      });
      const data = await res.json();
      if (data.success) {
        loadProviders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete OTP Provider
  const handleDeleteProvider = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบผู้ให้บริการ',
      text: 'ต้องการลบผู้ให้บริการ API นี้ใช่หรือไม่? การลบจะทำให้โดเมนอีเมลของผู้ให้บริการนี้ไม่สามารถดึงข้อมูลได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/otp-providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        loadProviders();
      } else {
        Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: data.error || 'ลบไม่สำเร็จ' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'เครือข่ายขัดข้อง' });
    }
  };

  // Edit Provider (populate form)
  const startEditProvider = (provider) => {
    setProviderForm({
      id: provider.id,
      name: provider.name,
      apiUrl: provider.apiUrl,
      domains: provider.domains || '',
      isActive: provider.isActive
    });
    setShowProviderForm(true);
  };

  // Dynamic dropdown options for apps
  const appOptions = [
    { value: '', label: 'ทุกแอป (ไม่จำกัด)' },
    ...apps.map(a => ({ value: a.id, label: a.name }))
  ];

  // Auto-fill IMAP host when email changes
  const handleEmailChange = (val) => {
    setForm(f => ({ ...f, user: val, domain: val }));
    const domain = val.split('@')[1]?.toLowerCase();
    const preset = domain && IMAP_PRESETS[domain];
    if (preset) {
      setForm(f => ({ ...f, user: val, domain: val, host: preset.host, port: String(preset.port), tls: preset.tls }));
    }
  };

  // Save IMAP settings
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: form.domain.trim(),
          host:   form.host.trim(),
          port:   parseInt(form.port),
          tls:    form.tls,
          user:   form.user.trim(),
          password: form.password.trim(),
          appId:  form.appId || null,
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✅ บันทึกสำเร็จ!');
        setShowForm(false);
        setForm({ domain:'', host:'', port:'993', tls:true, user:'', password:'', appId:'' });
        load();
      } else {
        setMsg('❌ ' + (data.error || 'บันทึกไม่สำเร็จ'));
      }
    } catch { setMsg('❌ เครือข่ายขัดข้อง'); }
    finally { setSaving(false); }
  };

  // Delete IMAP setting
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ต้องการลบการตั้งค่านี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;
    await fetch('/api/admin/email-settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    load();
  };

  // Toggle IMAP setting active status
  const handleToggle = async (id, current) => {
    await fetch('/api/admin/email-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current })
    });
    load();
  };

  // ─── OTP Apps CRUD ────────────────────────────────────────────────────────

  // Save dynamic OTP app
  const handleSaveApp = async (e) => {
    e.preventDefault();
    setSavingApp(true);
    try {
      const res = await fetch('/api/admin/otp-apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appForm.id || null,
          name: appForm.name.trim(),
          senderEmails: appForm.senderEmails.trim(),
          regexPattern: appForm.regexPattern.trim() || null,
          logoUrl: appForm.logoUrl.trim() || null,
          isActive: appForm.isActive
        })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกแอปพลิเคชันเรียบร้อยแล้วค่ะ', timer: 1500, showConfirmButton: false });
        setShowAppForm(false);
        setAppForm({ id: '', name: '', senderEmails: '', regexPattern: '', logoUrl: '', isActive: true });
        loadApps();
      } else {
        Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: data.error || 'บันทึกไม่สำเร็จ' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'เครือข่ายขัดข้อง' });
    } finally {
      setSavingApp(false);
    }
  };

  // Toggle OTP App active status
  const handleToggleApp = async (id, current) => {
    try {
      const res = await fetch('/api/admin/otp-apps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current })
      });
      const data = await res.json();
      if (data.success) {
        loadApps();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete OTP App
  const handleDeleteApp = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบแอปพลิเคชัน',
      text: 'ต้องการลบแอปพลิเคชันนี้ใช่หรือไม่? การลบจะทำให้ผู้ใช้ไม่เห็นแอปนี้ในหน้ารับรหัส OTP',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/otp-apps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        loadApps();
      } else {
        Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: data.error || 'ลบไม่สำเร็จ' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'เครือข่ายขัดข้อง' });
    }
  };

  // Logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาอัปโหลดเฉพาะไฟล์รูปภาพค่ะ' });
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }

      setAppForm(f => ({ ...f, logoUrl: data.url }));
      Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ', text: 'อัปโหลดโลโก้เรียบร้อยแล้วค่ะ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'อัปโหลดล้มเหลว', text: err.message });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Edit App (populate form)
  const startEditApp = (app) => {
    setAppForm({
      id: app.id,
      name: app.name,
      senderEmails: app.senderEmails || '',
      regexPattern: app.regexPattern || '',
      logoUrl: app.logoUrl || '',
      isActive: app.isActive
    });
    setShowAppForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab selection */}
      <div className="flex gap-2 border-b border-slate-100 pb-3 mb-2 flex-wrap">
        <button
          onClick={() => setActiveSubTab('emails')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'emails'
              ? 'bg-purple-100 text-purple-700 shadow-sm shadow-purple-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          บัญชีอีเมล IMAP
        </button>
        <button
          onClick={() => setActiveSubTab('apps')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'apps'
              ? 'bg-purple-100 text-purple-700 shadow-sm shadow-purple-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          ตั้งค่าแอปพลิเคชัน (OTP Apps)
        </button>
        <button
          onClick={() => setActiveSubTab('providers')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'providers'
              ? 'bg-purple-100 text-purple-700 shadow-sm shadow-purple-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Server className="w-4 h-4" />
          ตั้งค่า API (OTP Providers)
        </button>
      </div>

      {/* ────────────────── SUB-TAB: EMAILS ────────────────── */}
      {activeSubTab === 'emails' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-500" />
                จัดการอีเมล IMAP (รับ OTP อัตโนมัติ)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">เพิ่มอีเมล+รหัสผ่านไว้ล่วงหน้า — ผู้ใช้จะไม่ต้องกรอก password เองค่ะ</p>
            </div>
            <div className="flex gap-2">
              <button onClick={load} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-purple-500 hover:border-purple-200 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowForm(v => !v); setMsg(''); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}>
                <Plus className="w-4 h-4" />
                เพิ่มอีเมล
              </button>
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 rounded-2xl text-xs leading-relaxed flex items-start gap-2"
            style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', color: '#1e40af' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <strong>วิธีใช้:</strong> เพิ่มอีเมลพร้อม App Password ที่นี่ → ผู้ใช้แค่พิมพ์อีเมลในหน้า OTP → ระบบดึงรหัสให้อัตโนมัติโดยไม่ต้องกรอก password เลยค่ะ
              <br/>
              <span className="text-blue-600 font-semibold">💡 Gmail/Hotmail ต้องใช้ App Password ไม่ใช่รหัสปกติ</span>
            </div>
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-sm font-medium ${msg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
              {msg}
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <div className="bg-slate-50 border-2 border-purple-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-700">➕ เพิ่มอีเมลใหม่</h4>
              <form onSubmit={handleSave} className="space-y-3">
                {/* Email / domain */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">อีเมล หรือ Domain</label>
                  <input
                    required
                    placeholder="user@gmail.com  หรือ  gmail.com (catch-all)"
                    value={form.user}
                    onChange={e => handleEmailChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ใส่ email เฉพาะคน หรือ domain สำหรับ catch-all (เช่น hotmail.com รับทุก @hotmail)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* IMAP Host */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block flex items-center gap-1">
                      <Server className="w-3 h-3" /> IMAP Host
                    </label>
                    <input
                      required
                      placeholder="imap.gmail.com"
                      value={form.host}
                      onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700 font-mono"
                    />
                  </div>
                  {/* Port */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Port</label>
                    <input
                      value={form.port}
                      onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700 font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">App Password / รหัสผ่าน IMAP</label>
                  <div className="relative">
                    <input
                      required
                      type={showPw ? 'text' : 'password'}
                      placeholder="App Password (ไม่ใช่รหัสปกติสำหรับ Gmail/Hotmail)"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700 font-mono tracking-wider"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* TLS + App lock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">ล็อกเฉพาะแอป (optional)</label>
                    <select value={form.appId} onChange={e => setForm(f => ({ ...f, appId: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700">
                      {appOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <label className="text-xs font-bold text-slate-600">SSL/TLS</label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, tls: !f.tls }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.tls ? 'bg-purple-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.tls ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-xs text-slate-500">{form.tls ? 'เปิด' : 'ปิด'}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}>
                    {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Settings list */}
          {loading ? (
            <div className="text-center py-8 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">กำลังโหลด...</p>
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">ยังไม่มีอีเมลในระบบ</p>
              <p className="text-xs mt-1">กดปุ่ม "เพิ่มอีเมล" ด้านบนเพื่อเริ่มต้นค่ะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.map(s => {
                const appName = apps.find(a => a.id === s.appId)?.name || s.appId;
                return (
                  <div key={s.id}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${s.isActive ? 'border-green-200 bg-green-50/20' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${s.isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                      {s.domain.includes('@') ? '📧' : '🌐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.domain}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{s.host}:{s.port} · {s.user}</p>
                      {s.appId && <span className="inline-block mt-1 text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">🔒 {appName}</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Active toggle */}
                      <button onClick={() => handleToggle(s.id, s.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'text-green-600 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={s.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}>
                        {s.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      {/* Delete */}
                      <button onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── SUB-TAB: OTP APPS ────────────────── */}
      {activeSubTab === 'apps' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-500" />
                จัดการแอปพลิเคชัน OTP
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">เปลี่ยนรูปโลโก้, ตั้งชื่อแอป, และตั้งค่าอีเมลผู้ส่งสำหรับการค้นหาข้อความ OTP</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadApps} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-purple-500 hover:border-purple-200 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => {
                setAppForm({ id: '', name: '', senderEmails: '', regexPattern: '', logoUrl: '', isActive: true });
                setShowAppForm(v => !v);
              }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}>
                <Plus className="w-4 h-4" />
                เพิ่มแอปพลิเคชัน
              </button>
            </div>
          </div>

          {/* App form */}
          {showAppForm && (
            <div className="bg-slate-50 border-2 border-purple-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-700">
                {appForm.id ? '📝 แก้ไขแอปพลิเคชัน' : '➕ เพิ่มแอปพลิเคชันใหม่'}
              </h4>
              <form onSubmit={handleSaveApp} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">ชื่อแอปพลิเคชัน</label>
                    <input
                      required
                      placeholder="เช่น Netflix, Disney+, ChatGPT"
                      value={appForm.name}
                      onChange={e => setAppForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700"
                    />
                  </div>

                  {/* Sender emails */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">อีเมลผู้ส่ง (กรองคำที่อยู่ในเมลล์ผู้ส่ง)</label>
                    <input
                      placeholder="เช่น netflix.com, openai.com (ใช้คอมม่าแยก)"
                      value={appForm.senderEmails}
                      onChange={e => setAppForm(f => ({ ...f, senderEmails: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">ระบบจะหาเมลจากผู้ส่งที่มีคำเหล่านี้ในการดึง OTP</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Logo Image Upload */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">รูปภาพโลโก้แอปพลิเคชัน</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center text-lg overflow-hidden shrink-0">
                        {appForm.logoUrl ? (
                          <img src={appForm.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingLogo ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ...'}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                        </label>
                        <input
                          type="hidden"
                          value={appForm.logoUrl}
                        />
                        {appForm.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setAppForm(f => ({ ...f, logoUrl: '' }))}
                            className="block mt-1 text-[10px] text-rose-500 hover:underline font-bold"
                          >
                            ลบรูปภาพ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Regex pattern */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Regex Pattern (ไม่บังคับ)</label>
                    <input
                      placeholder="เช่น \b(\d{6})\b (เว้นว่างไว้จะดึงรหัส 4-8 หลักให้ปกติ)"
                      value={appForm.regexPattern}
                      onChange={e => setAppForm(f => ({ ...f, regexPattern: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={savingApp}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}>
                    {savingApp ? '⏳ กำลังบันทึก...' : '💾 บันทึกแอป'}
                  </button>
                  <button type="button" onClick={() => setShowAppForm(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Apps List */}
          {appsLoading ? (
            <div className="text-center py-8 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">กำลังโหลดแอปพลิเคชัน...</p>
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">ยังไม่มีแอปพลิเคชันในระบบ</p>
              <p className="text-xs mt-1">กดปุ่ม "เพิ่มแอปพลิเคชัน" ด้านบนเพื่อเพิ่มแอปค่ะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map(app => {
                const isPreset = DEFAULT_APP_ICONS[app.id];
                const fallbackIcon = isPreset || '📱';
                return (
                  <div key={app.id}
                    className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${
                      app.isActive ? 'border-purple-100 bg-white shadow-sm' : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}>
                    <div className="flex items-center gap-3">
                      {/* Logo or Emoji */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-xl shrink-0">
                        {app.logoUrl ? (
                          <img src={app.logoUrl} alt={app.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{fallbackIcon}</span>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{app.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {app.id}</span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleToggleApp(app.id, app.isActive)}
                          className={`p-1.5 rounded-lg transition-colors ${app.isActive ? 'text-purple-600 hover:bg-purple-50' : 'text-slate-400 hover:bg-slate-100'}`}
                          title={app.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}>
                          {app.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => startEditApp(app)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="แก้ไข">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteApp(app.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="ลบ">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sender emails info */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                      <p className="text-[10px] text-slate-500">
                        <span className="font-bold text-slate-700">อีเมลผู้ส่ง: </span>
                        {app.senderEmails ? (
                          <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700">{app.senderEmails}</code>
                        ) : (
                          <span className="text-slate-400 italic">ไม่ได้กำหนด (ดึงเมลล่าสุดทั้งหมด)</span>
                        )}
                      </p>
                      {app.regexPattern && (
                        <p className="text-[10px] text-slate-500">
                          <span className="font-bold text-slate-700">Regex: </span>
                          <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{app.regexPattern}</code>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── SUB-TAB: PROVIDERS (API) ────────────────── */}
      {activeSubTab === 'providers' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-500" />
                จัดการ API (OTP Providers)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">ตั้งค่า API Endpoint (เช่น Maily Space API) และโดเมนอีเมลชั่วคราวที่รองรับ</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadProviders} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-purple-500 hover:border-purple-200 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => {
                setProviderForm({ id: '', name: '', apiUrl: '', domains: '', isActive: true });
                setShowProviderForm(v => !v);
              }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}>
                <Plus className="w-4 h-4" />
                เพิ่มผู้ให้บริการ
              </button>
            </div>
          </div>

          {/* Provider form */}
          {showProviderForm && (
            <div className="bg-slate-50 border-2 border-purple-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-700">
                {providerForm.id ? '📝 แก้ไขผู้ให้บริการ' : '➕ เพิ่มผู้ให้บริการใหม่'}
              </h4>
              <form onSubmit={handleSaveProvider} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">ชื่อผู้ให้บริการ</label>
                    <input
                      required
                      placeholder="เช่น Maily Space หลัก, API สำรอง"
                      value={providerForm.name}
                      onChange={e => setProviderForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700"
                    />
                  </div>

                  {/* API URL */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">API URL Endpoint</label>
                    <input
                      required
                      placeholder="เช่น https://api.maily.space/mail/public/mails"
                      value={providerForm.apiUrl}
                      onChange={e => setProviderForm(f => ({ ...f, apiUrl: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700 font-mono"
                    />
                  </div>
                </div>

                {/* Domains */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">โดเมนที่รองรับ (ใช้คอมม่าแยก)</label>
                  <input
                    required
                    placeholder="เช่น lico.moe, rdcw.plus, gooddaymail.com (คั่นด้วยเครื่องหมายจุลภาค)"
                    value={providerForm.domains}
                    onChange={e => setProviderForm(f => ({ ...f, domains: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-purple-400 text-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ผู้ใช้กรอกเมลที่มีโดเมนเหล่านี้ ระบบจะวิ่งไปดึงเมลจาก API URL ที่กำหนดไว้ข้างต้นทันที</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={savingProvider}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}>
                    {savingProvider ? '⏳ กำลังบันทึก...' : '💾 บันทึกผู้ให้บริการ'}
                  </button>
                  <button type="button" onClick={() => setShowProviderForm(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Providers List */}
          {providersLoading ? (
            <div className="text-center py-8 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">กำลังโหลดผู้ให้บริการ...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Server className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">ยังไม่มีผู้ให้บริการ API ในระบบ</p>
              <p className="text-xs mt-1">กดปุ่ม "เพิ่มผู้ให้บริการ" ด้านบนเพื่อเพิ่ม API ค่ะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map(prov => (
                <div key={prov.id}
                  className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${
                    prov.isActive ? 'border-purple-100 bg-white shadow-sm' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${prov.isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>
                        <Server className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{prov.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={prov.apiUrl}>
                          {prov.apiUrl}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleToggleProvider(prov.id, prov.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${prov.isActive ? 'text-purple-600 hover:bg-purple-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={prov.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}>
                        {prov.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => startEditProvider(prov)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="แก้ไข">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProvider(prov.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="ลบ">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Domains info */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">โดเมนที่เปิดรับ:</span>
                    <div className="flex flex-wrap gap-1">
                      {prov.domains.split(',').map((d, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          @{d.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
