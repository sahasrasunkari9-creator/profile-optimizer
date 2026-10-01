"use client";

import Link from "next/link";

const PRINCIPLES = [
  {
    title: "No fake AI, ever",
    body: "Without a configured AI provider, every output is produced by a clearly-labeled, rule-based demo engine. When a live model is connected server-side, results are marked AI-generated. You always know which engine you're looking at.",
  },
  {
    title: "Your data stays yours",
    body: "Drafts auto-save to your browser's localStorage. Saved profiles go to the demo database behind our API — nothing is shared, and no third party ever sees your profile text.",
  },
  {
    title: "Honest scoring",
    body: "The 0–100 score is a transparent rubric: five dimensions, twenty points each, every point explained. No black-box \"vibe\" scores, no inflated numbers.",
  },
  {
    title: "Suggest, never invent",
    body: "Generators propose structure and language. Quantified claims you didn't provide are flagged as things to add — the app never writes your achievements for you.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative z-10 mx-auto max-w-5xl px-5 py-14 sm:px-8">
      <p className="hairline mb-3 text-[11px] font-extrabold text-cyan">About</p>
      <h1 className="font-display text-4xl font-bold text-ink">What this app is — and isn't</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-ink-dim">
        This is a full-stack AI career tool: a React frontend, a REST API backend, an AI service
        layer, and a relational database. It analyzes your LinkedIn profile across five dimensions,
        extracts the keywords a target job description actually searches for, and generates optimized
        content you can copy straight into your profile.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map((p, i) => (
          <div key={p.title} className={`glass-card glass-card-hover rounded-2xl p-5 ${i % 2 ? "float-slower" : "float-slow"}`}>
            <h2 className="font-display text-lg font-semibold text-ink">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="glass-card glow-ring mt-10 rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold text-ink">How the AI layer works</h2>
        <div className="mt-4 grid gap-4 text-sm leading-relaxed text-ink-dim md:grid-cols-3">
          <div>
            <span className="chip-cyan mb-2 block w-fit rounded px-2 py-1 text-[10px] font-extrabold">1 · FRONTEND</span>
            Generates, validates and persists your inputs. Nothing sensitive is sent anywhere but our API.
          </div>
          <div>
            <span className="chip-violet mb-2 block w-fit rounded px-2 py-1 text-[10px] font-extrabold">2 · REST API</span>
            Rate-limited, CORS-configured endpoints validate every request and return structured JSON.
          </div>
          <div>
            <span className="chip mb-2 block w-fit rounded px-2 py-1 text-[10px] font-extrabold">3 · AI SERVICE</span>
            If <code className="text-cyan">AI_API_KEY</code> is set server-side, a live LLM produces the analysis.
            Otherwise the labeled demo engine takes over. Keys never reach the browser.
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/tools" className="btn-neon rounded-xl px-6 py-3 text-sm">Try the tools</Link>
        <Link href="/contact" className="btn-ghost rounded-xl px-6 py-3 text-sm font-bold">Contact us</Link>
      </div>
    </main>
  );
}
