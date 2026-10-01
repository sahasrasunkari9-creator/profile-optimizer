import type {
  Analysis,
  GenerationMode,
  ProfileInput,
  ToolResult,
} from "@/lib/appTypes";
import {
  analyzeProfile,
  generateHeadline,
  generateObjective,
  generateSummary,
  rewriteExperience,
} from "./profileEngine";

/** "ai" when a live LLM produced the output, "demo" for the rule-based engine. */
export function aiProviderConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

/**
 * Optional remote LLM hook (OpenAI-compatible). Used only when AI_API_KEY
 * is configured; otherwise everything runs through the clearly-labeled
 * demo engine. All remote output is validated before it is returned.
 */
async function tryRemoteAnalysis(p: ProfileInput): Promise<Analysis | null> {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  const base = (process.env.AI_API_BASE ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You are a LinkedIn profile optimization expert. Return ONLY a JSON object with: ' +
              '{"score":0-100,"sections":[{"key","label","score","max","detail"}],"checklist":[{"id","label","done"}],' +
              '"profileKeywords":[],"missingKeywords":[],"jdKeywords":[{"word","count","inProfile"}],"jdCoverage":0-100,' +
              '"suggestions":[{"priority":"high|medium|low","title","tip"}],' +
              '"insights":{"nextRoles":[],"certifications":[],"focus":[]}}. ' +
              "Be specific and truthful; do not invent the user's accomplishments.",
          },
          { role: "user", content: JSON.stringify(p) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "null") as Record<string, unknown>;
    if (typeof raw.score !== "number" || !Array.isArray(raw.sections) || !Array.isArray(raw.suggestions)) {
      return null;
    }
    const demo = analyzeProfile(p, "demo");
    return { ...demo, ...raw, mode: "ai" } as Analysis;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function runAnalysis(p: ProfileInput): Promise<Analysis> {
  const remote = await tryRemoteAnalysis(p);
  if (remote) return remote;
  await new Promise((r) => setTimeout(r, 250));
  return analyzeProfile(p, "demo");
}

export type ToolName =
  | "headline"
  | "summary"
  | "experience"
  | "objective"
  | "keywords"
  | "review"
  | "suggestions";

export function runTool(tool: ToolName, input: Record<string, unknown>): ToolResult {
  const role = (["AI Engineer", "Software Developer", "Data Scientist", "Web Developer", "UI/UX Designer"].includes(
    String(input.role)
  )
    ? String(input.role)
    : "Software Developer") as ProfileInput["role"];
  const skills: string[] = Array.isArray(input.skills)
    ? input.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 20)
    : String(input.skills ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);

  switch (tool) {
    case "headline":
      return generateHeadline({
        role,
        skills,
        years: typeof input.years === "string" ? input.years : undefined,
        impact: typeof input.impact === "string" ? input.impact : undefined,
      });
    case "summary":
      return generateSummary({
        role,
        skills,
        years: typeof input.years === "string" ? input.years : undefined,
        impact: typeof input.impact === "string" ? input.impact : undefined,
      });
    case "experience":
      return rewriteExperience({
        role,
        lines: typeof input.lines === "string" ? input.lines : "",
      });
    case "objective":
      return generateObjective({
        role,
        skills,
        industry: typeof input.industry === "string" ? input.industry : undefined,
        horizon: typeof input.horizon === "string" ? input.horizon : undefined,
      });
    case "keywords":
    case "review":
    case "suggestions": {
      const profile: ProfileInput = {
        fullName: String(input.fullName ?? ""),
        role,
        headline: String(input.headline ?? ""),
        about: String(input.about ?? ""),
        experience: String(input.experience ?? ""),
        skills,
        jdText: String(input.jdText ?? ""),
      };
      const analysis = analyzeProfile(profile, "demo");
      if (tool === "keywords") {
        const items = analysis.jdKeywords.length
          ? analysis.jdKeywords.map((k) => `${k.word} — ${k.inProfile ? "✓ in your profile" : "✗ missing, add it where truthful"}`)
          : analysis.missingKeywords.map((k) => `Add where truthful: ${k}`);
        return { items: items.length ? items : ["Paste a job description to extract its keywords."], mode: "demo" };
      }
      if (tool === "suggestions") {
        return { items: analysis.suggestions.map((s) => `[${s.priority.toUpperCase()}] ${s.title} — ${s.tip}`), mode: "demo" };
      }
      const items = [
        `Overall score: ${analysis.score}/100 (Demo engine)`,
        ...analysis.sections.map((s) => `${s.label}: ${s.score}/${s.max} — ${s.detail}`),
        ...analysis.suggestions.map((s) => `[${s.priority.toUpperCase()}] ${s.title} — ${s.tip}`),
      ];
      return { items, mode: "demo" };
    }
  }
}

export type { Analysis, GenerationMode, ProfileInput, ToolResult };
