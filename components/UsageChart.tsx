'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const DAYS = 14;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function UsageChart({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let active = true;
    const since = new Date();
    since.setDate(since.getDate() - (DAYS - 1));
    since.setHours(0, 0, 0, 0);

    supabase
      .from('usage_events')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Failed to load usage chart data:', error);
          setCounts({});
          return;
        }
        const map: Record<string, number> = {};
        (data || []).forEach((row: { created_at: string }) => {
          const k = dayKey(new Date(row.created_at));
          map[k] = (map[k] || 0) + 1;
        });
        setCounts(map);
      });

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  if (!counts) {
    return <div className="h-[110px] flex items-center justify-center text-xs text-chalk-dim">Loading…</div>;
  }

  const days: { key: string; label: string; value: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    days.push({ key: k, label: String(d.getDate()), value: counts[k] || 0 });
  }

  const max = Math.max(1, ...days.map((d) => d.value));
  const total = days.reduce((s, d) => s + d.value, 0);
  const W = 560;
  const H = 110;
  const barW = W / DAYS;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" role="img" aria-label={`Explanations per day over the last ${DAYS} days: ${total} total`}>
        {days.map((d, i) => {
          const h = (d.value / max) * (H - 10);
          return (
            <g key={d.key}>
              <rect
                x={i * barW + 6}
                y={H - h}
                width={barW - 12}
                height={Math.max(h, d.value > 0 ? 3 : 1.5)}
                rx={2}
                fill={d.value > 0 ? '#E7B23A' : 'var(--chalk-faint)'}
              />
              <text x={i * barW + barW / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="var(--chalk-dim)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-chalk-dim mt-1">{total} explanation{total === 1 ? '' : 's'} in the last {DAYS} days</p>
    </div>
  );
}
