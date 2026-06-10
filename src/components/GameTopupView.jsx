'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, ChevronLeft, Gem } from 'lucide-react';
import Swal from 'sweetalert2';

export default function GameTopupView({ game, product }) {
  const router = useRouter();
  const [openId, setOpenId] = useState('');
  const [uid, setUid] = useState('');
  const [aid, setAid] = useState('');
  const [server, setServer] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState(product.options[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const selectedOption = product.options.find((option) => option.id === selectedOptionId);

  const handleSubmit = async (event) => {
    event.preventDefault();

    let finalTargetId = '';

    if (game.slug === 'heartopia') {
      if (!uid.trim()) {
        Swal.fire({ icon: 'warning', title: 'กรุณาระบุ UID' });
        return;
      }
      if (!aid.trim()) {
        Swal.fire({ icon: 'warning', title: 'กรุณาระบุ AID' });
        return;
      }
      if (!/^\d{18}$/.test(aid.trim())) {
        Swal.fire({ icon: 'warning', title: 'กรุณากรอก AID เป็นตัวเลข 18 หลักเท่านั้น' });
        return;
      }
      if (!server) {
        Swal.fire({ icon: 'warning', title: 'กรุณาเลือก Server' });
        return;
      }
      finalTargetId = `${uid.trim()} | AID: ${aid.trim()} | Server: ${server}`;
    } else {
      if (!openId.trim()) {
        Swal.fire({ icon: 'warning', title: 'กรุณาระบุ OPEN ID' });
        return;
      }
      finalTargetId = openId.trim();
    }

    if (!selectedOption) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกแพ็กเกจ' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productOptionId: selectedOption.id,
          targetId: finalTargetId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เติมเกมไม่สำเร็จ');
      }

      Swal.fire({
        icon: 'success',
        title: 'เติมเกมสำเร็จ',
        confirmButtonColor: '#0ea5e9',
        confirmButtonText: 'ตกลง'
      }).then(() => {
        router.push('/profile?tab=games');
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เติมเกมไม่สำเร็จ', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 py-6 font-sans text-slate-800">
      <button
        type="button"
        onClick={() => router.push('/games')}
        className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-700"
      >
        <ChevronLeft className="w-4 h-4" />
        กลับไปเลือกเกม
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <img src={game.image} alt={game.name} className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">{game.name}</h1>
            <p className="text-xs text-slate-500">
              {game.slug === 'heartopia' 
                ? 'ระบบเติมเกมอัตโนมัติ เลือกราคาแล้วกรอกข้อมูลด้านล่าง' 
                : 'ระบบเติมเกมอัตโนมัติ เลือกราคาแล้วกรอก OPEN ID'}
            </p>
          </div>
        </div>

        {game.slug === 'heartopia' ? (
          <>
            <section>
              <h2 className="flex items-center gap-2 text-sky-500 font-black text-base">
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sky-400 text-white text-sm">3</span>
                ระบุ UID ( ระบุ ID )
              </h2>
              <input
                value={uid}
                onChange={(event) => setUid(event.target.value)}
                placeholder="ระบุ UID"
                className="mt-2 w-full max-w-[375px] px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 font-medium"
              />
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-sky-500 font-black text-base">
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sky-400 text-white text-sm">4</span>
                ( ระบุ AID ตัวเลข 18 หลัก เท่านั้น )
              </h2>
              <input
                value={aid}
                onChange={(event) => setAid(event.target.value)}
                placeholder="ระบุ AID"
                className="mt-2 w-full max-w-[375px] px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 font-medium"
              />
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-sky-500 font-black text-base">
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sky-400 text-white text-sm">5</span>
                Server
              </h2>
              <select
                value={server}
                onChange={(event) => setServer(event.target.value)}
                className="mt-2 w-full max-w-[375px] px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white font-medium cursor-pointer"
              >
                <option value="">เลือก Server</option>
                <option value="SEA">SEA</option>
                <option value="TW/HK/MO">TW/HK/MO</option>
                <option value="Asia">Asia</option>
                <option value="Global">Global</option>
                <option value="America">America</option>
              </select>
            </section>
          </>
        ) : (
          <section>
            <h2 className="flex items-center gap-2 text-sky-500 font-black text-base">
              <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sky-400 text-white text-sm">2</span>
              ระบุ OPEN ID (ภูมิภาคไทย และ ตัวเลขแบบสั้นเท่านั้น)
            </h2>
            <input
              value={openId}
              onChange={(event) => setOpenId(event.target.value)}
              placeholder="ระบุ OPEN ID"
              className="mt-2 w-full max-w-[375px] px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 font-medium"
            />
          </section>
        )}

        <section>
          <h2 className="flex items-center gap-2 text-sky-500 font-black text-base">
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sky-400 text-white text-sm">
              {game.slug === 'heartopia' ? '6' : '3'}
            </span>
            กรุณาเลือกราคา (สามารถเลือกได้หลายราคา)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-4 mt-4">
            {product.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const originalPrice = option.originalPrice || option.price;
              const pointLabel = option.pointLabel || option.name;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`min-h-[54px] rounded-lg border bg-white px-3 py-2 text-center shadow-sm transition ${
                    isSelected ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-sm font-bold text-black">
                    <Gem className="w-4 h-4 text-sky-500 fill-sky-200" />
                    <span>{pointLabel}</span>
                  </div>
                  <div className="mt-0.5 text-xs">
                    {originalPrice > option.price && (
                      <span className="text-slate-400 line-through mr-1.5">{originalPrice.toLocaleString()} บาท</span>
                    )}
                    <span className="text-red-500 font-bold">{option.price.toLocaleString()} บาท</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="submit"
          disabled={isLoading || !selectedOption}
          className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2"
        >
          <BadgeCheck className="w-5 h-5" />
          {isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันเติมเกม'}
        </button>
      </form>
    </div>
  );
}
