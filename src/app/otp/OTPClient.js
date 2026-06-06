'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, Mail, KeyRound, CheckCircle,
  AlertCircle, Copy, Clock, Inbox, X, Zap, Lock
} from 'lucide-react';

// ─── App list ─────────────────────────────────────────────────────────────────
const APP_LIST = [
  { id: 'chatgpt',  name: 'ChatGPT',     emoji: '🤖', color: '#10a37f', bg: '#f0fdf9', border: '#6ee7b7' },
  { id: 'netflix',  name: 'Netflix',     emoji: '🎬', color: '#e50914', bg: '#fff1f2', border: '#fca5a5' },
  { id: 'disney',   name: 'Disney+',     emoji: '✨', color: '#0a3780', bg: '#eff6ff', border: '#93c5fd' },
  { id: 'trueid',   name: 'TrueID',      emoji: '📺', color: '#e53e3e', bg: '#fff5f5', border: '#fed7d7' },
  { id: 'prime',    name: 'Prime Video', emoji: '🎥', color: '#00a8e0', bg: '#f0f9ff', border: '#7dd3fc' },
  { id: 'spotify',  name: 'Spotify',     emoji: '🎵', color: '#1db954', bg: '#f0fdf4', border: '#86efac' },
  { id: 'youtube',  name: 'YouTube',     emoji: '▶️', color: '#ff0000', bg: '#fff1f2', border: '#fca5a5' },
  { id: 'other',    name: 'ทุกอีเมล',    emoji: '📧', color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd' },
];

const MAILY_DOMAINS = ['lico.moe', 'rdcw.plus', 'gooddaymail.com', 'rdcw.co.th'];
const isMailyEmail  = (email) => MAILY_DOMAINS.includes((email||'').split('@')[1]?.toLowerCase());

function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return `${s} วิที่แล้ว`;
  if (s < 3600)  return `${Math.floor(s/60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s/3600)} ชม.ที่แล้ว`;
  return new Date(d).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
}

function extractOtp(text = '') {
  const m = text.match(/\b(\d{6})\b/) || text.match(/\b(\d{4,8})\b/);
  return m ? m[1] : null;
}

function extractImages(html = '') {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const images = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Skip tracking pixels or common analytics
    if (!src.includes('pixel') && !src.includes('open') && !src.includes('track') && !src.includes('analytics') && !src.includes('stat')) {
      images.push(src);
    }
  }
  return images;
}

export default function OTPClient() {
  const searchParams = useSearchParams();
  const [step, setStep]         = useState(1);
  const [selectedApp, setApp]   = useState(null);
  const [emailInput, setEmail]  = useState('');
  const [isLoading, setLoading] = useState(false);
  const [inbox, setInbox]       = useState([]);
  const [otpResult, setOtp]     = useState(null);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);
  const [autoRefresh, setAuto]  = useState(false);
  const autoRef                 = useRef(null);

  // ─── Read URL params → auto-jump to inbox ─────────────────────────────────
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlApp   = searchParams.get('app');
    if (urlEmail?.includes('@')) {
      const app = APP_LIST.find(a => a.id === urlApp) || APP_LIST.find(a => a.id === 'other');
      setApp(app);
      setEmail(urlEmail);
      setStep(3); // skip to inbox
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── When step jumps to 3 from URL and inbox is empty → auto-load ─────────
  useEffect(() => {
    if (step === 3 && emailInput.includes('@') && inbox.length === 0) {
      loadInbox();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, emailInput]);

  // ─── Load inbox ────────────────────────────────────────────────────────────
  const loadInbox = useCallback(async (silent = false) => {
    if (!emailInput.includes('@')) return;
    if (!silent) { setLoading(true); setError(''); }
    try {
      const res  = await fetch(`/api/otp/inbox?email=${encodeURIComponent(emailInput.trim())}&size=20`);
      const data = await res.json();
      if (data.notConfigured) {
        setError('อีเมลนี้ยังไม่ได้ตั้งค่าในระบบ\nกรุณาแจ้งแอดมินเพื่อเพิ่มอีเมลนี้ก่อนนะคะ 🙏');
        return;
      }
      if (data.success) {
        setInbox(data.mails || []);
        if (!silent) setStep(3);
      } else {
        setError(data.error || 'ดึงกล่องจดหมายไม่ได้ค่ะ');
      }
    } catch { if (!silent) setError('เครือข่ายขัดข้อง กรุณาลองใหม่'); }
    finally  { if (!silent) setLoading(false); }
  }, [emailInput]);

  // ─── Fetch OTP ─────────────────────────────────────────────────────────────
  const fetchOtp = useCallback(async () => {
    if (!emailInput.includes('@')) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/otp/fetch', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ appId: selectedApp?.id||'other', email: emailInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtp(data); setStep(4);
        loadInbox(true);
      } else {
        setError(data.error || 'ไม่พบ OTP ในขณะนี้');
      }
    } catch { setError('เครือข่ายขัดข้อง'); }
    finally  { setLoading(false); }
  }, [emailInput, selectedApp, loadInbox]);

  // Auto-refresh every 10s
  useEffect(() => {
    clearInterval(autoRef.current);
    if (autoRefresh && step >= 3) {
      autoRef.current = setInterval(() => fetchOtp(), 10000);
    }
    return () => clearInterval(autoRef.current);
  }, [autoRefresh, step, fetchOtp]);

  const copyOtp = () => {
    navigator.clipboard.writeText(otpResult?.code || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setStep(1); setApp(null); setEmail('');
    setInbox([]); setOtp(null); setError(''); setAuto(false);
  };

  const emailImages = otpResult?.html_body ? extractImages(otpResult.html_body) : [];
  const containerMaxWidth = step >= 3 ? 'max-w-4xl' : 'max-w-lg';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{
      background:'linear-gradient(135deg,#fce4f3 0%,#e8f4fd 40%,#f0ebff 70%,#fdf4e8 100%)',
      fontFamily:"'Noto Sans Thai','Inter',sans-serif"
    }}>
      {/* bg blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-8 w-56 h-28 rounded-full opacity-25"
          style={{ background:'radial-gradient(ellipse,#fff 0%,transparent 70%)' }} />
        <div className="absolute top-36 right-12 w-40 h-20 rounded-full opacity-20"
          style={{ background:'radial-gradient(ellipse,#fff 0%,transparent 70%)' }} />
        <div className="absolute bottom-40 left-1/3 w-72 h-36 rounded-full opacity-20"
          style={{ background:'radial-gradient(ellipse,#fff 0%,transparent 70%)' }} />
      </div>

      <div className={`relative z-10 w-full ${containerMaxWidth} mx-auto px-4 py-6 flex flex-col min-h-screen transition-all duration-300`}>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-white/80 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าหลัก
          </Link>
          {step > 1 && (
            <button onClick={reset} className="text-xs font-bold text-slate-500 hover:text-rose-500 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-white/80 transition-colors">
              เริ่มใหม่
            </button>
          )}
        </div>

        {/* Title */}
        <motion.div initial={{ opacity:0,y:-15 }} animate={{ opacity:1,y:0 }} className="text-center mb-5">
          <div className="text-4xl mb-1.5">🔐</div>
          <h1 className="text-xl font-black text-slate-800">รับรหัส OTP</h1>
          <p className="text-xs text-slate-500 mt-1">กดรับรหัสด้วยตัวเองได้เลย · ไม่ต้องรอแอดมิน</p>
        </motion.div>

        {/* Step bar */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {[1,2,3,4].map(s => (
            <div key={s} className="flex items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                style={step >= s
                  ? { background:'linear-gradient(135deg,#c084fc,#818cf8)', color:'#fff', boxShadow:'0 2px 10px rgba(192,132,252,.4)' }
                  : { background:'#fff', color:'#94a3b8', border:'2px solid #e2e8f0' }}>
                {s}
              </div>
              {s < 4 && <div className="w-7 h-0.5 mx-1 rounded-full transition-all duration-500"
                style={{ background:step > s ? 'linear-gradient(90deg,#c084fc,#818cf8)' : '#e2e8f0' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-15 }}
            transition={{ duration:0.25 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/80 p-5 flex-1">

            {/* ══ STEP 1: Select App ══ */}
            {step === 1 && (
              <div>
                <p className="text-center text-sm font-bold text-slate-600 mb-1">เลือกแอปที่ต้องการรับรหัส</p>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-200 mx-auto mb-4" />
                <div className="grid grid-cols-2 gap-3">
                  {APP_LIST.map(app => (
                    <motion.button key={app.id}
                      whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                      onClick={() => { setApp(app); setStep(2); setError(''); }}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all"
                      style={{ borderColor:app.border, backgroundColor:app.bg }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-sm"
                        style={{ backgroundColor:`${app.color}15`, border:`2px solid ${app.border}` }}>
                        {app.emoji}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{app.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ STEP 2: Email only ══ */}
            {step === 2 && selectedApp && (
              <div>
                <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl border-2"
                  style={{ backgroundColor:selectedApp.bg, borderColor:selectedApp.border }}>
                  <span className="text-2xl">{selectedApp.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800">{selectedApp.name}</p>
                    <p className="text-xs text-slate-500">เลือกแล้ว</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={e => { e.preventDefault(); loadInbox(); }} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-500" /> กรอกอีเมลที่ต้องการดึง OTP
                    </label>
                    <input
                      type="email" required autoFocus
                      placeholder="เช่น user@lico.moe หรือ user@gmail.com"
                      value={emailInput}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 rounded-2xl text-sm font-medium text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {emailInput.includes('@') && (
                    <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} className="overflow-hidden">
                      {isMailyEmail(emailInput) ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold"
                          style={{ background:'#f0fdf4', border:'1.5px solid #86efac', color:'#166534' }}>
                          <Zap className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          Maily Space — ดึงได้ทันทีไม่ต้อง password ✅
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold"
                          style={{ background:'#eff6ff', border:'1.5px solid #93c5fd', color:'#1e40af' }}>
                          <Lock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          ใช้ข้อมูล IMAP ที่แอดมินบันทึกไว้ในระบบ
                        </div>
                      )}
                    </motion.div>
                  )}

                  {error && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium p-3 rounded-xl whitespace-pre-line">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                    style={{ background:'linear-gradient(135deg,#c084fc,#818cf8)', boxShadow:'0 4px 15px rgba(192,132,252,.35)' }}>
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Inbox className="w-4 h-4" />}
                    {isLoading ? 'กำลังโหลด...' : 'ดูกล่องจดหมาย'}
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    รองรับทุก @lico.moe · Gmail · Hotmail · Yahoo · และอื่นๆ ที่แอดมินเพิ่มไว้
                  </p>
                </form>
              </div>
            )}

            {/* ══ STEP 3: Inbox ══ */}
            {step === 3 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-purple-500" /> กล่องจดหมาย
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">{emailInput}</p>
                  </div>
                  <button onClick={() => loadInbox()} disabled={isLoading}
                    className="p-2 rounded-xl text-purple-500 hover:bg-purple-50 border border-purple-100 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Quick OTP */}
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={fetchOtp} disabled={isLoading}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 mb-3"
                  style={{ background:'linear-gradient(135deg,#10a37f,#059669)', boxShadow:'0 4px 15px rgba(16,163,127,.3)' }}>
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {isLoading ? 'กำลังดึง OTP...' : `⚡ ดึง OTP ล่าสุด (${selectedApp?.name || 'ทุกแอป'})`}
                </motion.button>

                {error && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="mb-3 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium p-3 rounded-xl whitespace-pre-line">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                  </motion.div>
                )}

                {/* Auto-refresh */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] text-slate-500 font-medium">รีเฟรชอัตโนมัติ (10 วิ)</span>
                  <button onClick={() => setAuto(v => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-purple-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoRefresh ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Mail list */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                  {isLoading && inbox.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-40 animate-spin" />
                      <p className="text-sm">กำลังดึงอีเมล...</p>
                    </div>
                  ) : inbox.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">กล่องจดหมายว่างเปล่า</p>
                      <p className="text-xs mt-1">กรุณากดส่ง OTP จากแอปก่อนนะคะ</p>
                    </div>
                  ) : inbox.map((mail, idx) => {
                    const otp = extractOtp(mail.preview || '');
                    return (
                      <motion.div key={mail.id || idx}
                        initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:idx*0.04 }}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99] ${
                          idx === 0 ? 'border-purple-200 bg-purple-50/60' : 'border-slate-100 bg-white hover:border-purple-100 hover:bg-purple-50/30'}`}
                        onClick={async () => {
                          setLoading(true); setError('');
                          try {
                            const res = await fetch('/api/otp/fetch', {
                              method:'POST', headers:{ 'Content-Type':'application/json' },
                              body: JSON.stringify({ appId:selectedApp?.id||'other', email:emailInput.trim(), mailId:mail.id })
                            });
                            const data = await res.json();
                            if (res.ok && data.success) { setOtp(data); setStep(4); }
                            else setError(data.error || 'ไม่พบ OTP');
                          } catch { setError('เครือข่ายขัดข้อง'); }
                          finally { setLoading(false); }
                        }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              {idx === 0 && <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">ล่าสุด</span>}
                              {(otp || mail.hasOtp) && <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">🔑 มี OTP</span>}
                            </div>
                            <p className="text-xs font-bold text-slate-800 truncate">{mail.subject}</p>
                            <p className="text-[10px] text-slate-500 truncate">{mail.from}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />{timeAgo(mail.date)}
                            </span>
                            {otp && <span className="text-[12px] font-black text-green-600 font-mono tracking-wider">{otp}</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <button onClick={() => { setStep(selectedApp ? 2 : 1); setError(''); }}
                  className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium">
                  ← เปลี่ยนอีเมล
                </button>
              </div>
            )}

            {/* ══ STEP 4: OTP Result ══ */}
            {step === 4 && otpResult && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setStep(3)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium">
                    <ArrowLeft className="w-3.5 h-3.5" /> กลับกล่องจดหมาย
                  </button>
                  <button onClick={fetchOtp} disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-bold border border-purple-200 rounded-full px-3 py-1.5 bg-purple-50 transition-colors">
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    รีเฟรช
                  </button>
                </div>

                {(otpResult.subject || otpResult.from) && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
                    {otpResult.subject && <p><span className="font-bold text-slate-700">หัวข้อ:</span> {otpResult.subject}</p>}
                    {otpResult.from    && <p><span className="font-bold text-slate-700">จาก:</span> {otpResult.from}</p>}
                    {otpResult.date    && <p><span className="font-bold text-slate-700">เวลา:</span> {timeAgo(otpResult.date)}</p>}
                  </div>
                )}

                {otpResult.html_body ? (
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">เนื้อหาอีเมล</p>
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white" style={{ maxHeight:650, overflowY:'auto' }}>
                      <div className="p-4 text-xs [&_table]:w-full [&_img]:max-w-full [&_a]:text-purple-600"
                        dangerouslySetInnerHTML={{ __html: otpResult.html_body }} />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-4 rounded-2xl text-center bg-amber-50 border border-amber-200">
                    <p className="text-sm font-bold text-amber-700">⚠️ ไม่พบเนื้อหาอีเมล</p>
                  </div>
                )}

                {error && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="mt-3 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                  </motion.div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-slate-400 mt-4 pb-4">
          มีปัญหา? <a href="/chat" className="text-purple-500 hover:underline font-medium">ติดต่อแอดมิน</a>
        </p>
      </div>
    </div>
  );
}
