import Link from 'next/link';
import { prisma } from '@/db';
import { Gamepad2, Play } from 'lucide-react';

export const revalidate = 0; // Keep live

export default async function GamesPage() {
  // Fetch game categories from SQLite
  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: [
          'rov_cat',
          'freefire_cat',
          'undawn_cat',
          'codm_cat',
          'deltaforce_cat',
          'haikyu_cat',
          'pubg_cat',
          'mlbb_cat',
          'valorant_cat',
          'heartopia_cat'
        ]
      }
    }
  });

  const GAME_ORDER = [
    'rov_cat',
    'freefire_cat',
    'undawn_cat',
    'codm_cat',
    'deltaforce_cat',
    'haikyu_cat',
    'pubg_cat',
    'mlbb_cat',
    'valorant_cat',
    'heartopia_cat'
  ];

  // Sort them exactly as specified by the user's layout
  const sortedCategories = categories.sort((a, b) => {
    return GAME_ORDER.indexOf(a.id) - GAME_ORDER.indexOf(b.id);
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 flex-1 font-sans">
      
      {/* Title Header Block */}
      <div className="mb-8 bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-transparent p-6 rounded-3xl border border-blue-100/50">
        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
          GAME TOP-UP SYSTEM
        </span>
        <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2.5 mt-2.5">
          <Gamepad2 className="w-6 h-6 text-blue-600 animate-pulse" />
          บริการเติมเกมออโต้ 24 ชม.
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          เติมเกมโปรดของคุณง่ายๆ สะดวก รวดเร็ว ได้รับเครดิตในเกมทันทีภายใน 10 วินาที ระบบอัตโนมัติ 100% ปลอดภัย ไร้กังวล
        </p>
      </div>

      {/* Games Grid List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6">
        {sortedCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories?id=${cat.id}`}
            className="group block bg-white border border-slate-200/60 rounded-3xl p-4 text-center hover:border-blue-400 hover:shadow-md transition-premium"
          >
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-3xs group-hover:shadow-xs transition-premium">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-premium"
                />
              ) : (
                <div className="w-full h-full bg-blue-50/50 flex items-center justify-center text-blue-300">
                  <Gamepad2 className="w-12 h-12" />
                </div>
              )}
              {/* Hover overlay badge */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-premium backdrop-blur-3xs">
                <span className="bg-white text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                  เติมเงินเลย
                  <Play className="w-2.5 h-2.5 fill-indigo-600 text-blue-600" />
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <h3 className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-premium truncate">
                {cat.name}
              </h3>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center justify-center gap-1 font-sans">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>ระบบออโต้พร้อมบริการ</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
      
    </div>
  );
}
