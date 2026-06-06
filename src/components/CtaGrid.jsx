'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function CtaGrid({ cards }) {
  // Fallback defaults if database has no cards (omitting OTP card)
  const defaultCards = [
    {
      id: 'card1',
      title: 'ห้องแชทแจ้งปัญหา & แชทกลุ่ม',
      description: 'แจ้งปัญหาการใช้งานกับแอดมิน และพูดคุยกับเพื่อนสมาชิก',
      imageUrl: 'https://img.rdcw.co.th/images/be45613bbc4077dcc0cabe4080138e8be1a039648f2fba705b61fbb9848b8259.png',
      linkUrl: '/chat',
    },
    {
      id: 'card2',
      title: 'สมัครตัวแทน / API ออโต้',
      description: 'ติดต่อร่วมเป็นพาร์ทเนอร์ร้านค้าตัวแทนและเชื่อมต่อ API ดึงข้อมูล',
      imageUrl: 'https://img.rdcw.co.th/images/51e6b2647841d95efb33640cf0eb76ca39af073837ac653750f7f2d641813218.png',
      linkUrl: '/agent',
    },
    {
      id: 'card3',
      title: 'ระบบรับ OTP 24 ชั่วโมง',
      description: 'รับรหัส OTP สำหรับยืนยันแอปพลิเคชันและบริการด้วยตัวเอง',
      imageUrl: 'https://img.rdcw.co.th/images/be45613bbc4077dcc0cabe4080138e8be1a039648f2fba705b61fbb9848b8259.png',
      linkUrl: '/otp',
    },
    {
      id: 'card4',
      title: 'เติมเกม / เติมเงินมือถือ',
      description: 'บริการเติมเงิน RoV, Free Fire, Valorant และเครือข่ายมือถือออโต้',
      imageUrl: 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png',
      linkUrl: '/games',
    },
  ];

  const rawCards = cards && cards.length > 0 ? cards : defaultCards;
  const displayCards = rawCards;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {displayCards.map((card) => {
        // Determine if it is a local router link or external URL
        const isExternal = card.linkUrl.startsWith('http://') || card.linkUrl.startsWith('https://');

        const cardContent = (
          <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-50 flex items-center justify-center">
            {/* Background image */}
            <img 
              src={card.imageUrl} 
              alt={card.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-premium"
            />
          </div>
        );

        return isExternal ? (
          <a 
            key={card.id}
            href={card.linkUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group block rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xs hover:shadow-sm hover:border-indigo-200 transition-premium"
          >
            {cardContent}
          </a>
        ) : (
          <Link 
            key={card.id}
            href={card.linkUrl} 
            className="group block rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xs hover:shadow-sm hover:border-indigo-200 transition-premium"
          >
            {cardContent}
          </Link>
        );
      })}
    </div>
  );
}
