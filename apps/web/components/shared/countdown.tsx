"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";


export function CountdownCard({
  weddingDate,
  label = "until your wedding",
}: {
  weddingDate: string;
  label?: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(weddingDate).getTime();
  const diff = target - now.getTime();
  const passed = diff <= 0;

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  return (
    <div className="rounded-2xl border border-gold-soft bg-white px-6 py-5 text-center shadow-[0_1px_3px_rgba(45,42,38,0.05)]">
      <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-warm">
        <Heart className="h-3 w-3 fill-rose text-rose" aria-hidden />
        {label}
      </div>
      {passed ? (
        <div className="font-display text-2xl font-semibold text-charcoal">
          Your wedding day has arrived
        </div>
      ) : (
        <div className="flex items-end justify-center gap-3">
          <div>
            <div className="font-display text-4xl font-bold leading-none text-charcoal tabular-nums">
              {days}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-stone-warm">
              Days
            </div>
          </div>
          <div className="pb-0.5 font-display text-2xl text-sand">·</div>
          <div>
            <div className="font-display text-4xl font-bold leading-none text-charcoal tabular-nums">
              {hours}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-stone-warm">
              Hours
            </div>
          </div>
          <div className="pb-0.5 font-display text-2xl text-sand">·</div>
          <div>
            <div className="font-display text-4xl font-bold leading-none text-charcoal tabular-nums">
              {minutes}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-stone-warm">
              Minutes
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
