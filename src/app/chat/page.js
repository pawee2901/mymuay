'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  User, 
  ShieldAlert, 
  LifeBuoy, 
  Loader2, 
  ArrowLeft,
  Users,
  CheckCircle,
  HelpCircle,
  Paperclip,
  X,
  Image as ImageIcon,
  Film as FilmIcon
} from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('group'); // 'group' or 'support'
  
  // Group chat state
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInput, setGroupInput] = useState('');
  
  // Support chat state
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportInput, setSupportInput] = useState('');
  const [supportThreads, setSupportThreads] = useState([]); // Used by Admin
  const [selectedThreadUserId, setSelectedThreadUserId] = useState(null); // Used by Admin
  const [selectedThreadUsername, setSelectedThreadUsername] = useState(''); // Used by Admin

  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Upload state
  const [attachedFile, setAttachedFile] = useState(null); // { url, type, name }
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const groupEndRef = useRef(null);
  const supportEndRef = useRef(null);

  // 1. Authenticate user on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`);
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Auth checking failed:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Scroll to bottom helpers
  const scrollToBottomGroup = () => {
    groupEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBottomSupport = () => {
    supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 3. Load group messages (polling every 3 seconds)
  useEffect(() => {
    if (!currentUser || activeTab !== 'group') return;

    async function fetchGroupMessages() {
      try {
        const res = await fetch('/api/chat?type=GROUP');
        const data = await res.json();
        if (res.ok && data.success) {
          setGroupMessages(data.messages);
        }
      } catch (err) {
        console.error('Group messages load error:', err);
      }
    }

    fetchGroupMessages();
    const interval = setInterval(fetchGroupMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeTab]);

  // Scroll on group messages load
  useEffect(() => {
    if (groupMessages.length > 0) {
      scrollToBottomGroup();
    }
  }, [groupMessages]);

  // 4. Load support messages/threads (polling every 3 seconds)
  useEffect(() => {
    if (!currentUser || activeTab !== 'support') return;

    async function fetchSupportData() {
      try {
        if (currentUser.role === 'ADMIN') {
          if (!selectedThreadUserId) {
            // Fetch list of active user threads
            const res = await fetch('/api/chat?type=SUPPORT');
            const data = await res.json();
            if (res.ok && data.success) {
              setSupportThreads(data.threads);
            }
          } else {
            // Fetch messages for selected user thread
            const res = await fetch(`/api/chat?type=SUPPORT&userId=${selectedThreadUserId}`);
            const data = await res.json();
            if (res.ok && data.success) {
              setSupportMessages(data.messages);
              localStorage.setItem('lastReadSupportChat', Date.now().toString());
            }
          }
        } else {
          // Regular user fetches their own messages
          const res = await fetch('/api/chat?type=SUPPORT');
          const data = await res.json();
          if (res.ok && data.success) {
            setSupportMessages(data.messages);
            localStorage.setItem('lastReadSupportChat', Date.now().toString());
          }
        }
      } catch (err) {
        console.error('Support data load error:', err);
      }
    }

    fetchSupportData();
    const interval = setInterval(fetchSupportData, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeTab, selectedThreadUserId]);

  // Scroll on support messages load
  useEffect(() => {
    if (supportMessages.length > 0) {
      scrollToBottomSupport();
    }
  }, [supportMessages]);

  // File Change Handler (Validates Image or Video and uploads)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    if (!isImg && !isVid) {
      alert('รองรับเฉพาะไฟล์รูปภาพและวิดีโอเท่านั้นครับ');
      return;
    }

    setIsUploading(true);

    try {
      if (isVid) {
        // Create dynamic HTML5 video element to read metadata duration client-side
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async function() {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 300) {
            alert('วิดีโอต้องยาวไม่เกิน 5 นาทีครับ (วิดีโอที่คุณเลือกยาว ' + Math.round(video.duration) + ' วินาที)');
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            await uploadFile(file, 'VIDEO');
          }
        };
        video.src = URL.createObjectURL(file);
      } else {
        await uploadFile(file, 'IMAGE');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการตรวจสอบไฟล์');
      setIsUploading(false);
    }
  };

  const uploadFile = async (file, detectedType) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAttachedFile({
          url: data.url,
          type: detectedType,
          name: file.name
        });
      } else {
        alert(data.error || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่ออัปโหลด');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 5. Send Group Message Action
  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if ((!groupInput.trim() && !attachedFile) || isSending || isUploading) return;

    setIsSending(true);
    setErrorMsg('');

    try {
      const payload = {
        message: groupInput,
        type: 'GROUP'
      };
      if (attachedFile) {
        payload.mediaUrl = attachedFile.url;
        payload.mediaType = attachedFile.type;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGroupMessages(prev => [...prev, data.message]);
        setGroupInput('');
        setAttachedFile(null); // Reset attachment
        setTimeout(scrollToBottomGroup, 100);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการส่งข้อความ');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เครือข่ายขัดข้อง');
    } finally {
      setIsSending(false);
    }
  };

  // 6. Send Support Message Action
  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if ((!supportInput.trim() && !attachedFile) || isSending || isUploading) return;

    // Admin must select a user thread before replying
    if (currentUser.role === 'ADMIN' && !selectedThreadUserId) {
      alert('กรุณาเลือกผู้ใช้งานที่ต้องการตอบกลับก่อนครับ');
      return;
    }

    setIsSending(true);
    setErrorMsg('');

    try {
      const payload = {
        message: supportInput,
        type: 'SUPPORT'
      };

      if (currentUser.role === 'ADMIN') {
        payload.userId = selectedThreadUserId;
      }

      if (attachedFile) {
        payload.mediaUrl = attachedFile.url;
        payload.mediaType = attachedFile.type;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportMessages(prev => [...prev, data.message]);
        setSupportInput('');
        setAttachedFile(null); // Reset attachment
        setTimeout(scrollToBottomSupport, 100);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการส่งข้อความ');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เครือข่ายขัดข้อง');
    } finally {
      setIsSending(false);
    }
  };

  // 7. Loading view while checking session
  if (authChecking) {
    return (
      <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center text-slate-500 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">กำลังเตรียมข้อมูลห้องแชท...</p>
      </div>
    );
  }

  // 8. Logged-out state
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 px-6 py-8 bg-white border border-slate-200/60 rounded-3xl text-center shadow-xs font-sans">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-800">กรุณาเข้าสู่ระบบเพื่อใช้งาน</h2>
        <p className="text-xs text-slate-400 mt-1.5">คุณจำเป็นต้องใช้บัญชีสมาชิกสำหรับการพูดคุยในกลุ่มและส่งคำขอความช่วยเหลือกับทีมงานแอดมิน</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/auth/signin" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-premium shadow-2xs">
            ลงชื่อเข้าสู่ระบบ
          </Link>
          <Link href="/auth/signup" className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-premium">
            สมัครสมาชิกใหม่
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-65px)] md:h-[calc(100vh-73px)] max-w-full px-0 py-0 flex-1 flex flex-col font-sans overflow-hidden bg-slate-50 relative">
      
      {/* Client-Side Styles to Force Full Viewport and Hide Footer */}
      <style dangerouslySetInnerHTML={{ __html: `
        footer { display: none !important; }
        body, html { overflow: hidden !important; height: 100% !important; }
        main { flex: 1 !important; display: flex !important; flex-direction: column !important; height: calc(100vh - 65px) !important; overflow: hidden !important; }
        @media (min-width: 768px) {
          main { height: calc(100vh - 73px) !important; }
        }
      ` }} />

      {/* Top Header Bar inside Full-Screen Chat */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-3xs z-10">
        <Link href="/" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563eb] hover:text-[#1d4ed8] text-xs font-bold rounded-xl transition-premium border border-blue-100/40 shadow-3xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับหน้าหลัก
        </Link>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full border border-slate-200/50">
          บัญชีของคุณ: <strong className="text-slate-700 font-bold">{currentUser.username}</strong> ({currentUser.role})
        </span>
      </div>

      {/* Main Container: Flexbox full width and height */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden items-stretch">
        
        {/* Left Side: Sidebar Tab Switcher */}
        <div className="w-full lg:w-[280px] bg-slate-100/50 lg:border-r border-slate-200/60 p-4 flex flex-row lg:flex-col gap-2 shrink-0 overflow-x-auto lg:overflow-x-visible whitespace-nowrap lg:whitespace-normal">
          <button 
            onClick={() => {
              setActiveTab('group');
              setSelectedThreadUserId(null);
            }}
            className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-premium cursor-pointer border ${
              activeTab === 'group' 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                : 'bg-white border-slate-200/50 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>💬 แชทกลุ่มสมาชิก</span>
          </button>

          <button 
            onClick={() => setActiveTab('support')}
            className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-premium cursor-pointer border ${
              activeTab === 'support' 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                : 'bg-white border-slate-200/50 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LifeBuoy className="w-4.5 h-4.5" />
            <span>🛠️ แจ้งปัญหาผ่านเว็บ</span>
          </button>
        </div>

        {/* Right Side: Chat Container (fills all remaining viewport height/width) */}
        <div className="flex-1 bg-white flex flex-col justify-between overflow-hidden h-full">
          
          {/* Active Tab View */}
          {activeTab === 'group' ? (
            /* GROUP CHAT RENDER */
            <>
              {/* Group Chat Header */}
              <div className="bg-slate-50/30 border-b border-slate-100 px-6 py-3 shrink-0">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  แชทกลุ่มสมาชิกสาธารณะ
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">พูดคุย สอบถาม แลกเปลี่ยนความรู้กับเพื่อนสมาชิกและแอดมิน</p>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {groupMessages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-16">ยังไม่มีข้อความแชทในขณะนี้ พิมพ์ข้อความคนแรกเพื่อเปิดกลุ่ม!</p>
                ) : (
                  groupMessages.map((msg) => {
                    const isMe = msg.userId === currentUser.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                          {msg.isAdmin && <span className="bg-rose-500 text-white text-[8px] px-1 rounded-sm uppercase tracking-wide">Admin</span>}
                          {msg.username}
                        </span>
                        
                        {/* Message Box */}
                        <div 
                          className={`px-4 py-2.5 rounded-2xl text-sm break-all leading-relaxed shadow-3xs flex flex-col gap-2 ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : msg.isAdmin 
                                ? 'bg-rose-50 text-rose-800 border border-rose-100 rounded-tl-none' 
                                : 'bg-slate-100 text-slate-700 rounded-tl-none'
                          }`}
                        >
                          {msg.mediaUrl && msg.mediaType === 'IMAGE' && (
                            <img 
                              src={msg.mediaUrl} 
                              alt="attached image" 
                              className="max-w-full max-h-[300px] md:max-h-[400px] rounded-xl border border-black/5 shadow-sm cursor-pointer hover:opacity-95 transition-opacity" 
                              onClick={() => window.open(msg.mediaUrl)}
                            />
                          )}
                          {msg.mediaUrl && msg.mediaType === 'VIDEO' && (
                            <video 
                              src={msg.mediaUrl} 
                              controls 
                              className="max-w-full max-h-[300px] md:max-h-[400px] rounded-xl border border-black/5 shadow-sm"
                            />
                          )}
                          {msg.message && <span>{msg.message}</span>}
                        </div>
                        
                        <span className="text-[8px] text-slate-300 mt-1 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={groupEndRef} />
              </div>

              {/* Errors Panel */}
              {errorMsg && (
                <div className="bg-rose-50 border-t border-rose-100 text-rose-600 text-[10px] font-bold px-6 py-2">
                  {errorMsg}
                </div>
              )}

              {/* Attachment Preview Box */}
              {attachedFile && (
                <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 animate-fadeIn shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                      {attachedFile.type === 'IMAGE' ? (
                        <img src={attachedFile.url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-md">
                          <FilmIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[250px]">{attachedFile.name}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide font-mono">{attachedFile.type}</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAttachedFile(null)} 
                    className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input Panel */}
              <form onSubmit={handleSendGroupMessage} className="border-t border-slate-100 p-4 bg-slate-50/50 flex gap-2 items-center shrink-0">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !!attachedFile}
                  className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-slate-100 rounded-xl transition-premium cursor-pointer disabled:opacity-50 shrink-0"
                  title="แนบรูปภาพหรือวิดีโอ (วิดีโอต้องไม่เกิน 5 นาที)"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input 
                  type="text" 
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  placeholder={attachedFile ? "เพิ่มคำบรรยายประกอบไฟล์..." : "พิมพ์ข้อความคุยในกลุ่มสมาชิก..."}
                  className="flex-1 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
                <button 
                  type="submit" 
                  disabled={(!groupInput.trim() && !attachedFile) || isSending || isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-premium shadow-3xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* SUPPORT CHAT RENDER (ROLE SENSITIVE) */
            <>
              {currentUser.role === 'ADMIN' ? (
                /* ADMIN SUPPORT DASHBOARD VIEW */
                <div className="flex-1 flex items-stretch h-full overflow-hidden">
                  
                  {/* Left Column: Threads Sidebar List */}
                  <div className="w-1/3 border-r border-slate-100 bg-slate-50/30 overflow-y-auto flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ห้องแชทแจ้งปัญหาทั้งหมด</span>
                    </div>
                    {supportThreads.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-10 px-4">ไม่มีประวัติการแจ้งปัญหาของลูกค้าเข้ามาในระบบ</p>
                    ) : (
                      supportThreads.map((thread) => (
                        <button
                          key={thread.userId}
                          onClick={() => {
                            setSelectedThreadUserId(thread.userId);
                            setSelectedThreadUsername(thread.username);
                            setSupportMessages([]); // Clear old messages before load
                          }}
                          className={`w-full text-left p-3.5 border-b border-slate-50 flex flex-col gap-1 transition-premium cursor-pointer ${
                            selectedThreadUserId === thread.userId ? 'bg-indigo-50/50 border-r-4 border-r-indigo-600' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">{thread.username}</span>
                            <span className="text-[8px] text-slate-300 font-mono">
                              {new Date(thread.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate w-full font-light">{thread.lastMessage}</p>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Right Column: Chat messages detail */}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden h-full bg-white">
                    {selectedThreadUserId ? (
                      <>
                        {/* Header Details */}
                        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 flex items-center justify-between shrink-0">
                          <div>
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                              ตอบกลับการแจ้งปัญหา: {selectedThreadUsername}
                            </h3>
                            <p className="text-[9px] text-slate-400 mt-0.5">ส่งคำตอบแนะนำช่วยเหลือเพื่อแสดงบนหน้าจอของลูกค้าทันที</p>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedThreadUserId(null);
                              setSelectedThreadUsername('');
                              setSupportMessages([]);
                            }}
                            className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 font-semibold cursor-pointer"
                          >
                            ปิดหน้านี้
                          </button>
                        </div>

                        {/* Chat Feed */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {supportMessages.map((msg) => {
                            const isMeAdmin = msg.isAdmin;
                            return (
                              <div 
                                key={msg.id} 
                                className={`flex flex-col max-w-[80%] ${isMeAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                              >
                                <span className="text-[9px] font-bold text-slate-400 mb-1">
                                  {isMeAdmin ? 'Admin Support (คุณ)' : msg.username}
                                </span>
                                <div 
                                  className={`px-4 py-2.5 rounded-2xl text-sm break-all leading-relaxed shadow-3xs flex flex-col gap-2 ${
                                    isMeAdmin 
                                      ? 'bg-rose-600 text-white rounded-tr-none' 
                                      : 'bg-slate-100 text-slate-700 rounded-tl-none'
                                  }`}
                                >
                                  {msg.mediaUrl && msg.mediaType === 'IMAGE' && (
                                    <img 
                                      src={msg.mediaUrl} 
                                      alt="attached image" 
                                      className="max-w-full max-h-[300px] md:max-h-[400px] rounded-xl border border-black/5 shadow-sm cursor-pointer hover:opacity-95 transition-opacity" 
                                      onClick={() => window.open(msg.mediaUrl)}
                                    />
                                  )}
                                  {msg.mediaUrl && msg.mediaType === 'VIDEO' && (
                                    <video 
                                      src={msg.mediaUrl} 
                                      controls 
                                      className="max-w-full max-h-[300px] md:max-h-[400px] rounded-xl border border-black/5 shadow-sm"
                                    />
                                  )}
                                  {msg.message && <span>{msg.message}</span>}
                                </div>
                                <span className="text-[8px] text-slate-300 mt-1 font-mono">
                                  {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                          <div ref={supportEndRef} />
                        </div>

                        {/* Errors Panel */}
                        {errorMsg && (
                          <div className="bg-rose-50 border-t border-rose-100 text-rose-600 text-[10px] font-bold px-6 py-2 shrink-0">
                            {errorMsg}
                          </div>
                        )}

                        {/* Attachment Preview Box */}
                        {attachedFile && (
                          <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 animate-fadeIn shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                                {attachedFile.type === 'IMAGE' ? (
                                  <img src={attachedFile.url} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-md">
                                    <FilmIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                  <span className="text-xs font-bold text-slate-700 truncate max-w-[250px]">{attachedFile.name}</span>
                                  <span className="text-[9px] text-slate-400 uppercase tracking-wide font-mono">{attachedFile.type}</span>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setAttachedFile(null)} 
                              className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Input Box */}
                        <form onSubmit={handleSendSupportMessage} className="border-t border-slate-100 p-4 bg-slate-50/50 flex gap-2 items-center shrink-0">
                          <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || !!attachedFile}
                            className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-slate-100 rounded-xl transition-premium cursor-pointer disabled:opacity-50 shrink-0"
                            title="แนบรูปภาพหรือวิดีโอ (วิดีโอต้องไม่เกิน 5 นาที)"
                          >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                          </button>
                          <input 
                            type="text" 
                            value={supportInput}
                            onChange={(e) => setSupportInput(e.target.value)}
                            placeholder={attachedFile ? "เพิ่มคำบรรยายประกอบไฟล์..." : "พิมพ์ข้อความแนะนำช่วยเหลือและตอบกลับลูกค้า..."}
                            className="flex-1 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                          />
                          <button 
                            type="submit" 
                            disabled={(!supportInput.trim() && !attachedFile) || isSending || isUploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-premium shadow-3xs cursor-pointer shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </>
                    ) : (
                      /* Empty active state for Admin */
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <HelpCircle className="w-12 h-12 text-slate-300 mb-2" />
                        <h3 className="text-xs font-bold">ยังไม่ได้เลือกประวัติการแจ้งปัญหา</h3>
                        <p className="text-[10px] text-slate-400 mt-1 text-center">กรุณาคลิกเลือกชื่อลูกค้าในแถบซ้ายมือเพื่อตรวจสอบแชทและพิมพ์ตอบกลับช่วยเหลือ</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* REGULAR USER SUPPORT CHAT VIEW */
                <>
                  {/* User Support Chat Header */}
                  <div className="bg-slate-50/30 border-b border-slate-100 px-6 py-3 shrink-0">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <LifeBuoy className="w-4 h-4 text-indigo-500" />
                      แจ้งปัญหาการใช้งานกับฝ่ายบริการลูกค้า
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">คุณสามารถพิมพ์ข้อความถามคิว หรือส่งแจ้งปัญหาต่างๆ ได้จากกล่องด้านล่าง แอดมินจะตอบกลับหน้าเว็บนี้โดยตรง</p>
                  </div>

                  {/* Chat Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {supportMessages.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                        <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-xs font-bold">ยังไม่มีประวัติการส่งความช่วยเหลือ</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">พิมพ์อธิบายปัญหาของคุณด้านล่าง เช่น เติมเงินแล้วยอดไม่เข้า หรือ สต๊อกสินค้ามีปัญหา แล้วกดส่งเพื่อส่งหาแอดมินทันที</p>
                      </div>
                    ) : (
                      supportMessages.map((msg) => {
                        const isMe = !msg.isAdmin; // Message sent by user
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                          >
                            <span className="text-[9px] font-bold text-slate-400 mb-1">
                              {msg.isAdmin ? 'Admin Support (ฝ่ายบริการลูกค้า)' : 'คุณ (ผู้แจ้ง)'}
                            </span>
                            <div 
                              className={`px-4 py-2.5 rounded-2xl text-sm break-all leading-relaxed shadow-3xs flex flex-col gap-2 ${
                                isMe 
                                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-100 rounded-tl-none'
                              }`}
                            >
                              {msg.mediaUrl && msg.mediaType === 'IMAGE' && (
                                <img 
                                  src={msg.mediaUrl} 
                                  alt="attached image" 
                                  className="max-w-full max-h-[300px] md:max-h-[400px] rounded-xl border border-black/5 shadow-sm cursor-pointer hover:opacity-95 transition-opacity" 
                                  onClick={() => window.open(msg.mediaUrl)}
                                />
                              )}
                              {msg.mediaUrl && msg.mediaType === 'VIDEO' && (
                                <video 
                                  src={msg.mediaUrl} 
                                  controls 
                                  className="max-w-full max-h-[300px] md:max-h-[400px] rounded-xl border border-black/5 shadow-sm"
                                />
                              )}
                              {msg.message && <span>{msg.message}</span>}
                            </div>
                            <span className="text-[8px] text-slate-300 mt-1 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={supportEndRef} />
                  </div>

                  {/* Errors Panel */}
                  {errorMsg && (
                    <div className="bg-rose-50 border-t border-rose-100 text-rose-600 text-[10px] font-bold px-6 py-2 shrink-0">
                      {errorMsg}
                    </div>
                  )}

                  {/* Attachment Preview Box */}
                  {attachedFile && (
                    <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 animate-fadeIn shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                          {attachedFile.type === 'IMAGE' ? (
                            <img src={attachedFile.url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-md">
                              <FilmIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[250px]">{attachedFile.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wide font-mono">{attachedFile.type}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setAttachedFile(null)} 
                        className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Input Box */}
                  <form onSubmit={handleSendSupportMessage} className="border-t border-slate-100 p-4 bg-slate-50/50 flex gap-2 items-center shrink-0">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || !!attachedFile}
                      className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-slate-100 rounded-xl transition-premium cursor-pointer disabled:opacity-50 shrink-0"
                      title="แนบรูปภาพหรือวิดีโอ (วิดีโอต้องไม่เกิน 5 นาที)"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>
                    <input 
                      type="text" 
                      value={supportInput}
                      onChange={(e) => setSupportInput(e.target.value)}
                      placeholder={attachedFile ? "เพิ่มคำบรรยายประกอบไฟล์..." : "พิมพ์อธิบายปัญหาที่ต้องการความช่วยเหลือ เช่น รหัสเกมใช้งานไม่ได้..."}
                      className="flex-1 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                    <button 
                      type="submit" 
                      disabled={(!supportInput.trim() && !attachedFile) || isSending || isUploading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-premium shadow-3xs cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </>
          )}

        </div>

      </div>

    </div>
  );
}
