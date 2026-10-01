"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastSystem";
import { api, errorMessage } from "@/lib/api";
import { ROLES, type Role, type ToolResult } from "@/lib/appTypes";

const TOOL_DEFS = [
  { id: "headline", name: "Headline Generator", hint: "5 keyword-rich options for your role." },
  { id: "summary", name: "Summary Writer", hint: "A 3-paragraph About section." },
  { id: "experience", name: "Experience Rewriter", hint: "Paste bullets, one per line — get strong rewrites." },
  { id: "objective", name: "Career Objective", hint: "Forward-looking goal statements." },
  { id: "keywords", name: "JD Keyword Extractor", hint: "Paste a job description to extract its terms." },
  { id: "review", name: "Profile Review", hint: "Full scored review of your pasted profile." },
  { id: "suggestions", name: "Career Suggestions", hint: "Prioritized improvement steps." },
] as const;

type ToolId = (typeof TOOL_DEFS)[number]["id"];

interface Draft {
  fullName: string;
  role: string;
  headline: string;
  about: string;
  experience: string;
  skills: string;
  jdText: string;
}

const EMPTY_DRAFT: Draft = { fullName: "", role: "Software Developer", headline: "", about: "", experience: "", skills: "", jdText: "" };

function readDraft(): Draft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = localStorage.getItem("lo.draft");
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

function ToolsInner() {
  const params = useSearchParams();
  const toast = useToast();
  const initialTool = (TOOL_DEFS.some((t) => t.id === params.get("t")) ? params.get("t") : "headline") as ToolId;

  const [tool, setTool] = useState<ToolId>(initialTool);
  const [role, setRole] = useState<Role>(
    (ROLES as readonly string[]).includes(params.get("role") ?? "")
      ? (params.get("role") as Role)
      : "Software Developer"
  );
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [years, setYears] = useState("");
  const [impact, setImpact] = useState("");
  const [lines, setLines] = useState("");
  const [industry, setIndustry] = useState("");
  const [horizon, setHorizon] = useState("");
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState(false);

  useEffect(() => {
    setDraft(readDraft());
    setLoadedDraft(true);
  }, []);

  useEffect(() => {
    if (!loadedDraft) return;
    try {
      localStorage.setItem("lo.draft", JSON.stringify(draft));
    } catch {
      /* private mode */
    }
  }, [draft, loadedDraft]);

  const skillsArr = useMemo(
    () => draft.skills.split(",").map((s) => s.trim()).filter(Boolean),
    [draft.skills]
  );

  const generate = useCallback(async () => {
    if (loading) return;
    const missing: Record<ToolId, string | null> = {
      headline: null,
      summary: null,
      experience: lines.trim() ? null : "Please paste your experience bullets before generating.",
      objective: null,
      keywords: draft.jdText.trim() ? null : "Please paste a job description before generating.",
      review: null,
      suggestions: null,
    };
    const block = missing[tool];
    if (block) {
      toast(block, "error");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        role,
        skills: skillsArr,
        years,
        impact,
        industry,
        horizon,
        lines,
        fullName: draft.fullName,
        headline: draft.headline,
        about: draft.about,
        experience: draft.experience,
        jdText: draft.jdText,
      };
      const res = await api.runTool(tool, payload);
      setResult(res);
      if (res.items.length) toast(`Generated ${res.items.length} option${res.items.length > 1 ? "s" : ""} (demo engine).`, "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  }, [loading, tool, role, skillsArr, years, impact, industry, horizon, lines, draft, toast]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard.", "success");
    } catch {
      toast("Couldn't access the clipboard.", "error");
    }
  };

  const reset = () => {
    setLines("");
    setYears("");
    setImpact("");
    setIndustry("");
    setHorizon("");
    setResult(null);
    toast("Tool reset.", "info");
  };

  const insert = (item: string, field: "headline" | "about" | "experience") => {
    setDraft((d) => ({ ...d, [field]: item }));
    toast(`Inserted into your ${field} draft — hit "Save to Dashboard" when ready.`, "success");
  };

  const saveDraft = async () => {
    if (!draft.headline.trim() && !draft.about.trim() && !draft.experience.trim() && !skillsArr.length) {
      toast("Add at least a headline, summary, experience or skills before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.saveProfile({
        fullName: draft.fullName,
        role: draft.role as Role,
        headline: draft.headline,
        about: draft.about,
        experience: draft.experience,
        skills: skillsArr,
        jdText: draft.jdText,
      });
      toast("Profile saved to your dashboard.", "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const insertable: Partial<Record<ToolId, "headline" | "about" | "experience">> = {
    headline: "headline",
    summary: "about",
    experience: "experience",
  };

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <p className="hairline mb-2 text-[11px] font-extrabold text-cyan">AI Tools</p>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Optimization toolkit</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-dim">
          Pick a tool, set your target role, generate and keep only what's true for you.
          <span className="chip-violet ml-2 rounded px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider">
            DEMO ENGINE — RULE-BASED OUTPUT
          </span>
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="glass-card rounded-2xl p-4">
            <label className="hairline mb-2 block text-[11px] font-bold text-ink-dim" htmlFor="tool-role">Target role</label>
            <select id="tool-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="neon-input w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <nav className="glass-card rounded-2xl p-2.5" aria-label="AI tools">
            {TOOL_DEFS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTool(t.id);
                  setResult(null);
                }}
                className={`mb-1 block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-bold transition-colors last:mb-0 ${
                  tool === t.id ? "bg-gradient-to-r from-cyan/15 to-purple/15 text-cyan" : "text-ink-dim hover:bg-line/40 hover:text-ink"
                }`}
                aria-current={tool === t.id}
              >
                {t.name}
              </button>
            ))}
          </nav>

          {/* Profile draft */}
          <div className="glass-card glow-ring rounded-2xl p-4">
            <h2 className="hairline mb-3 text-[11px] font-extrabold text-ink-dim">Profile draft</h2>
            <label className="mb-1 block text-[11px] font-semibold text-ink-faint" htmlFor="d-name">Full name</label>
            <input id="d-name" value={draft.fullName} onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))} placeholder="Alex Morgan" className="neon-input mb-3 w-full rounded-lg px-3 py-2 text-sm" />
            <label className="mb-1 block text-[11px] font-semibold text-ink-faint" htmlFor="d-skills">Skills (comma separated)</label>
            <input id="d-skills" value={draft.skills} onChange={(e) => setDraft((d) => ({ ...d, skills: e.target.value }))} placeholder="React, SQL, Figma" className="neon-input mb-3 w-full rounded-lg px-3 py-2 text-sm" />
            <label className="mb-1 block text-[11px] font-semibold text-ink-faint" htmlFor="d-role">Saved role</label>
            <select id="d-role" value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} className="neon-input mb-4 w-full rounded-lg px-3 py-2 text-sm">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button onClick={() => void saveDraft()} disabled={saving} className="btn-neon w-full rounded-xl py-2.5 text-sm">
              {saving ? "Saving…" : "Save to Dashboard"}
            </button>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
              Drafts auto-save to this browser (localStorage) and to the demo database when saved.
            </p>
          </div>
        </aside>

        {/* Main panel */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {TOOL_DEFS.find((t) => t.id === tool)?.name}
              </h2>
              <p className="mt-1 text-sm text-ink-dim">{TOOL_DEFS.find((t) => t.id === tool)?.hint}</p>
            </div>
            <button onClick={reset} className="btn-ghost rounded-lg px-3.5 py-2 text-xs font-bold">
              Reset
            </button>
          </div>

          {/* Tool-specific inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            {(tool === "headline" || tool === "summary" || tool === "objective") && (
              <>
                <div>
                  <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="t-years">Years of experience (optional)</label>
                  <input id="t-years" value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 4 years" className="neon-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="t-impact">Impact / goal (optional)</label>
                  <input id="t-impact" value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="e.g. improve checkout conversion" className="neon-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
              </>
            )}
            {tool === "objective" && (
              <>
                <div>
                  <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="t-ind">Industry (optional)</label>
                  <input id="t-ind" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. fintech" className="neon-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="t-horizon">Time horizon (optional)</label>
                  <input id="t-horizon" value={horizon} onChange={(e) => setHorizon(e.target.value)} placeholder="e.g. the next 2 years" className="neon-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
              </>
            )}
            {tool === "experience" && (
              <div className="sm:col-span-2">
                <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="t-lines">Your current bullets (one per line)</label>
                <textarea id="t-lines" value={lines} onChange={(e) => setLines(e.target.value)} rows={6} placeholder={"Worked on the checkout service\nHelped the team with CI\nWas responsible for the dashboard"} className="neon-input w-full resize-y rounded-xl px-3.5 py-3 text-sm leading-relaxed" />
              </div>
            )}
            {(tool === "keywords" || tool === "review" || tool === "suggestions") && (
              <div className="sm:col-span-2">
                <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="t-jd">Job description {tool === "keywords" ? "(required)" : "(optional)"}</label>
                <textarea id="t-jd" value={draft.jdText} onChange={(e) => setDraft((d) => ({ ...d, jdText: e.target.value }))} rows={5} placeholder="Paste the full job description…" className="neon-input w-full resize-y rounded-xl px-3.5 py-3 text-sm leading-relaxed" />
                <p className="mt-1 text-[11px] text-ink-faint">
                  Your profile fields (headline / summary / experience / skills) from the draft are analyzed alongside it.
                </p>
              </div>
            )}
          </div>

          <button onClick={() => void generate()} disabled={loading} className="btn-neon mt-5 inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm">
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="spin-fast">
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z" />
                </svg>
                Generate
              </>
            )}
          </button>

          {/* Output */}
          {loading && (
            <div className="mt-5 space-y-2.5" aria-hidden>
              <div className="shimmer h-14 rounded-xl" />
              <div className="shimmer h-14 rounded-xl" />
              <div className="shimmer h-14 w-3/4 rounded-xl" />
            </div>
          )}

          {result && !loading && (
            <div className="mt-6 animate-fade-up space-y-3">
              <div className="flex items-center justify-between">
                <span className="chip-violet rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider">
                  {result.mode === "ai" ? "AI-GENERATED" : "DEMO ENGINE — NOT LIVE AI"}
                </span>
                <button onClick={() => void copy(result.items.join("\n\n"))} className="btn-ghost rounded-lg px-3.5 py-1.5 text-xs font-bold">
                  Copy all
                </button>
              </div>
              {result.items.map((item, i) => (
                <div key={i} className="glass-card rounded-xl p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{item}</pre>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => void copy(item)} className="btn-ghost rounded-lg px-3 py-1.5 text-xs font-bold">
                      Copy
                    </button>
                    {insertable[tool] && (
                      <button onClick={() => insert(item, insertable[tool]!)} className="chip-cyan rounded-lg px-3 py-1.5 text-xs font-bold transition-transform hover:-translate-y-0.5">
                        Insert into {insertable[tool]}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Verify every claim before using it — only keep content that is true for you.
                <Link href="/dashboard" className="ml-1 font-bold text-cyan hover:underline">Open dashboard →</Link>
              </p>
            </div>
          )}

          {!result && !loading && (
            <div className="mt-6 rounded-xl border border-dashed border-line2 p-8 text-center">
              <p className="text-sm text-ink-dim">Your generated output will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="shimmer h-10 w-64 rounded-xl" />
          <div className="shimmer mt-6 h-72 rounded-2xl" />
        </div>
      }
    >
      <ToolsInner />
    </Suspense>
  );
}
