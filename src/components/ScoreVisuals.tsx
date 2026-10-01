"use client";

import { useEffect, useState } from "react";

/* ------------------------- Score gauge ------------------------- */

export function ScoreGauge({ score, mode }: { score: number; mode: "ai" | "demo" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = display;
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (score - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const R = 62;
  const C = 2 * Math.PI * R;
  const pct = Math.min(Math.max(display, 0), 100);

  return (
    <div className="relative mx-auto h-44 w-44" role="img" aria-label={`Profile score ${score} out of 100`}>
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.2s linear", filter: "drop-shadow(0 0 6px rgba(34,211,238,0.5))" }}
        />
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold text-ink">{display}</span>
        <span className="hairline mt-0.5 text-[10px] font-bold text-ink-faint">/ 100</span>
        <span className={`mt-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider ${mode === "ai" ? "chip-cyan" : "chip-violet"}`}>
          {mode === "ai" ? "AI" : "DEMO ENGINE"}
        </span>
      </div>
    </div>
  );
}

/* ------------------------- Section bar -------------------------- */

export function SectionBar({ label, score, max, detail }: { label: string; score: number; max: number; detail?: string }) {
  const [w, setW] = useState(0);
  const pct = Math.round((score / max) * 100);
  useEffect(() => {
    const t = window.setTimeout(() => setW(pct), 60);
    return () => window.clearTimeout(t);
  }, [pct]);
  return (
    <div title={detail}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-ink">{label}</span>
        <span className="text-xs font-bold tabular-nums text-ink-dim">
          {score}<span className="text-ink-faint">/{max}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan via-indigo-400 to-purple transition-[width] duration-700 ease-out"
          style={{ width: `${w}%` }}
        />
      </div>
      {detail && <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{detail}</p>}
    </div>
  );
}

/* ----------------------- Keyword bar list ----------------------- */

export function KeywordBars({
  items,
  title,
}: {
  items: { word: string; count: number; inProfile: boolean }[];
  title: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      <h3 className="hairline mb-3 text-[11px] font-extrabold text-ink-dim">{title}</h3>
      <ul className="space-y-2">
        {items.map((k) => (
          <li key={k.word} className="group">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`truncate text-xs font-semibold ${k.inProfile ? "text-ink" : "text-ink-dim"}`}>
                {k.word}
              </span>
              <span className={`shrink-0 text-[10px] font-extrabold ${k.inProfile ? "text-ok" : "text-danger"}`}>
                {k.inProfile ? "IN PROFILE" : "MISSING"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line/60">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${k.inProfile ? "bg-gradient-to-r from-cyan to-teal-300" : "bg-gradient-to-r from-purple to-fuchsia-400"}`}
                style={{ width: `${Math.max((k.count / max) * 100, 8)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------- Small ring (coverage) --------------------- */

export function MiniRing({ value, label }: { value: number; label: string }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-20 w-20" role="img" aria-label={`${label} ${value}%`}>
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={R} fill="none" stroke="var(--line)" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={R} fill="none"
            stroke={value >= 50 ? "var(--ok)" : "var(--purple)"}
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (C * Math.min(value, 100)) / 100}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">{value}%</span>
      </div>
      <span className="text-xs font-semibold leading-snug text-ink-dim">{label}</span>
    </div>
  );
}
