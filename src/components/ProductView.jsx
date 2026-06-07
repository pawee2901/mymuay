'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Gamepad2, 
  Layers, 
  CheckCircle, 
  Zap, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  QrCode,
  Coins,
  User,
  Inbox
} from 'lucide-react';

export default function ProductView({ product }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [targetId, setTargetId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, checking, completed, failed
  const [errorMsg, setErrorMsg] = useState('');
  const [deliveredContent, setDeliveredContent] = useState('');
  const [copied, setCopied] = useState(false);

  // Product Option Selection State (default to first option if exists)
  const [selectedOptionId, setSelectedOptionId] = useState(
    product.options && product.options.length > 0 ? product.options[0].id : null
  );

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`);
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  const selectedOption = product.options?.find(o => o.id === selectedOptionId) || null;
  const isAgent = currentUser?.role === 'AGENT';
  const optionPrice = selectedOption 
    ? (isAgent && selectedOption.agentPrice > 0 ? selectedOption.agentPrice : selectedOption.price)
    : selectedOption?.price || 0;
  const mainPrice = isAgent && product.agentPrice > 0 ? product.agentPrice : product.price;
  const currentPrice = selectedOption ? optionPrice : mainPrice;
  const availableStock = selectedOption ? selectedOption.stockCount : product.stockCount;
  const isOutOfStock = product.type === 'ACCOUNT' && availableStock === 0;

  // Reset quantity to 1 whenever selected option changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedOptionId]);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนทำการซื้อสินค้าครับ');
      router.push('/auth/signin');
      return;
    }
    if (product.type === 'TOPUP' && !targetId.trim()) {
      alert('กรุณากรอก Player ID / UID ของผู้เล่นก่อนทำการชำระเงิน');
      return;
    }
    setShowPaymentModal(true);
    setPaymentStatus('pending');
    setDeliveredContent('');
    setErrorMsg('');
  };

  const simulatePaymentSuccess = async () => {
    setIsLoading(true);
    setPaymentStatus('checking');
    setErrorMsg('');

    try {
      // Create order via Next.js API route
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productOptionId: selectedOptionId,
          targetId: product.type === 'TOPUP' ? targetId : null,
          quantity: quantity,
        }),
      });

      const data = await res.json();
      
      // Artificial delay to make scanner feel premium
      setTimeout(() => {
        setIsLoading(false);
        if (res.ok) {
          setPaymentStatus('completed');
          setDeliveredContent(data.order.content);
        } else {
          setPaymentStatus('failed');
          setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการตรวจสอบยอดเงิน');
        }
      }, 2500);

    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setPaymentStatus('failed');
      setErrorMsg('เครือข่ายขัดข้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(deliveredContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPrice = currentPrice * quantity;
  const isWarningCard = product.name.includes('อ่านรายละเอียด');

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 font-sans">
      
      {/* Breadcrumbs / Back button */}
      <Link 
        href="/categories" 
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-[#2563eb] mb-6 transition-premium font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        กลับไปหมวดหมู่ทั้งหมด
      </Link>

      <div className="bg-white border border-[#c7daf7]/80 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 hover:shadow-premium transition-premium">
        
        {/* Left Side: Product Image Display */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-2xs">
            <img 
              src={product.image} 
              alt={product.name} 
              className="object-cover w-full h-full"
            />
            {isOutOfStock && !isWarningCard && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center animate-fadeIn">
                <span className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full border border-red-500 uppercase tracking-widest shadow-md">
                  สินค้าหมดสต๊อก
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-sans px-2">
            <span className="flex items-center gap-1 font-semibold text-slate-500">
              <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
              หมวดหมู่: {product.categoryName}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-500">ขายไปแล้ว {product.soldCount} ชิ้น</span>
          </div>
        </div>

        {/* Right Side: Product Details & Configurator */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="bg-blue-50 text-[#2563eb] text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase">
              {isWarningCard ? 'รายละเอียดเงื่อนไขสำคัญ' : product.type === 'TOPUP' ? 'เติมเงินเกมระบบออโต้' : 'ไอดี/รหัสสินค้าจัดส่งทันที'}
            </span>
            <h1 className="text-lg md:text-xl font-black text-slate-800 mt-4 leading-tight">
              {product.name}
            </h1>
            
            {/* Price display (based on selected option) */}
            {!isWarningCard && (
              <div className="flex flex-wrap items-end gap-2 mt-2">
                {isAgent && (selectedOption ? selectedOption.agentPrice > 0 : product.agentPrice > 0) ? (
                  <>
                    <span className="text-slate-400 line-through text-base font-semibold mb-0.5">
                      {selectedOption ? selectedOption.price.toLocaleString() : product.price.toLocaleString()} บาท
                    </span>
                    <span className="text-[#2563eb] text-2xl font-black">
                      {currentPrice.toLocaleString()} <span className="text-xs font-bold text-slate-400">บาท (ส่งตัวแทน)</span>
                    </span>
                  </>
                ) : (
                  <p className="text-[#2563eb] text-2xl font-black">
                    {currentPrice.toLocaleString()} <span className="text-xs font-bold text-slate-400">บาท</span>
                  </p>
                )}
              </div>
            )}

            {/* Description Box */}
            <div className="border-t border-[#c7daf7]/40 my-4 pt-4">
              <h3 className="text-xs font-bold text-slate-700">รายละเอียดสินค้า</h3>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed font-sans whitespace-pre-wrap">
                {product.description}
              </div>
            </div>

            {/* ========== OPTION SELECTOR (ตัวเลือกสินค้า) ========== */}
            {product.options && product.options.length > 0 && (
              <div className="border-t border-[#c7daf7]/40 my-4 pt-4">
                <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1">
                  <span>ตัวเลือกสินค้า</span>
                </h3>
                <div className="space-y-2">
                  {product.options.map((opt) => {
                    const optOutOfStock = opt.stockCount === 0;
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-premium ${
                          isSelected
                            ? 'border-[#2563eb] bg-blue-50/20 shadow-premium'
                            : 'border-slate-200 bg-white hover:border-[#c7daf7]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${isSelected ? 'text-[#2563eb]' : 'text-slate-700'} ${optOutOfStock ? 'line-through opacity-60' : ''}`}>
                            {opt.name}
                          </p>
                          <p className={`text-xs font-black mt-1 ${isSelected ? 'text-[#2563eb]' : 'text-slate-800'} ${optOutOfStock ? 'line-through opacity-60' : ''}`}>
                            {isAgent && opt.agentPrice > 0 ? (
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="text-slate-400 line-through text-[10px] font-semibold">{opt.price.toLocaleString()} ฿</span>
                                <span className="text-purple-600">{opt.agentPrice.toLocaleString()} ฿ (ส่ง)</span>
                              </span>
                            ) : (
                              <span>{opt.price.toLocaleString()} บาท</span>
                            )}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold shrink-0 px-2.5 py-1 rounded-full ${
                          optOutOfStock 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {optOutOfStock ? 'สินค้าหมด' : `เหลือ ${opt.stockCount} ชิ้น`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Action */}
          <form onSubmit={handleCheckout} className="border-t border-[#c7daf7]/40 pt-4 mt-4">
            
            {/* Conditional input fields */}
            {product.type === 'TOPUP' ? (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ระบุ Player ID / OpenID ของผู้เล่น <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="เช่น OpenID: 28938947239" 
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-slate-800"
                />
              </div>
            ) : !isWarningCard ? (
              <div className="mb-4 flex items-center justify-between gap-4">
                <label className="text-xs font-bold text-slate-700">
                  จำนวนสินค้า
                </label>
                <div className="flex items-center gap-1 border border-slate-200 rounded-xl overflow-hidden bg-white shrink-0">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= 1}
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-premium cursor-pointer border-r border-slate-200"
                  >
                    －
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={quantity}
                    className="w-12 text-center text-xs font-black text-slate-800 bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= availableStock}
                    onClick={() => setQuantity(prev => Math.min(availableStock, prev + 1))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-premium cursor-pointer border-l border-slate-200"
                  >
                    ＋
                  </button>
                </div>
              </div>
            ) : null}

            {/* Buy button depends on login state */}
            {!currentUser ? (
              <Link href="/auth/signin" className="block w-full">
                <button 
                  type="button"
                  className="w-full py-3 bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-premium cursor-pointer shadow-3xs"
                >
                  <User className="w-4.5 h-4.5" />
                  เข้าสู่ระบบเพื่อซื้อสินค้า
                </button>
              </Link>
            ) : (
              <button 
                type="submit"
                disabled={isOutOfStock || isWarningCard}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-premium cursor-pointer ${
                  isOutOfStock 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50' 
                    : isWarningCard
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm hover:shadow-premium active:scale-[0.98]'
                }`}
              >
                {isWarningCard ? 'รายละเอียดเงื่อนไข' : isOutOfStock ? 'สินค้าหมดชั่วคราว' : `ซื้อตอนนี้ • ${totalPrice.toLocaleString()} บาท`}
              </button>
            )}

            {!isWarningCard && (
              <p className="text-center text-[10px] text-slate-500 mt-2.5 font-medium">
                {product.type === 'ACCOUNT' ? `เหลือสินค้าในระบบอีก ${availableStock} ชิ้น` : 'เติมออโต้เข้าไอดีของคุณโดยตรง'}
              </p>
            )}

            {/* Guaranteed Badges */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400">
              <span className="flex items-center justify-center gap-1 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                จัดส่งด่วนออโต้
              </span>
              <span className="flex items-center justify-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                รับประกัน 24 ชม.
              </span>
              <span className="flex items-center justify-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ฐานข้อมูลปลอดภัย
              </span>
            </div>

          </form>
        </div>

      </div>

      {/* ------------------- PROMPTPAY QR PAYMENT MODAL ------------------- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
            
            {/* Close Button (Disabled during checking) */}
            <button 
              disabled={paymentStatus === 'checking'}
              onClick={() => setShowPaymentModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-premium cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Wallet Deduct Title */}
            <div className="flex flex-col items-center mb-4">
              <div className="px-3 py-1.5 bg-[#2563eb] text-white text-xs font-black tracking-widest rounded-lg flex items-center gap-1.5">
                <Coins className="w-4.5 h-4.5" />
                <span>ชำระผ่านกระเป๋าเงิน</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">หักเงินเครดิตในบัญชีอัตโนมัติ</p>
            </div>

            {/* Pending Wallet payment screen */}
            {paymentStatus === 'pending' && currentUser && (
              <div className="flex flex-col items-center w-full space-y-4">
                {/* Balance check */}
                <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl py-3 px-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ยอดเงินคงเหลือของคุณ</p>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{currentUser.balance.toLocaleString()} บาท</h4>
                </div>

                {/* Summary Table */}
                <div className="w-full border border-slate-100 rounded-2xl p-4 space-y-2 text-left text-xs text-slate-600">
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0">สินค้า:</span>
                    <strong className="text-slate-800 truncate text-right">
                      {product.name} {selectedOption && `(${selectedOption.name})`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>จำนวน:</span>
                    <strong className="text-slate-800">{quantity} ชิ้น</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-sm">
                    <span>ยอดชำระทั้งสิ้น:</span>
                    <span className="text-[#2563eb] font-black">{totalPrice.toLocaleString()} บาท</span>
                  </div>
                </div>

                {currentUser.balance < totalPrice ? (
                  /* Insufficient credit block */
                  <div className="w-full space-y-3">
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-700 text-left leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>ยอดเงินคงเหลือในบัญชีของคุณไม่เพียงพอ กรุณาเติมเงินเข้าระบบก่อนทำรายการซื้อสินค้าครับ</span>
                    </div>
                    
                    <Link 
                      href="/deposit"
                      className="block w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-premium text-center"
                    >
                      ไปหน้าเติมเงิน
                    </Link>
                  </div>
                ) : (
                  /* Buy trigger button */
                  <button 
                    onClick={simulatePaymentSuccess}
                    className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-xs transition-premium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    ยืนยันการซื้อสินค้า (หักเงินกระเป๋า)
                  </button>
                )}
              </div>
            )}

            {/* Checking Payment screen */}
            {paymentStatus === 'checking' && (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-[#2563eb] rounded-full animate-spin"></div>
                <h3 className="text-sm font-bold text-slate-800 mt-6">กำลังตรวจสอบรายการ...</h3>
                <p className="text-[10px] text-slate-400 mt-1">ระบบกำลังตรวจสอบ Slip การชำระเงินอัตโนมัติ</p>
              </div>
            )}

            {/* Completed & Code Delivery Screen */}
            {paymentStatus === 'completed' && (
              <div className="flex flex-col items-center w-full text-center py-2 animate-scaleUp">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">ชำระเงินสำเร็จ!</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">ระบบดึงข้อมูลจากสต๊อกและส่งมอบสินค้าเรียบร้อย</p>

                {/* Delivered Stock Display Box */}
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-5 flex items-center justify-between text-left gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">รหัสของคุณ:</p>
                    <p className="text-xs font-mono font-bold text-slate-800 break-all select-all mt-1">
                      {deliveredContent}
                    </p>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-premium cursor-pointer shrink-0"
                    title="คัดลอกรหัส"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    // Force refresh to update stock counts
                    window.location.reload();
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-premium cursor-pointer"
                >
                  ปิดหน้าต่างนี้
                </button>

                {/* OTP Button — แสดงเมื่อ content มี email */}
                {(() => {
                  const emailMatch = deliveredContent.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
                  const email = emailMatch?.[1];
                  if (!email) return null;
                  const appId = product.name.toLowerCase().includes('netflix') ? 'netflix'
                    : product.name.toLowerCase().includes('disney') ? 'disney'
                    : product.name.toLowerCase().includes('chatgpt') || product.name.toLowerCase().includes('openai') ? 'chatgpt'
                    : product.name.toLowerCase().includes('prime') ? 'prime'
                    : product.name.toLowerCase().includes('spotify') ? 'spotify'
                    : product.name.toLowerCase().includes('trueid') ? 'trueid'
                    : 'other';
                  return (
                    <a
                      href={`/otp?email=${encodeURIComponent(email)}&app=${appId}`}
                      className="mt-2 w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-sm"
                      style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)', boxShadow:'0 4px 15px rgba(192,132,252,.35)' }}
                    >
                      <Inbox className="w-4 h-4" />
                      🔑 รับรหัส OTP สำหรับ {email}
                    </a>
                  );
                })()}
              </div>
            )}

            {/* Failed screen */}
            {paymentStatus === 'failed' && (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">เกิดข้อผิดพลาด</h3>
                <p className="text-xs text-rose-600 mt-1 font-sans">{errorMsg}</p>
                
                <button 
                  onClick={() => setPaymentStatus('pending')}
                  className="mt-6 w-full py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl transition-premium cursor-pointer"
                >
                  ลองชำระเงินอีกครั้ง
                </button>
              </div>
            )}

          </div>

        </div>
      )}
      
    </div>
  );
}
