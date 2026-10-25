import { UserPlus, ShoppingBag } from 'lucide-react';

function timeAgo(date) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  return `${Math.round(hours / 24)} วันที่แล้ว`;
}

// events: [{ type: 'signup' | 'order', name, product?, createdAt }]
export default function ActivityTicker({ events }) {
  if (!events || events.length === 0) return null;

  const items = events.map((event, index) => (
    <span key={index} className="inline-flex items-center gap-1.5 px-5 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
      {event.type === 'signup' ? (
        <UserPlus className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <ShoppingBag className="w-4 h-4 text-blue-500 shrink-0" />
      )}
      <b className="text-slate-800">{event.name}</b>
      {event.type === 'signup' ? 'สมัครสมาชิกใหม่' : <>สั่งซื้อ <b className="text-slate-800">{event.product}</b></>}
      <span className="text-slate-400">• {timeAgo(event.createdAt)}</span>
    </span>
  ));

  // Content is duplicated so the loop is seamless; duration scales with length
  return (
    <div className="ticker relative overflow-hidden bg-white/80 border-y border-blue-100 py-2.5" aria-label="กิจกรรมล่าสุดในร้าน">
      <div className="ticker-track flex w-max" style={{ animationDuration: `${Math.max(25, events.length * 5)}s` }}>
        <div className="flex">{items}</div>
        <div className="flex" aria-hidden="true">{items}</div>
      </div>
    </div>
  );
}
