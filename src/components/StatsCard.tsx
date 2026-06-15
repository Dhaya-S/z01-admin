'use client';

import { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'purple' | 'amber' | 'indigo' | 'green' | 'red' | 'teal';
  trend?: string;
  urgent?: boolean;
  prefix?: string;
}

const colorMap = {
  purple: { bg: 'rgba(124,58,237,0.15)', color: '#7c3aed', shadow: 'rgba(124,58,237,0.25)' },
  amber: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', shadow: 'rgba(245,158,11,0.25)' },
  indigo: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1', shadow: 'rgba(99,102,241,0.25)' },
  green: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', shadow: 'rgba(16,185,129,0.25)' },
  red: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', shadow: 'rgba(239,68,68,0.25)' },
  teal: { bg: 'rgba(20,184,166,0.15)', color: '#14b8a6', shadow: 'rgba(20,184,166,0.25)' },
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

export default function StatsCard({ title, value, icon: Icon, color, trend, urgent, prefix }: StatsCardProps) {
  const colors = colorMap[color];
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNumeric = !isNaN(numericValue);
  const displayCount = useCountUp(isNumeric ? numericValue : 0);

  const displayValue = isNumeric
    ? prefix
      ? prefix + displayCount.toLocaleString('en-IN')
      : displayCount.toLocaleString('en-IN')
    : value;

  return (
    <div
      className="stats-card"
      style={{
        boxShadow: `0 4px 24px ${colors.shadow}`,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="stats-icon"
        style={{ background: colors.bg, boxShadow: `0 4px 12px ${colors.shadow}` }}
      >
        <Icon size={20} color={colors.color} strokeWidth={2} />
      </div>
      <div className="stats-content">
        <div className="stats-label">{title}</div>
        <div className="stats-value" style={{ color: colors.color }}>
          {displayValue}
        </div>
        {trend && (
          <div className={`stats-trend ${urgent ? 'urgent' : 'up'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
