'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Mail, Server, Eye, EyeOff, CheckCircle, XCircle, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';

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

const APP_OPTIONS = [
  { value: '', label: 'ทุกแอป (ไม่จำกัด)' },
  { value: 'chatgpt', label: '🤖 ChatGPT' },
  { value: 'netflix', label: '🎬 Netflix' },
  { value: 'disney',  label: '✨ Disney+' },
  { value: 'trueid',  label: '📺 TrueID' },
  { value: 'prime',   label: '🎥 Prime Video' },
  { value: 'spotify', label: '🎵 Spotify' },
];

export default function EmailSettingsPanel() {
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email-settings');
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Auto-fill IMAP host when email changes
  const handleEmailChange = (val) => {
    setForm(f => ({ ...f, user: val, domain: val }));
    const domain = val.split('@')[1]?.toLowerCase();
    const preset = domain && IMAP_PRESETS[domain];
    if (preset) {
      setForm(f => ({ ...f, user: val, domain: val, host: preset.host, port: String(preset.port), tls: preset.tls }));
    }
  };

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

  const handleDelete = async (id) => {
    if (!confirm('ลบการตั้งค่านี้?')) return;
    await fetch('/api/admin/email-settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    load();
  };

  const handleToggle = async (id, current) => {
    await fetch('/api/admin/email-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current })
    });
    load();
  };

  return (
    <div className="space-y-4">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all"
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
                  {APP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        <div className="space-y-2">
          {settings.map(s => (
            <div key={s.id}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${s.isActive ? 'border-green-200 bg-green-50/40' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${s.isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                {s.domain.includes('@') ? '📧' : '🌐'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{s.domain}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{s.host}:{s.port} · {s.user}</p>
                {s.appId && <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">🔒 {s.appId}</span>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
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
          ))}
        </div>
      )}
    </div>
  );
}
