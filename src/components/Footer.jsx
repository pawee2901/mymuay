'use client';

import Link from 'next/link';
import { Mail, HelpCircle, Heart } from 'lucide-react';

export default function Footer({ siteSetting }) {
  const storeName = siteSetting?.storeName || 'mymuayy';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-blue-100 py-6 px-4 md:px-8 mt-auto">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-sans">

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1">
          <span>© {currentYear}</span>
          <span className="font-semibold text-slate-700">{storeName} • STORE</span>
          <span>•</span>
          <span>Made with passion &</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
          <span>by</span>
          <a href="#" className="hover:underline font-medium text-blue-600">{storeName}</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="mailto:support@mymuayy.com" className="hover:text-blue-600 transition-premium flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            ติดต่อเรา
          </a>
          <button
            onClick={() => alert('หากพบปัญหาฉ้อโกงกรุณาติดต่อแอดมินโดยตรงที่ไลน์ทางการของเรา')}
            className="hover:text-blue-600 hover:underline transition-premium flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-xs font-sans text-slate-400"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            รายงานปัญหาร้านค้า / แจ้งโกง
          </button>
        </div>

      </div>
    </footer>
  );
}
