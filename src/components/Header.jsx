'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, LogOut, LayoutDashboard, Menu, X, Coins, KeyRound } from 'lucide-react';

export default function Header({ siteSetting }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const storeName = siteSetting?.storeName || 'mymuayy';
  const logoUrl = siteSetting?.logoUrl;

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed checking user:', err);
      }
    }
    checkUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setCurrentUser(null);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLink = (href, label, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-premium ${
          active
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="glass-navbar sticky top-0 z-50 w-full px-4 py-3 md:px-8">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-12 md:h-16 object-contain transition-transform group-hover:scale-105" />
            ) : (
              <span className="text-2xl md:text-3xl font-black tracking-wide text-[#0f1e3d] flex items-center gap-2 transition-transform group-hover:scale-105">
                <span className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white text-lg md:text-xl font-black shadow-md">
                  {storeName.charAt(0).toUpperCase()}
                </span>
                {storeName}
                <span className="text-blue-500 font-normal text-base md:text-lg">• STORE</span>
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLink('/', 'หน้าแรก', true)}
            {navLink('/categories', 'แอปพรีเมียม')}
            {navLink('/games', 'เติมเกม')}
            {navLink('/chat', 'ห้องแชท & แจ้งปัญหา')}
            {navLink('/deposit', 'เติมเงิน')}
            <Link
              href="/otp"
              className={`px-3.5 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/otp')
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              รับ OTP
            </Link>
          </nav>
        </div>

        {/* Right: Search + User */}
        <div className="hidden md:flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 focus:bg-white focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder-slate-400 focus:outline-none w-44 focus:w-56 transition-premium"
            />
            <Search className="absolute left-3 w-4 h-4 text-blue-400" />
          </form>

          {/* User */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.role === 'ADMIN' && (
                <Link href="/admin" className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-premium">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  จัดการร้านค้า
                </Link>
              )}
              <Link href="/deposit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-premium">
                <Coins className="w-3.5 h-3.5" />
                {currentUser.balance?.toLocaleString() || 0} ฿
              </Link>
              <Link href="/profile" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-premium">
                <User className="w-3.5 h-3.5" />
                {currentUser.username}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full border border-blue-200 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-premium cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <button className="px-4 py-1.5 rounded-full text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-premium cursor-pointer">
                  เข้าสู่ระบบ
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white shadow-sm transition-premium cursor-pointer">
                  สมัครสมาชิก
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          {currentUser && (
            <Link href="/deposit" className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
              <Coins className="w-3 h-3" />
              {currentUser.balance?.toLocaleString() || 0} ฿
            </Link>
          )}
          {currentUser?.role === 'ADMIN' && (
            <Link href="/admin" className="p-2 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-premium">
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-blue-50 text-slate-600 transition-premium cursor-pointer"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-blue-100 flex flex-col gap-3 pb-2 animate-fadeIn">
          <form onSubmit={handleSearch} className="relative flex items-center w-full px-2">
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-full text-xs font-medium border border-blue-200 bg-blue-50 focus:bg-white focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder-slate-400 focus:outline-none"
            />
            <Search className="absolute left-5 w-4 h-4 text-blue-400" />
          </form>

          <div className="flex flex-col text-sm font-semibold px-2 gap-0.5">
            {[
              { href: '/', label: 'หน้าแรก', exact: true },
              { href: '/categories', label: 'แอปพรีเมียม' },
              { href: '/games', label: 'เติมเกม' },
              { href: '/chat', label: 'ห้องแชท & แจ้งปัญหา' },
              { href: '/deposit', label: 'เติมเงิน' },
              { href: '/otp', label: '🔑 รับรหัส OTP' },
            ].map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`py-2 px-3 rounded-xl ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="px-4 pt-2 border-t border-blue-100 flex flex-col gap-2">
            {currentUser ? (
              <div className="flex flex-col gap-2">
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-premium">
                  <User className="w-4 h-4 text-blue-500" />
                  สวัสดีคุณ: <strong className="text-slate-800">{currentUser.username}</strong>
                </Link>
                <Link href="/deposit" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold w-fit">
                  <Coins className="w-4 h-4" />
                  ยอดเงิน: {currentUser.balance?.toLocaleString() || 0} บาท
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-premium cursor-pointer text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-2 rounded-xl border border-blue-200 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-premium cursor-pointer">
                    เข้าสู่ระบบ
                  </button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 shadow-sm transition-premium cursor-pointer">
                    สมัครสมาชิก
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
