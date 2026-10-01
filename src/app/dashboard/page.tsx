"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KeywordBars, MiniRing, ScoreGauge, SectionBar } from "@/components/ScoreVisuals";
import { useToast } from "@/components/ToastSystem";
import { api, errorMessage } from "@/lib/api";
import type { ProfileDetail, ProfileRow } from "@/lib/appTypes";

export default function DashboardPage() {
  const toast = useToast();
  const [list, setList] = useState<ProfileRow[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProfileDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [optimize, setOptimize] = useState<{ headline: string | null; expLine: string | null; expBefore: string | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await api.listProfiles();
      setList(rows);
      setLoadErr(null);
      const target = rows.find((r) => r.id === activeId) ?? rows[0] ?? null;
      setActiveId(target?.id ?? null);
    } catch (e) {
      setLoadErr(errorMessage(e));
    }
  }, [activeId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return;
    }
    let stop = false;
    setDetail(null);
    void (async () => {
      try {
        const d = await api.getProfile(activeId);
        if (!stop) setDetail(d);
      } catch (e) {
        if (!stop) setLoadErr(errorMessage(e));
      }
    })();
    return () => {
      stop = true;
    };
  }, [activeId]);

  const runOptimize = async () => {
    if (!detail) return;
    try {
      const [headline, exp] = await Promise.all([
        api.runTool("headline", { role: detail.role, skills: detail.skills }),
        api.runTool("experience", { role: detail.role, lines: detail.experience }),
      ]);
      const first = detail.experience.split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? "";
      setOptimize({
        headline: headline.items[0] ?? null,
        expLine: exp.items[0] ?? null,
        expBefore: first || null,
      });
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const download = () => {
    if (!detail) return;
    const a = detail.analysis;
    const lines = [
      `OPTIMIZED PROFILE PACK`,
      `Name: ${detail.fullName || "—"}`,
      `Target role: ${detail.role}`,
      `Score: ${a.score}/100 (${a.mode === "ai" ? "AI engine" : "Demo engine"})`,
      ``,
      `=== HEADLINE ===`,
      detail.headline || "(empty)",
      ``,
      `=== ABOUT ===`,
      detail.about || "(empty)",
      ``,
      `=== EXPERIENCE ===`,
      detail.experience || "(empty)",
      ``,
      `=== SKILLS ===`,
      detail.skills.join(", ") || "(none)",
      ``,
      `=== SCORE BREAKDOWN ===`,
      ...a.sections.map((s) => `${s.label}: ${s.score}/${s.max} — ${s.detail}`),
      ``,
      `=== SUGGESTIONS ===`,
      ...a.suggestions.map((s) => `[${s.priority.toUpperCase()}] ${s.title} — ${s.tip}`),
      ``,
      `=== KEYWORDS ===`,
      `In profile: ${a.profileKeywords.join(", ") || "none"}`,
      `Missing: ${a.missingKeywords.join(", ") || "none"}`,
      ...(detail.jdText ? [`JD coverage: ${a.jdCoverage}%`, `JD keywords: ${a.jdKeywords.map((k) => `${k.word} (${k.inProfile ? "ok" : "missing"})`).join(", ")}`] : []),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "optimized-profile.txt";
    el.click();
    URL.revokeObjectURL(url);
    toast("Download started.", "success");
  };

  const remove = async () => {
    if (!activeId) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      window.setTimeout(() => setDeleteArmed(false), 3200);
      return;
    }
    try {
      await api.deleteProfile(activeId);
      toast("Profile deleted.", "success");
      setActiveId(null);
      await load();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const a = detail?.analysis;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="hairline mb-2 text-[11px] font-extrabold text-cyan">Dashboard</p>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Profile analytics</h1>
        </div>
        {list && list.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`chip rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  activeId === p.id ? "border-cyan/60 bg-cyan/10 text-cyan" : "hover:border-line2"
                }`}
              >
                {p.fullName || "Untitled"} · {p.score}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadErr && (
        <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-danger/40 p-5">
          <p className="text-sm text-danger">{loadErr}</p>
          <button onClick={() => void load()} className="btn-ghost rounded-lg px-4 py-2 text-sm font-bold">Retry</button>
        </div>
      )}

      {list === null && !loadErr && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="shimmer h-64 rounded-2xl" />
          <div className="shimmer h-64 rounded-2xl" />
          <div className="shimmer h-64 rounded-2xl" />
        </div>
      )}

      {list !== null && list.length === 0 && (
        <div className="glass-card glow-ring flex flex-col items-center rounded-2xl px-6 py-20 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/40 bg-cyan/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a5 5 0 0 0-5 5v1H5a2 2 0 0 0-2 2v3.5a2.5 2.5 0 0 0 2.5 2.5H9" />
              <path d="M12 2a5 5 0 0 1 5 5v1h2a2 2 0 0 1 2 2v3.5a2.5 2.5 0 0 1-2.5 2.5H15" />
              <circle cx="12" cy="12" r="2.4" />
            </svg>
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink">No saved profiles yet</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-dim">
            Generate content in the AI tools and hit <strong className="text-ink">Save to Dashboard</strong> —
            your scored analysis will live here.
          </p>
          <Link href="/tools" className="btn-neon mt-6 rounded-xl px-6 py-3 text-sm">
            Open AI Tools
          </Link>
        </div>
      )}

      {detail && a && (
        <div className="animate-fade-up space-y-5">
          {/* Top row: score + sections + coverage */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="glass-card glow-ring rounded-2xl p-6">
              <ScoreGauge score={a.score} mode={a.mode} />
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => setActiveId(activeId)} className="btn-ghost rounded-lg px-3.5 py-2 text-xs font-bold" title="Re-run analysis">
                  Re-analyze
                </button>
                <button onClick={download} className="chip-cyan rounded-lg px-3.5 py-2 text-xs font-bold transition-transform hover:-translate-y-0.5">
                  Download .txt
                </button>
                <button onClick={() => void remove()} className={`btn-danger rounded-lg px-3.5 py-2 text-xs font-bold ${deleteArmed ? "animate-pulse-soft" : ""}`}>
                  {deleteArmed ? "Confirm" : "Delete"}
                </button>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="hairline mb-4 text-[11px] font-extrabold text-ink-dim">Score breakdown</h2>
              <div className="space-y-4">
                {a.sections.map((s) => (
                  <SectionBar key={s.key} label={s.label} score={s.score} max={s.max} detail={s.detail} />
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="hairline mb-4 text-[11px] font-extrabold text-ink-dim">Keyword match</h2>
              {a.jdKeywords.length > 0 ? (
                <>
                  <div className="mb-4 flex justify-center">
                    <MiniRing value={a.jdCoverage} label="of the job's top keywords appear in your profile" />
                  </div>
                  <KeywordBars items={a.jdKeywords.slice(0, 7)} title="Job description keywords" />
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-ink-dim">No job description attached.</p>
                  <p className="mt-1.5 text-xs text-ink-faint">Paste one in the JD Keyword Extractor tool to unlock matching.</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.profileKeywords.slice(0, 6).map((k) => (
                  <span key={k} className="chip-cyan rounded-full px-2.5 py-1 text-[10px] font-bold">{k}</span>
                ))}
                {a.missingKeywords.slice(0, 4).map((k) => (
                  <span key={k} className="rounded-full border border-dashed border-danger/50 px-2.5 py-1 text-[10px] font-bold text-danger">{k}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Middle row: checklist + suggestions + before/after */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="hairline mb-4 text-[11px] font-extrabold text-ink-dim">Improvement checklist</h2>
              <ul className="space-y-2.5">
                {a.checklist.map((c) => (
                  <li key={c.id} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${c.done ? "border-ok/60 bg-ok/15 text-ok" : "border-line2 text-ink-faint"}`}>
                      {c.done ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span className={`text-sm leading-snug ${c.done ? "text-ink" : "text-ink-dim"}`}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="hairline mb-4 text-[11px] font-extrabold text-ink-dim">Priority suggestions</h2>
              <ul className="space-y-3">
                {a.suggestions.map((s, i) => (
                  <li key={i} className="rounded-xl border border-line/70 bg-bg0/40 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider ${s.priority === "high" ? "bg-danger/15 text-danger" : s.priority === "medium" ? "bg-purple/15 text-purple" : "bg-cyan/10 text-cyan"}`}>
                        {s.priority.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-ink">{s.title}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">{s.tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="hairline text-[11px] font-extrabold text-ink-dim">Before / after</h2>
                <button onClick={() => void runOptimize()} className="btn-neon rounded-lg px-3 py-1.5 text-xs">
                  Optimize sample
                </button>
              </div>
              {!optimize ? (
                <div className="flex h-[60%] min-h-40 flex-col items-center justify-center text-center">
                  <p className="text-sm text-ink-dim">Generate an optimized sample of your headline and first bullet.</p>
                  <p className="mt-1 text-xs text-ink-faint">Demo-engine output — verify before using.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {optimize.headline && (
                    <div>
                      <p className="text-[10px] font-extrabold tracking-wider text-ink-faint">HEADLINE</p>
                      <p className="mt-1 rounded-lg border border-line/60 bg-bg0/40 px-3 py-2 text-xs text-ink-dim line-through decoration-danger/60">
                        {detail.headline || "(no headline yet)"}
                      </p>
                      <p className="mt-1.5 rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2 text-xs text-ink">
                        {optimize.headline}
                      </p>
                    </div>
                  )}
                  {optimize.expLine && (
                    <div>
                      <p className="text-[10px] font-extrabold tracking-wider text-ink-faint">FIRST BULLET</p>
                      {optimize.expBefore && (
                        <p className="mt-1 rounded-lg border border-line/60 bg-bg0/40 px-3 py-2 text-xs text-ink-dim line-through decoration-danger/60">
                          {optimize.expBefore}
                        </p>
                      )}
                      <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2 text-xs text-ink">
                        {optimize.expLine}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Insights row */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="hairline mb-4 text-[11px] font-extrabold text-ink-dim">Career growth insights — {detail.role}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="mb-2 text-sm font-bold text-ink">Where this role goes next</h3>
                <div className="flex flex-wrap gap-1.5">
                  {a.insights.nextRoles.map((r) => (
                    <span key={r} className="chip-violet rounded-full px-3 py-1 text-[11px] font-bold">{r}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold text-ink">High-value certifications</h3>
                <ul className="space-y-1.5">
                  {a.insights.certifications.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-xs leading-relaxed text-ink-dim">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                        <circle cx="12" cy="8" r="6" />
                        <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold text-ink">90-day focus</h3>
                <ul className="space-y-1.5">
                  {a.insights.focus.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-ink-dim">
                      <span className="font-display shrink-0 font-bold text-purple">{i + 1}.</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
