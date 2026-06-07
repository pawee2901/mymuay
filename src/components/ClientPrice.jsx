'use client';

import { useState, useEffect } from 'react';

export default function ClientPrice({ price, agentPrice, options = [], className = "text-[#2563eb] text-xs font-black mt-1" }) {
  const [userRole, setUserRole] = useState('USER');

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUserRole(data.user.role);
          }
        }
      } catch (err) {
        console.error('Failed checking user in price display:', err);
      }
    }
    checkUser();
  }, []);

  // Format Helper
  const formatRange = (min, max) => {
    return min === max
      ? `${min.toLocaleString()} บาท`
      : `${min.toLocaleString()} – ${max.toLocaleString()} บาท`;
  };

  const hasOptions = options && options.length > 0;

  if (userRole === 'AGENT') {
    if (hasOptions) {
      // Get normal prices
      const normalPrices = options.map(o => o.price);
      const minNormal = Math.min(...normalPrices);
      const maxNormal = Math.max(...normalPrices);

      // Get agent prices (fallback to normal price if agent price is not set)
      const agentPrices = options.map(o => o.agentPrice > 0 ? o.agentPrice : o.price);
      const minAgent = Math.min(...agentPrices);
      const maxAgent = Math.max(...agentPrices);

      // Only show wholesale styling if at least one option has a valid reseller price
      const hasAnyAgentPrice = options.some(o => o.agentPrice > 0 && o.agentPrice !== o.price);

      if (hasAnyAgentPrice) {
        return (
          <div className="flex flex-col mt-1 font-sans">
            <span className="text-slate-400 line-through text-[10px] font-semibold">ทั่วไป: {formatRange(minNormal, maxNormal)}</span>
            <span className="text-purple-600 text-xs font-black">ส่งตัวแทน: {formatRange(minAgent, maxAgent)}</span>
          </div>
        );
      }
    } else {
      const hasAgentPrice = agentPrice > 0 && agentPrice !== price;
      if (hasAgentPrice) {
        return (
          <div className="flex flex-col mt-1 font-sans">
            <span className="text-slate-400 line-through text-[10px] font-semibold">ทั่วไป: {price.toLocaleString()} ฿</span>
            <span className="text-purple-600 text-xs font-black">ส่งตัวแทน: {agentPrice.toLocaleString()} ฿</span>
          </div>
        );
      }
    }
  }

  // Fallback for normal users or if no agent pricing matches
  if (hasOptions) {
    const prices = options.map(o => o.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    return <p className={className}>{formatRange(minP, maxP)}</p>;
  }

  return (
    <p className={className}>
      {price.toLocaleString()} บาท
    </p>
  );
}
