"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TOOLS = [
  {
    id: "headline",
    name: "Headline Generator",
    desc: "Keyword-rich, recruiter-ready headlines for your target role.",
    icon: "M4 7V5h16v2|M9 20h6|M12 4v16",
  },
  {
    id: "summary",
    name: "About Section Writer",
    desc: "Engaging 3-paragraph summaries that read like a human wrote them.",
    icon: "M4 6h16|M4 12h16|M4 18h10",
  },
  {
    id: "experience",
    name: "Experience Rewriter",
    desc: "Weak bullets become action-verb, metric-backed achievements.",
    icon: "M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  },
  {
    id: "objective",
    name: "Career Objective",
    desc: "Forward-looking objectives aligned to where you want to go.",
    icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z|M12 2v4|M12 18v4|M2 12h4|M18 12h4",
  },
  {
    id: "keywords",
    name: "JD Keyword Extractor",
    desc: "Pull the exact terms a job description searches for — and see which you're missing.",
    icon: "M21 21l-4.3-4.3|M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
  },
  {
    id: "review",
    name: "Profile Review",
    desc: "Full 0–100 strength analysis across headline, about, experience and skills.",
    icon: "M9 11l3 3L22 4|M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  },
  {
    id: "suggestions",
    name: "Career Suggestions",
    desc: "Prioritized, honest improvement steps — not generic fluff.",
    icon: "M12 3v3|M18.4 5.6l-2.1 2.1|M21 12h-3|M12 21a6 6 0 0 0 6-6c0-3-2-5.5-6-9-4 3.5-6 6-6 9a6 6 0 0 0 6 6Z",
  },
];

const STATS = [
  { value: 7, suffix: "", label: "AI-powered tools" },
  { value: 5, suffix: "", label: "Career tracks" },
  { value: 100, suffix: "", label: "Score scale (0–100)" },
  { value: 100, suffix: "%", label: "Local-first demo data" },
];

const STEPS = [
  { n: "01", label: "Paste your profile", desc: "Headline, about, experience, skills — plus a target job description." },
  { n: "02", label: "AI analysis", desc: "The engine scores five dimensions and extracts ATS keywords." },
  { n: "03", label: "Close the gaps", desc: "See exactly what's missing vs the role, prioritized." },
  { n: "04", label: "Optimize content", desc: "Generate headlines, summaries and rewritten bullets." },
  { n: "05", label: "Download", desc: "Export your optimized content as a .txt you can paste in." },
];

const TESTIMONIALS = [
  {
    name: "Jordan A.",
    role: "Data Scientist",
    quote:
      "The JD keyword check showed me four terms I never put on my profile. I added the ones that were true for me and my responses picked up.",
  },
  {
    name: "Priya S.",
    role: "Web Developer",
    quote:
      "I stopped writing 'worked on' and started writing 'reduced load time by 40%'. The rewriter taught me the pattern in about five minutes.",
  },
  {
    name: "Marcus L.",
    role: "UI/UX Designer",
    quote:
      "The score breakdown made the problem concrete — my headline was a bio, not a headline. Fixing it was the fastest win of my job search.",
  },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1200, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className="font-display text-4xl font-bold text-ink">
      {n}
      <span className="gradient-text">{suffix}</span>
    </span>
  );
}

/* Animated holographic profile visualization (CSS/SVG) */
function HoloProfile() {
  return (
    <div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80" aria-hidden>
      {/* orbit rings */}
      <div className="spin-slow absolute inset-0 rounded-full border border-cyan/30" />
      <div className="spin-slower absolute inset-6 rounded-full border border-dashed border-purple/40" />
      <div className="absolute inset-12 rounded-full border border-violet/20" />

      {/* core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glow-ring relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-cyan/40 bg-bg0/70 backdrop-blur-md">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <defs>
              <linearGradient id="holo-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="38" r="17" fill="url(#holo-grad)" opacity="0.85" />
            <path d="M18 92c3-20 17-28 32-28s29 8 32 28" fill="url(#holo-grad)" opacity="0.7" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#holo-grad)" strokeWidth="0.6" opacity="0.5" />
          </svg>
          {/* scanline */}
          <span className="holo-scan absolute left-2 right-2 h-8 rounded-full bg-gradient-to-b from-transparent via-cyan/25 to-transparent" />
        </div>
      </div>

      {/* floating keyword chips */}
      <span className="chip-cyan orbit-a glass-card absolute -left-4 top-10 rounded-lg px-3 py-1.5 text-[11px] font-bold">machine learning</span>
      <span className="chip-violet orbit-b glass-card absolute -right-6 top-24 rounded-lg px-3 py-1.5 text-[11px] font-bold">system design</span>
      <span className="chip orbit-c glass-card absolute -bottom-2 left-6 rounded-lg px-3 py-1.5 text-[11px] font-bold">98/100</span>
      <span className="chip-cyan orbit-b glass-card absolute -right-2 bottom-16 rounded-lg px-3 py-1.5 text-[11px] font-bold">+3 keywords</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative z-10">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:pt-20">
        <div className="animate-fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.16em] text-cyan">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-cyan" />
            AI PROFILE OPTIMIZER
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.08] text-ink sm:text-6xl">
            Transform Your{" "}
            <span className="gradient-text">LinkedIn Profile</span>{" "}
            with AI.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-dim">
            Build a powerful professional identity, optimize your profile, and unlock new career
            opportunities.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link href="/tools" className="btn-neon inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-base">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z" />
              </svg>
              Optimize My Profile
            </Link>
            <Link href="/dashboard" className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold">
              View Dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.6" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
              No sign-up required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.6" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
              Data stays on your device
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.6" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
              Demo outputs clearly labeled
            </span>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <HoloProfile />
        </div>
      </section>

      {/* --------------------------- Stats cards --------------------------- */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8" aria-label="Key statistics">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className={`glass-card glass-card-hover rounded-2xl p-5 ${i % 2 ? "float-slower" : "float-slow"}`}>
              <Counter value={s.value} suffix={s.suffix} />
              <p className="mt-1 text-xs font-semibold text-ink-dim">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- Feature grid -------------------------- */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8" id="tools">
        <div className="mb-10 max-w-2xl">
          <p className="hairline mb-3 text-[11px] font-extrabold text-cyan">The toolkit</p>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Seven tools. One sharper profile.
          </h2>
          <p className="mt-3 leading-relaxed text-ink-dim">
            Every tool targets a specific weakness — pick your role first, then generate, compare and
            copy only what's true for you.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => (
            <Link
              key={t.id}
              href={`/tools?t=${t.id}`}
              className="glass-card glass-card-hover group rounded-2xl p-5"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="mb-3.5 inline-flex rounded-xl border border-violet/30 bg-violet/10 p-2.5 transition-colors group-hover:border-cyan/50 group-hover:bg-cyan/10">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover:stroke-cyan">
                  {t.icon.split("|").map((d, j) => (
                    <path key={j} d={d} />
                  ))}
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">{t.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{t.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan opacity-0 transition-opacity group-hover:opacity-100">
                Open tool
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
          <div className="glass-card glow-ring flex flex-col justify-center rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Job-role targeting</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
              Every generator adapts to your track.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["AI Engineer", "Software Developer", "Data Scientist", "Web Developer", "UI/UX Designer"].map((r) => (
                <span key={r} className="chip-cyan rounded-full px-2.5 py-1 text-[10px] font-bold">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- How it works -------------------------- */}
      <section className="border-y border-line bg-bg0/40 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="hairline mb-3 text-[11px] font-extrabold text-purple">How it works</p>
            <h2 className="font-display text-3xl font-bold text-ink">From raw profile to recruiter-ready in five steps</h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-5">
            {STEPS.map((s) => (
              <li key={s.n} className="glass-card relative rounded-2xl p-4">
                <span className="font-display text-3xl font-bold gradient-text">{s.n}</span>
                <h3 className="mt-2 text-sm font-bold text-ink">{s.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-dim">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------- Testimonials --------------------------- */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="hairline mb-3 text-[11px] font-extrabold text-cyan">What users say</p>
            <h2 className="font-display text-3xl font-bold text-ink">Real patterns, real fixes</h2>
          </div>
          <span className="chip-violet rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-wider">
            ILLUSTRATIVE SAMPLE CONTENT
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure key={t.name} className={`glass-card glass-card-hover rounded-2xl p-5 ${i === 1 ? "float-slow" : i === 2 ? "float-slower" : ""}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--purple)" opacity="0.6">
                <path d="M10 8c-3 0-5 2-5 5v4h5v-5H7c0-2 1-3 3-3V8Zm9 0c-3 0-5 2-5 5v4h5v-5h-3c0-2 1-3 3-3V8Z" />
              </svg>
              <blockquote className="mt-3 text-sm leading-relaxed text-ink-dim">{t.quote}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10 font-display text-sm font-bold text-cyan">
                  {t.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{t.name}</span>
                  <span className="block text-xs text-ink-faint">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
