'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, KeyRound, Save, ShoppingBag, Gamepad2, Smartphone, Coins, Loader2, CalendarClock, CreditCard, ChevronRight, Eye, Copy, Search, LogOut, Terminal, Globe, Cpu, AlertCircle, CheckCircle, Upload, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'games', 'mobile', 'deposits', 'password', 'api'
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showGuideLightbox, setShowGuideLightbox] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // API request states
  const [apiRequest, setApiRequest] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiForm, setApiForm] = useState({
    purpose: '',
    services: '',
    websiteUrl: '',
    mymuayUsername: '',
    serverIps: '',
    contactInfo: '',
    idCardPath: '',
    companyCertPath: ''
  });
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [uploadingCompanyCert, setUploadingCompanyCert] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchApiStatus();
    
    // Read tab from query parameters
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['orders', 'games', 'mobile', 'deposits', 'password', 'api'].includes(tab)) {
      setActiveTab(tab);
    }

    // Polling every 20 seconds
    const interval = setInterval(() => {
      fetchProfile(true);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Update selectedOrder details in real-time when polling updates orders
  useEffect(() => {
    if (isModalOpen && selectedOrder && user?.orders) {
      const updatedOrder = user.orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [user?.orders, isModalOpen, selectedOrder?.id]);

  const fetchProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/users/profile');
      if (!res.ok) {
        if (res.status === 401 || res.status === 404) {
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error(err);
      if (!silent) {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์',
          icon: 'error',
          confirmButtonColor: '#4f46e5'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchApiStatus = async () => {
    try {
      setApiLoading(true);
      const res = await fetch('/api/users/api-request');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setApiRequest(data.data);
          setApiKey(data.api_key);
        }
      }
    } catch (err) {
      console.error('Error fetching API status:', err);
    } finally {
      setApiLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาอัปโหลดเฉพาะไฟล์รูปภาพ หรือ PDF เท่านั้นค่ะ'
      });
      return;
    }

    if (type === 'idCard') setUploadingIdCard(true);
    if (type === 'companyCert') setUploadingCompanyCert(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/users/api-request-upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      }

      setApiForm(prev => ({
        ...prev,
        [type === 'idCard' ? 'idCardPath' : 'companyCertPath']: data.url
      }));

      Swal.fire({
        icon: 'success',
        title: 'อัปโหลดสำเร็จ',
        text: 'อัปโหลดเอกสารเรียบร้อยแล้วค่ะ',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'อัปโหลดล้มเหลว',
        text: err.message
      });
    } finally {
      if (type === 'idCard') setUploadingIdCard(false);
      if (type === 'companyCert') setUploadingCompanyCert(false);
    }
  };

  const handleApiRequestSubmit = async (e) => {
    e.preventDefault();
    if (!apiForm.idCardPath) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาแนบเอกสาร',
        text: 'กรุณาอัปโหลดสำเนาบัตรประชาชนเพื่อประกอบการยืนยันตัวตนด้วยค่ะ'
      });
      return;
    }

    try {
      const res = await fetch('/api/users/api-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiForm)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: 'ส่งคำขอสำเร็จ',
          text: 'ส่งคำขอใช้งาน API เรียบร้อยแล้ว กรุณารอแอดมินอนุมัติค่ะ',
        });
        fetchApiStatus();
      } else {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณายืนยันรหัสผ่านใหม่ให้ถูกต้อง',
        icon: 'warning',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentPassword, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        Swal.fire({
          title: 'สำเร็จ',
          text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (err) {
      Swal.fire({
        title: 'ผิดพลาด',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyContent = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        title: 'คัดลอกสำเร็จ',
        text: 'คัดลอกข้อมูลเรียบร้อยแล้ว',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }).catch(() => {
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'ไม่สามารถคัดลอกได้',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    });
  };

  const handleOpenOrderModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Filter orders based on product type, category, and search query
  const getFilteredOrders = (type) => {
    if (!user || !user.orders) return [];
    
    let filtered = user.orders.filter(order => {
      const pType = order.product?.type;
      const cName = order.product?.category?.name || '';
      
      if (type === 'orders') {
        return pType === 'ACCOUNT' && !cName.includes('มือถือ') && !cName.includes('เกม');
      } else if (type === 'games') {
        return pType === 'TOPUP' || cName.includes('เกม');
      } else if (type === 'mobile') {
        return cName.includes('มือถือ') || cName.includes('โทรศัพท์');
      }
      return true;
    });

    if (searchQuery) {
      filtered = filtered.filter(order => 
        (order.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.targetId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.content || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  if (!user) return null;

  const currentFilteredOrders = getFilteredOrders(activeTab);

  const tabs = [
    { id: 'orders', label: 'รายการสั่งซื้อ', icon: ShoppingBag },
    { id: 'games', label: 'เติมเกม', icon: Gamepad2 },
    { id: 'mobile', label: 'เติมมือถือ', icon: Smartphone },
    { id: 'deposits', label: 'ประวัติเติมเงิน', icon: CreditCard },
    { id: 'password', label: 'รหัสผ่าน', icon: Lock },
    { id: 'api', label: 'เชื่อมต่อ API', icon: KeyRound },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10 animate-fadeIn min-h-screen">
      
      {/* User Info Card */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 mb-4 bg-slate-50 md:bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 w-full md:w-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500">ยินดีต้อนรับ</p>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">{user.username}</h1>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-500">ยอดเงิน</p>
              <p className="text-lg font-black text-indigo-600">{user.balance?.toLocaleString()} ฿</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push('/deposit')}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              เติมเงิน
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto pb-2 mb-4 -mx-4 px-4 snap-x hide-scrollbar">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery(''); // Reset search when switching tabs
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl snap-start whitespace-nowrap transition-colors border cursor-pointer ${activeTab === tab.id ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
          
        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h3>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <input 
                  type="text" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="ยืนยันอีเมล / ชื่อผู้ใช้งานของคุณ"
                />
              </div>
              <div>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                />
              </div>
              <div>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                />
              </div>
              <button 
                type="submit" 
                disabled={isChangingPassword}
                className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-70"
              >
                {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'บันทึกรหัสผ่านใหม่'}
              </button>
            </form>
          </div>
        )}
        {/* API Integration Tab */}
        {activeTab === 'api' && (
          <div className="flex flex-col gap-6">
            <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-800 font-sans">ระบบเชื่อมต่อ OTP API (สำหรับนักพัฒนา)</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
                บริการขอสิทธิ์ใช้งานเชื่อมต่อ API Key เพื่อดึงรหัสผ่าน OTP อัตโนมัติจากระบบอีเมลที่เชื่อมต่อไว้ เหมาะสำหรับนักพัฒนาภายนอกเพื่อนำไปพัฒนาต่อยอดระบบจัดการของท่าน
              </p>

              {apiLoading ? (
                <div className="text-center py-10 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-sm font-sans">กำลังโหลดข้อมูล...</p>
                </div>
              ) : !apiRequest ? (
                <form onSubmit={handleApiRequestSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">วัตถุประสงค์ของการนำ API ไปเชื่อมต่อ</label>
                      <input 
                        type="text" required
                        value={apiForm.purpose}
                        onChange={e => setApiForm(prev => ({ ...prev, purpose: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 font-sans"
                        placeholder="ระบุวัตถุประสงค์ เช่น เพื่อดึง OTP สำหรับ Netflix"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">บริการที่ต้องการใช้งานดึง OTP</label>
                      <input 
                        type="text" required
                        value={apiForm.services}
                        onChange={e => setApiForm(prev => ({ ...prev, services: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 font-sans"
                        placeholder="เช่น Netflix, OpenAI, Disney+"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">URL เว็บไซต์ที่จะนำ API ไปเชื่อมต่อ</label>
                      <input 
                        type="url" required
                        value={apiForm.websiteUrl}
                        onChange={e => setApiForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 font-sans"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">ชื่อผู้ใช้ mymuay</label>
                      <input 
                        type="text" required
                        value={apiForm.mymuayUsername}
                        onChange={e => setApiForm(prev => ({ ...prev, mymuayUsername: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 font-sans"
                        placeholder="ระบุชื่อบัญชี mymuay ของท่าน"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">IP Server ของคุณสำหรับการยิง API (ป้อนเครื่องหมายจุลภาค , คั่นระหว่างหลาย IP)</label>
                    <input 
                      type="text" required
                      value={apiForm.serverIps}
                      onChange={e => setApiForm(prev => ({ ...prev, serverIps: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 font-mono"
                      placeholder="เช่น 203.0.113.1, 198.51.100.2 (หรือใส่ * เพื่ออนุญาตทุก IP)"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">รายละเอียดผู้ติดต่อและที่อยู่เบอร์โทรฉุกเฉิน</label>
                    <textarea 
                      required rows={2}
                      value={apiForm.contactInfo}
                      onChange={e => setApiForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 font-sans"
                      placeholder="ระบุชื่อจริง ที่อยู่จัดส่งบิล และเบอร์โทรติดต่อกลับ"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">แนบภาพสำเนาบัตรประชาชน (สูงสุด 5MB)</label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-indigo-350 hover:bg-indigo-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-all font-sans">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingIdCard ? 'กำลังอัปโหลด...' : 'เลือกไฟล์...'}
                          <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'idCard')} className="hidden" disabled={uploadingIdCard} />
                        </label>
                        {apiForm.idCardPath && (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1 font-sans">
                            <CheckCircle className="w-3.5 h-3.5" /> แนบเอกสารแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-750 mb-1.5 block font-sans">แนบหนังสือรับรองบริษัท (ถ้ามี) (สูงสุด 5MB)</label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-indigo-355 hover:bg-indigo-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-all font-sans">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingCompanyCert ? 'กำลังอัปโหลด...' : 'เลือกไฟล์...'}
                          <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'companyCert')} className="hidden" disabled={uploadingCompanyCert} />
                        </label>
                        {apiForm.companyCertPath && (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1 font-sans">
                            <CheckCircle className="w-3.5 h-3.5" /> แนบเอกสารแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer font-sans"
                  >
                    ⚡ ยื่นส่งคำขออนุมัติ API Key
                  </button>
                </form>
              ) : apiRequest.status === 'pending' ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col gap-2 font-sans">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>รอแอดมินอนุมัติสิทธิ์การใช้งาน</span>
                  </div>
                  <p>ระบบได้รับคำขอของคุณเรียบร้อยแล้วและอยู่ระหว่างการพิจารณาตรวจสอบ เมื่อแอดมินทำการอนุมัติเรียบร้อย คีย์ API ของคุณจะปรากฏที่นี่ค่ะ</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">ยื่นส่งเมื่อ: {formatDate(apiRequest.createdAt)}</p>
                </div>
              ) : apiRequest.status === 'rejected' ? (
                <div className="space-y-4 font-sans">
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>ปฏิเสธคำขอสิทธิ์ใช้งาน API</span>
                    </div>
                    <p className="font-bold">เหตุผลที่ไม่ผ่านการอนุมัติ:</p>
                    <p className="bg-white/60 p-2 rounded-lg border border-rose-100 font-medium">{apiRequest.rejectedReason || 'ข้อมูลไม่ชัดเจน หรือเอกสารประกอบไม่เพียงพอ'}</p>
                  </div>
                  <button 
                    onClick={() => setApiRequest(null)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    ส่งคำขอใหม่อีกครั้ง
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn font-sans">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>อนุมัติการใช้งานเรียบร้อยแล้ว</span>
                    </div>
                    <p>บัญชีของคุณได้รับการยืนยันตัวตนและได้รับอนุญาตให้ใช้บริการ OTP API เรียบร้อยค่ะ</p>
                  </div>

                  {apiKey && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">คีย์ความปลอดภัยของท่าน (X-API-Key Header)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" readOnly
                            value={apiKey.apiKey}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-600 select-all"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(apiKey.apiKey);
                              Swal.fire({ icon: 'success', title: 'คัดลอกแล้ว', text: 'คัดลอก API Key ลงคลิปบอร์ดแล้วค่ะ', timer: 1000, showConfirmButton: false });
                            }}
                            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            คัดลอก
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 block">IP Server ที่อนุญาตให้ยิงขอ API</span>
                          <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-100 px-2 py-0.5 rounded inline-block mt-1">{apiRequest.serverIps}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 block">เปิดใช้งานเมื่อ</span>
                          <span className="text-xs font-semibold text-slate-700 inline-block mt-1">{formatDate(apiKey.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-700 animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 font-sans">เอกสารคู่มือการเชื่อมต่อ API (Quick API Documentation)</span>
                    </div>
                    <div className="p-4 space-y-4 bg-white text-xs leading-relaxed text-slate-600 font-sans">
                      <div>
                        <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-sans">
                          <Globe className="w-3.5 h-3.5 text-indigo-500" />
                          ดึงข้อมูลรหัสผ่าน OTP ล่าสุด
                        </h4>
                        <div className="flex items-center gap-1.5 font-mono bg-slate-900 text-indigo-200 p-2.5 rounded-lg overflow-x-auto text-[10px] mt-1">
                          <span className="bg-green-600 text-white font-bold px-1.5 py-0.2 rounded text-[9px]">GET</span>
                          <span>http://localhost:3000/api/v1/get-otp?email=<b>TARGET_EMAIL</b>&limit=5</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-sans">
                          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                          Headers ที่ต้องแนบมากับ Request
                        </h4>
                        <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg overflow-x-auto text-[10px] font-mono mt-1">
{`{
  "Content-Type": "application/json",
  "X-API-Key": "${apiKey?.apiKey || 'YOUR_API_KEY'}"
}`}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-sans">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          ตัวอย่างผลลัพธ์ตอบกลับ (Response JSON)
                        </h4>
                        <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg overflow-x-auto text-[10px] font-mono mt-1">
{`{
  "status": "success",
  "email": "customer@gmail.com",
  "otp": "489201",
  "subject": "รหัสยืนยัน Netflix ของคุณคือ 489201",
  "sender": "info@netflix.com",
  "received_at": "2026-07-24T07:22:50.000Z",
  "list": [
    {
      "email": "customer@gmail.com",
      "otp": "489201",
      "subject": "รหัสยืนยัน Netflix ของคุณคือ 489201",
      "sender": "info@netflix.com",
      "received_at": "2026-07-24T07:22:50.000Z",
      "body_preview": "รหัสยืนยันการตั้งค่าบัญชี..."
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deposit History Tab */}
        {activeTab === 'deposits' && (
          <div className="flex flex-col gap-3">
            {user.deposits?.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p>ยังไม่มีประวัติการเติมเงิน</p>
              </div>
            ) : (
              user.deposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">เติมเงิน</p>
                      <p className="text-xs text-slate-500">{formatDate(deposit.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 text-base">+{deposit.amount.toLocaleString()} ฿</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Orders Tabs (Apps, Games, Mobile) */}
        {['orders', 'games', 'mobile'].includes(activeTab) && (
          <div className="flex flex-col">
            
            {/* Action Bar: Copy All & Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาแบบรวดเร็ว"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button 
                onClick={() => {
                  const allContent = currentFilteredOrders.map(o => o.content).filter(Boolean).join('\n');
                  if (allContent) handleCopyContent(allContent);
                  else Swal.fire({
                    title: 'ไม่มีข้อมูล',
                    text: 'ไม่มีข้อมูลให้คัดลอก',
                    icon: 'info',
                    confirmButtonColor: '#4f46e5',
                    confirmButtonText: 'ตกลง'
                  });
                }}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors w-auto cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                ระบบคัดลอกข้อมูล
              </button>
            </div>

            {/* Pagination Info (Mock) */}
            <div className="flex items-center justify-between mb-2 text-slate-500 text-xs">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <span>ข้อมูลในหน้า 1 ของ 1</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {currentFilteredOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400 border border-slate-200 rounded-2xl bg-white">
                <p>ยังไม่มีข้อมูล</p>
              </div>
            ) : (
              <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
                {currentFilteredOrders.map((order) => (
                  <div key={order.id} className="p-4 relative">
                    {/* Top Row: User Badge & Order ID & Status */}
                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{user.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        {(() => {
                          const status = order.status?.toUpperCase() || 'PENDING';
                          let bg = 'bg-yellow-50 text-yellow-700 border border-yellow-100';
                          let text = 'กำลังดำเนินการ';
                          if (status === 'COMPLETED') {
                            bg = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                            text = 'สำเร็จ';
                          } else if (status === 'FAILED') {
                            bg = 'bg-rose-50 text-rose-700 border border-rose-100';
                            text = 'ล้มเหลว';
                          }
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${bg}`}>
                              {text}
                            </span>
                          );
                        })()}
                        <span className="text-[10px] md:text-xs font-mono text-slate-400 truncate max-w-[100px] md:max-w-[150px]">
                          {order.id}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Product Image & Details */}
                    <div className="flex items-start gap-3 mb-3">
                      {order.product?.image ? (
                        <img src={order.product.image} alt={order.product.name} className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className="font-bold text-slate-800 text-sm md:text-base leading-tight mb-1 truncate">{order.product?.name || 'สินค้าที่ถูกลบ'}</h4>
                        <p className="text-xs text-slate-500">{order.product?.category?.name || 'ไม่มีหมวดหมู่'}</p>
                      </div>
                    </div>

                    {/* Bottom Row: Date & Action Button */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] md:text-xs text-slate-500 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(order.createdAt)}
                      </span>
                      
                      <button 
                        onClick={() => handleOpenOrderModal(order)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs md:text-sm font-bold transition-colors cursor-pointer border border-blue-200/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        ดูข้อมูล
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Bottom Pagination Info */}
            <div className="flex items-center justify-between mt-4 text-slate-500 text-xs">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <span>ข้อมูลในหน้า 1 ของ 1</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh] animate-fadeInUp">
            
            {/* Drag Handle (for visual aesthetic like bottom sheet) */}
            <div className="w-full flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>

            <div className="p-5 overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-800 mb-4">ข้อมูลการสั่งซื้อ</h3>

              {/* Product Info Card inside Modal */}
              <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl mb-4">
                {selectedOrder.product?.image ? (
                  <img src={selectedOrder.product.image} alt={selectedOrder.product.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">{selectedOrder.product?.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">ซื้อเมื่อ {formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Status Row inside Modal */}
              <div className="mb-4 flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">สถานะรายการ:</span>
                {(() => {
                  const status = selectedOrder.status?.toUpperCase() || 'PENDING';
                  let bg = 'bg-yellow-50 text-yellow-700 border border-yellow-100';
                  let text = 'กำลังดำเนินการ (Pending)';
                  if (status === 'COMPLETED') {
                    bg = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                    text = 'สำเร็จ (Completed)';
                  } else if (status === 'FAILED') {
                    bg = 'bg-rose-50 text-rose-700 border border-rose-100';
                    text = 'ล้มเหลว (Failed)';
                  }
                  return (
                    <span className={`font-bold px-2.5 py-1 rounded-full ${bg}`}>
                      {text}
                    </span>
                  );
                })()}
              </div>

              {/* Content Box */}
              {/* Content Box */}
              {selectedOrder.content && (() => {
                const isJson = selectedOrder.content && selectedOrder.content.trim().startsWith('{');
                let creds = null;
                if (isJson) {
                  try {
                    creds = JSON.parse(selectedOrder.content);
                  } catch (e) {}
                }

                if (creds) {
                  return (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 font-medium mb-1.5">รายละเอียดที่ได้รับ:</p>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        {/* Email row */}
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">👤 อีเมล</label>
                            <input
                              type="text"
                              readOnly
                              value={creds.email || ''}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(creds.email);
                              Swal.fire({ title: 'คัดลอกสำเร็จ', text: 'คัดลอกอีเมลเรียบร้อย', icon: 'success', timer: 1200, showConfirmButton: false });
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0 h-[30px]"
                          >
                            <Copy className="w-3 h-3" /> คัดลอก
                          </button>
                        </div>

                        {/* Password row */}
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">🔑 รหัสผ่าน</label>
                            <input
                              type="text"
                              readOnly
                              value={creds.password || ''}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(creds.password);
                              Swal.fire({ title: 'คัดลอกสำเร็จ', text: 'คัดลอกรหัสผ่านเรียบร้อย', icon: 'success', timer: 1200, showConfirmButton: false });
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0 h-[30px]"
                          >
                            <Copy className="w-3 h-3" /> คัดลอก
                          </button>
                        </div>

                        {/* Profile & Warranty fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">🖥️ โปรไฟล์</label>
                            <input
                              type="text"
                              readOnly
                              value={creds.profile || ''}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">📅 วันรับประกัน</label>
                            <input
                              type="text"
                              readOnly
                              value={creds.warrantyDate || ''}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              const copyText = `อีเมล: ${creds.email}\nรหัสผ่าน: ${creds.password}\nโปรไฟล์: ${creds.profile}\nวันรับประกัน: ${creds.warrantyDate}`;
                              navigator.clipboard.writeText(copyText);
                              Swal.fire({ title: 'คัดลอกสำเร็จ', text: 'คัดลอกข้อมูลทั้งหมดเรียบร้อย', icon: 'success', timer: 1200, showConfirmButton: false });
                            }}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                          >
                            <Copy className="w-3.5 h-3.5" /> คัดลอกทั้งหมด
                          </button>
                          
                          {selectedOrder.stockItem?.guideImage ? (
                            <button
                              onClick={() => setShowGuideLightbox(true)}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              🔒 วิธีการเข้าสู่ระบบ
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center mt-2">
                        ข้อมูลนี้เป็นข้อมูลจากทางร้านค้า โปรดตรวจสอบข้อมูลก่อนยืนยัน
                      </p>
                    </div>
                  );
                }

                // Fallback to standard plain text view
                return (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 font-medium mb-1">รายละเอียดที่ได้รับ:</p>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="font-mono text-sm font-semibold text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                        {selectedOrder.content}
                      </p>
                    </div>

                    {/* Guide Image display */}
                    {selectedOrder.stockItem?.guideImage && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 font-medium mb-1.5">วิธีการเข้าใช้งาน / ภาพแนะนำ:</p>
                        <div 
                          onClick={() => setShowGuideLightbox(true)}
                          className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-1 cursor-pointer hover:opacity-95 transition-all"
                          title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                        >
                          <img 
                            src={selectedOrder.stockItem.guideImage} 
                            alt="วิธีการเข้าใช้งาน" 
                            className="w-full object-contain max-h-[300px] rounded-lg" 
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 text-center mt-1">💡 คลิกที่รูปภาพด้านบนเพื่อขยายใหญ่</p>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      ข้อมูลนี้เป็นข้อมูลจากทางร้านค้า โปรดตรวจสอบข้อมูลก่อนยืนยัน
                    </p>

                    <button 
                      onClick={() => handleCopyContent(selectedOrder.content)}
                      className="w-full py-3.5 bg-[#0066ff] hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer text-sm mt-3"
                    >
                      คัดลอกข้อมูล
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showGuideLightbox && selectedOrder?.stockItem?.guideImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowGuideLightbox(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 border border-slate-700/10 overflow-hidden shadow-2xl flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowGuideLightbox(false)}
              className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm font-bold border-none"
              title="ปิด"
            >
              ✕
            </button>
            <div className="overflow-y-auto max-h-[85vh] p-1 flex justify-center items-center">
              <img 
                src={selectedOrder.stockItem.guideImage} 
                alt="วิธีการเข้าใช้งาน" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg" 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
