'use client';

import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageSquare, 
  Terminal, 
  Key, 
  Globe, 
  Cpu, 
  Layers, 
  CheckCircle,
  HelpCircle,
  Smartphone
} from 'lucide-react';

export default function AgentPage() {
  const sampleJsonRequest = {
    apiKey: "YOUR_API_KEY_HERE",
    productId: "prod-clxxxxxxx",
    quantity: 1,
    targetId: "123456789 (Game UID)"
  };

  const sampleJsonResponse = {
    success: true,
    orderId: "ord-clyyyyyyy",
    productName: "RoV เติมเงินออโต้ 50 คูปอง",
    totalPrice: 45.0,
    status: "COMPLETED",
    content: "PIN-777-888-999 (หรือข้อความจัดส่งสำเร็จสำหรับ API)"
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 flex-1 font-sans">
      
      {/* Header Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition-premium font-semibold">
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
      </div>

      {/* Main Section */}
      <div className="space-y-8 animate-fadeIn">
        
        {/* Banner Title */}
        <div className="bg-white border border-slate-200/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-2 text-center md:text-left">
            <span className="bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
              AGENT PARTNERSHIP & API
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">
              สมัครตัวแทนจำหน่าย & ระบบเชื่อมต่อ API
            </h1>
            <p className="text-xs text-slate-400 max-w-md">
              มาร่วมเป็นพันธมิตรทางธุรกิจกับร้านค้าของเรา ได้ราคาส่งสุดพิเศษพร้อมระบบ API เชื่อมต่อดึงสินค้าอัตโนมัติ 24 ชั่วโมง
            </p>
          </div>
          
          {/* Big Add LINE CTA Button */}
          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 text-center space-y-2.5 w-full md:w-auto md:min-w-[220px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สมัครตัวแทนทันที</p>
            
            {/* LINE QR Code Placeholder (Beautiful SVG Representation) */}
            <div className="w-24 h-24 bg-white border border-slate-100 rounded-xl mx-auto flex items-center justify-center relative overflow-hidden shadow-3xs p-1">
              <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500">
                <rect x="10" y="10" width="80" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="6,4" />
                <path d="M 25 35 L 75 35 M 35 50 L 65 50 M 25 65 L 75 65 M 50 25 L 50 75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="50" cy="50" r="10" fill="white" stroke="currentColor" strokeWidth="3" />
              </svg>
            </div>
            
            <a 
              href="https://line.me" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-premium shadow-2xs hover:shadow-sm text-center"
            >
              แอด LINE สมัครตัวแทน
            </a>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">เรทราคาส่งราคาพิเศษ</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              รับสิทธิ์ในการสั่งซื้อสินค้าคีย์ ดิจิทัล บัตรเติมเงินเกม และไอดีพรีเมียมในราคาต้นทุนที่ต่ำกว่าตลาด เพื่อนำไปทำกำไรต่อได้สูง
            </p>
          </div>

          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">ระบบ API ดึงของออโต้</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              สำหรับเว็บร้านค้า ร้านค้าบอทดีสคอร์ด หรือเพจบริการ เติมคูปองและส่งรหัสด้วย API เสถียรและแม่นยำสูง
            </p>
          </div>

          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">ซัพพอร์ตแอดมินดูแล 24 ชม.</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              สิทธิพิเศษสำหรับตัวแทน มีช่องทางซัพพอร์ตพิเศษผ่านทางแชทไลน์เพื่อแก้ไขเคสปัญหาให้กับลูกค้าของคุณได้อย่างเร่งด่วน
            </p>
          </div>
        </div>

        {/* API Docs Manual Panel */}
        <div className="bg-white border border-slate-200/50 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">เอกสารการเชื่อมต่อ API (Developer Guide)</h2>
              <p className="text-[10px] text-slate-400">วิธีเรียกใช้งาน Webhook/Endpoint สั่งซื้อสินค้าแบบอัตโนมัติ</p>
            </div>
          </div>

          {/* Authentication Instructions */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Key className="w-4 h-4 text-indigo-500" />
              การยืนยันตัวตน (Authentication)
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              หลังจากแอดมินสร้างสิทธิ์บัญชีตัวแทนและอนุมัติ API Key เรียบร้อยแล้ว คุณต้องแนบ API Key เข้ามาใน Headers หรือ Request Body ในรูปแบบ JSON เสมอเพื่อตรวจสอบสิทธิ์
            </p>
          </div>

          {/* Endpoint Details */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white font-bold text-[9px] px-2 py-0.5 rounded">POST</span>
                <code className="text-xs font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-600">
                  /api/orders/create-api
                </code>
              </div>
              <p className="text-[10px] text-slate-400">ใช้สำหรับส่งออเดอร์ให้ระบบตัดสินค้าจากสต๊อกและทำรายการเติมเงินอัตโนมัติ</p>
            </div>

            {/* Code Examples Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">ตัวอย่าง Request Body (JSON)</p>
                <pre className="bg-slate-900 text-indigo-100 p-4 rounded-xl text-[10px] font-mono overflow-x-auto">
                  {JSON.stringify(sampleJsonRequest, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">ตัวอย่าง Response Body (JSON)</p>
                <pre className="bg-slate-900 text-indigo-100 p-4 rounded-xl text-[10px] font-mono overflow-x-auto">
                  {JSON.stringify(sampleJsonResponse, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
