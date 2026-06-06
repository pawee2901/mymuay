'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Flame, ShieldCheck } from 'lucide-react';

const iconMap = {
  Sparkles,
  Flame,
  ShieldCheck
};

const defaultSlides = [
  {
    id: '1',
    title: 'แอปพรีเมียม สตรีมมิ่ง แท้ 100%',
    description: 'บริการแอปพรีเมียม Netflix, Disney+, Spotify บัญชีแท้ ราคาประหยัด ส่งของอัตโนมัติตลอด 24 ชั่วโมง ได้รับรหัสทันทีหลังชำระเงิน',
    badge: 'STREAMS 24/7',
    iconName: 'Sparkles',
    bgGradient: 'from-slate-900 to-indigo-950',
    btnText: 'เลือกซื้อแอปพรีเมียม',
    image: 'https://img.rdcw.co.th/images/cebd465433a2364d61bd4b7c8bd36e831b04e1ea0c86a752f66f4e686f81b5d5.jpeg',
    slideType: 'STANDARD',
    linkUrl: ''
  },
  {
    id: '2',
    title: 'บริการเติมเกมออโต้ เปิดบริการ 24 ชม.',
    description: 'เติมเงินคูปอง RoV, Free Fire, Valorant ราคาถูกที่สุด ปลอดภัย 100% ใช้เพียงแค่ UID/OpenID ดำเนินรายการสำเร็จภายใน 10 วินาที',
    badge: 'INSTANT GAME TOPUP',
    iconName: 'Flame',
    bgGradient: 'from-slate-950 to-indigo-900',
    btnText: 'เติมเงินเกมทันที',
    image: 'https://img.rdcw.co.th/images/62ad809c841b6894ceee914b827c29ab2dc67a719fea1fd6daa0ac14da6bc42e.png',
    slideType: 'STANDARD',
    linkUrl: ''
  },
  {
    id: '3',
    title: 'ระบบอัตโนมัติ ไม่ใช้ XAMPP เสถียรสูงสุด',
    description: 'ทางร้านใช้ระบบ SQLite & Next.js ไร้รอยต่อ ป้องกันปัญหาร้านค้าขัดข้องและส่งของล่าช้า เพื่อการทำธุรกรรมที่ปลอดภัยสูงสุดสำหรับคุณ',
    badge: 'SECURE AUTOMATED DB',
    iconName: 'ShieldCheck',
    bgGradient: 'from-slate-900 via-slate-950 to-indigo-950',
    btnText: 'ตรวจสอบความปลอดภัย',
    image: 'https://img.rdcw.co.th/images/be45613bbc4077dcc0cabe4080138e8be1a039648f2fba705b61fbb9848b8259.png',
    slideType: 'STANDARD',
    linkUrl: ''
  }
];

export default function HomeCarousel({ slides = [] }) {
  const displaySlides = slides.length > 0 ? slides : defaultSlides;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto play slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    }, 8000); // changes every 8 seconds
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden aspect-[2.35/1] md:aspect-[21/9] lg:aspect-[3/1] shadow-sm group border border-slate-200/40 bg-slate-950">
      
      {/* Slides Container */}
      <div 
        className="flex w-full h-full transition-all duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {displaySlides.map((slide) => {
          const isVideo = slide.image && (
            slide.image.endsWith('.mp4') || 
            slide.image.endsWith('.webm') || 
            slide.image.endsWith('.ogg') || 
            slide.image.endsWith('.mov') || 
            slide.image.endsWith('.m4v') ||
            slide.image.includes('/video/')
          );

          return (
            <div 
              key={slide.id} 
              className="w-full h-full flex-shrink-0 relative overflow-hidden bg-slate-950 flex items-center justify-center"
            >
              {slide.linkUrl ? (
                <a href={slide.linkUrl} className="absolute inset-0 z-20 cursor-pointer block w-full h-full">
                  {isVideo ? (
                    <video
                      src={slide.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={slide.image}
                      alt={slide.title || 'Slide Banner'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </a>
              ) : (
                <>
                  {isVideo ? (
                    <video
                      src={slide.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={slide.image}
                      alt={slide.title || 'Slide Banner'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Slide Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 border border-white/10 hover:bg-black/30 hover:scale-105 text-white opacity-0 group-hover:opacity-100 transition-premium cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 border border-white/10 hover:bg-black/30 hover:scale-105 text-white opacity-0 group-hover:opacity-100 transition-premium cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Slider Indicators dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {displaySlides.map((_, index) => (
          <button 
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-premium cursor-pointer ${currentSlide === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
