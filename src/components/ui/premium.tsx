"use client";

/**
 * Ilm AI premium UI kit — reusable animated building blocks (cards, stat tiles,
 * progress rings, count-ups, section titles) so every screen shares one polished,
 * animation-rich design language. All original; no third-party assets.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

/** Eases a number up to `to` the first time it scrolls into view. */
export function CountUp({ to, duration = 1000, className = "" }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref} className={`tabular-nums ${className}`}>{n}</span>;
}

/** Animated, hover-lifting surface card used everywhere. */
export function PremiumCard({
  children,
  className = "",
  delay = 0,
  hover = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { y: -4 } : undefined}
      onClick={onClick}
      className={`rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.04] backdrop-blur-sm ${
        hover ? "transition-shadow hover:shadow-[0_24px_60px_-24px_rgba(30,41,59,0.35)] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Icon + big value + label stat tile, with an optional trend chip. */
export function StatCard({
  icon: Icon,
  iconColor = "#6366f1",
  label,
  value,
  countTo,
  suffix = "",
  trend,
  delay = 0,
}: {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  value?: ReactNode;
  countTo?: number;
  suffix?: string;
  trend?: { value: string; up?: boolean };
  delay?: number;
}) {
  return (
    <PremiumCard delay={delay} className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center mb-3"
          style={{ backgroundColor: `${iconColor}1a` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {trend && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.up ? "text-emerald-600 bg-emerald-500/10" : "text-red-500 bg-red-500/10"}`}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white leading-none">
        {countTo != null ? <CountUp to={countTo} /> : value}
        {suffix}
      </div>
      <div className="text-xs text-slate-400 font-semibold mt-1.5">{label}</div>
    </PremiumCard>
  );
}

/** Circular progress ring with a value in the center. */
export function ProgressRing({
  value,
  max = 100,
  size = 132,
  stroke = 11,
  color = "#0E607A",
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100 dark:stroke-white/10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: circ - pct * circ }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function SectionTitle({ icon: Icon, children, className = "" }: { icon?: React.ElementType; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</h2>
    </div>
  );
}
