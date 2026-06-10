'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, KeyRound, Save, ShoppingBag, Gamepad2, Smartphone, Coins, Loader2, CalendarClock, CreditCard, ChevronRight, Eye, Copy, Search, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'games', 'mobile', 'deposits', 'password'
  
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

  useEffect(() => {
    fetchProfile();
    
    // Read tab from query parameters
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['orders', 'games', 'mobile', 'deposits', 'password'].includes(tab)) {
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
        body: JSON.stringify({ currentPassword, newPassword })
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
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="รหัสผ่านเดิม"
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
          
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeInUp">
            
            {/* Drag Handle (for visual aesthetic like bottom sheet) */}
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>

            <div className="p-5">
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
              {selectedOrder.content && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">รายละเอียดที่ได้รับ:</p>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="font-mono text-sm font-semibold text-slate-700 whitespace-pre-wrap break-all leading-relaxed">
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
                </div>
              )}

              {/* Target ID Box if TOPUP */}
              {selectedOrder.targetId && !selectedOrder.content && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">เป้าหมาย / ID ที่เติม:</p>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="font-mono text-sm font-semibold text-slate-700 text-center">
                      {selectedOrder.targetId}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    รายการนี้เป็นการเติมเงินเข้าสู่เป้าหมายโดยตรง
                  </p>
                </div>
              )}

              {/* Copy Button */}
              {selectedOrder.content && (
                <button 
                  onClick={() => handleCopyContent(selectedOrder.content)}
                  className="w-full py-3.5 bg-[#0066ff] hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer text-sm mb-2"
                >
                  คัดลอกข้อมูล
                </button>
              )}
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
