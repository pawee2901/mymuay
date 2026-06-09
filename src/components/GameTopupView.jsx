'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, ChevronLeft, Gem } from 'lucide-react';
import Swal from 'sweetalert2';

export default function GameTopupView({ game, product }) {
  const router = useRouter();
  const [openId, setOpenId] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState(product.options[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const selectedOption = product.options.find((option) => option.id === selectedOptionId);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!openId.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณาระบุ OPEN ID' });
      return;
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
          targetId: openId.trim(),
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
        text: data.order?.externalOrderId ? `WonDD Order: ${data.order.externalOrderId}` : undefined,
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
            <p className="text-xs text-slate-500">ระบบเติมเกมอัตโนมัติ เลือกราคาแล้วกรอก OPEN ID</p>
          </div>
        </div>

        <section>
          <h2 className="flex items-center gap-2 text-sky-500 font-black text-base">
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sky-400 text-white text-sm">2</span>
            ระบุ OPEN ID (ภูมิภาคไทย และ ตัวเลขแบบสั้นเท่านั้น)
          </h2>
          <input
            value={openId}
            onChange={(event) => setOpenId(event.target.value)}
            placeholder="ระบุ OPEN ID"
            className="mt-2 w-full max-w-[375px] px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-sky-500 font-black text-base">
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sky-400 text-white text-sm">3</span>
            เลือกราคา (สามารถเลือกได้หลายราคา)
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
