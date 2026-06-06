'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Zap } from 'lucide-react';

const mockBuyers = [
  'สมศักดิ์ K.*', 'ธนพล S.*', 'นิตยา P.*', 'ปิยะ W.*', 'เกียรติศักดิ์ A.*',
  'Sarun*', 'Nattaporn*', 'Aof_GG*', 'Muayy_Fans*', 'Teerapat*',
  'ศิริพงษ์ D.*', 'มนัสวี T.*', 'Ploy_Chil*', 'Kitti_ROV*', 'Best_Netflix*'
];

const mockProducts = [
  { name: 'Netflix Premium 30 Days (จอส่วนตัว)', price: 150 },
  { name: 'Disney plus 1 day Promo', price: 30 },
  { name: 'Spotify Premium 30 Days (Family Plan)', price: 59 },
  { name: 'RoV เติมเงินออโต้ 50 คูปอง', price: 45 },
  { name: 'Youtube Premium 30 Days', price: 39 },
  { name: 'Valorant 475 VP Top-up', price: 145 }
];

export default function LiveActivity() {
  const [activities, setActivities] = useState([]);

  // Generate initial activities
  useEffect(() => {
    const initialList = [];
    for (let i = 0; i < 3; i++) {
      const buyer = mockBuyers[Math.floor(Math.random() * mockBuyers.length)];
      const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const minsAgo = i * 2 + 1;
      initialList.push({
        id: `init-${i}`,
        buyer,
        product: product.name,
        price: product.price,
        time: `${minsAgo} นาทีที่แล้ว`
      });
    }
    setActivities(initialList);

    // Periodically add new transaction events
    const interval = setInterval(() => {
      const buyer = mockBuyers[Math.floor(Math.random() * mockBuyers.length)];
      const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const newActivity = {
        id: Date.now().toString(),
        buyer,
        product: product.name,
        price: product.price,
        time: 'เมื่อสักครู่นี้'
      };

      setActivities(prev => {
        // Keep only last 4 elements
        const updated = [newActivity, ...prev];
        // Age the previous ones
        return updated.slice(0, 4).map((item, index) => {
          if (index === 0) return item;
          // Increment times
          if (item.time === 'เมื่อสักครู่นี้') return { ...item, time: '1 นาทีที่แล้ว' };
          if (item.time.includes('นาทีที่แล้ว')) {
            const mins = parseInt(item.time) + 1;
            return { ...item, time: `${mins} นาทีที่แล้ว` };
          }
          return item;
        });
      });
    }, 12000); // add one every 12 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden font-sans">
      
      {/* Header of Activity panel */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
            กิจกรรมล่าสุด
          </h3>
          <p className="text-[10px] text-slate-400">ติดตามรายการสั่งซื้อสินค้าของร้านค้า</p>
        </div>
        
        {/* Blinking Live Badge */}
        <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5" role="status" aria-label="Live status">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          <span className="text-[10px] font-bold text-indigo-700 tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Activities list container */}
      <div className="p-3 space-y-2">
        {activities.map((act) => (
          <div 
            key={act.id} 
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-white shadow-2xs hover:border-indigo-100 transition-premium animate-slideIn"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-700 truncate">
                  {act.buyer} <span className="font-normal text-slate-500">ได้สั่งซื้อ</span> {act.product}
                </p>
                <p className="text-[9px] text-slate-400 font-sans mt-0.5">{act.time}</p>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5">
                +{act.price} ฿
              </span>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
