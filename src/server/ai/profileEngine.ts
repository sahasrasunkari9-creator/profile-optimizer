import type {
  Analysis,
  ChecklistItem,
  Insights,
  KeywordHit,
  ProfileInput,
  Role,
  ScoreSection,
  Suggestion,
  ToolResult,
} from "@/lib/appTypes";

/**
 * StoryForge-style "demo engine" for LinkedIn optimization.
 * Deterministic, rule-based generation — never presented as real AI
 * unless a live provider is configured (see src/server/ai/index.ts).
 */

/* ------------------------------ Roles ------------------------------ */

interface RoleDef {
  label: Role;
  keywords: string[];
  verbs: string[];
  nextRoles: string[];
  certifications: string[];
  focus: string[];
}

const ROLE_DEFS: Record<Role, RoleDef> = {
  "AI Engineer": {
    label: "AI Engineer",
    keywords: [
      "machine learning", "deep learning", "LLM", "transformers", "fine-tuning",
      "RAG", "prompt engineering", "PyTorch", "TensorFlow", "MLOps",
      "model deployment", "vector databases", "natural language processing",
      "computer vision", "evaluation", "A/B testing", "Python", "data pipelines",
    ],
    verbs: ["architected", "shipped", "optimized", "benchmarked", "deployed", "fine-tuned", "evaluated", "scaled", "prototyped", "automated"],
    nextRoles: ["Senior AI Engineer", "ML Lead", "Applied AI Researcher", "AI Product Manager"],
    certifications: ["AWS Certified Machine Learning Specialty", "TensorFlow Developer Certificate", "DeepLearning.AI Specialization"],
    focus: ["Publish one end-to-end LLM case study with eval metrics", "Contribute to an open-source RAG project", "Ship a small internal AI tool with measurable user impact"],
  },
  "Software Developer": {
    label: "Software Developer",
    keywords: [
      "backend", "frontend", "APIs", "microservices", "REST", "SQL", "cloud",
      "CI/CD", "testing", "code review", "performance", "DevOps", "Git",
      "TypeScript", "JavaScript", "system design", "scalability", "agile",
    ],
    verbs: ["engineered", "delivered", "optimized", "refactored", "automated", "led", "built", "reduced", "implemented", "mentored"],
    nextRoles: ["Senior Software Engineer", "Staff Engineer", "Engineering Manager", "Solutions Architect"],
    certifications: ["AWS Certified Solutions Architect – Associate", "CKA: Certified Kubernetes Administrator", "Google Cloud Professional Engineer"],
    focus: ["Deepen one system-design area (databases or distributed systems)", "Open 2–3 high-quality pull requests on a respected repo", "Write one technical post explaining a production problem you solved"],
  },
  "Data Scientist": {
    label: "Data Scientist",
    keywords: [
      "statistical analysis", "data modeling", "SQL", "Python", "R",
      "data visualization", "machine learning", "A/B testing", "hypothesis testing",
      "forecasting", "dashboards", "data storytelling", "ETL", "pandas",
      "experiment design", "stakeholder communication",
    ],
    verbs: ["modeled", "analyzed", "forecasted", "drove", "instrumented", "quantified", "validated", "translated", "presented", "automated"],
    nextRoles: ["Senior Data Scientist", "Analytics Engineer", "Data Science Lead", "Analytics Manager"],
    certifications: ["Microsoft Certified: Azure Data Scientist Associate", "Google Data Analytics Professional Certificate", "Tibco Spotfire Analytics Fundamentals"],
    focus: ["Rebuild one analysis as a reusable, documented pipeline", "Publish a data story with a clear business decision it drove", "Sharpen SQL window functions + experiment design"],
  },
  "Web Developer": {
    label: "Web Developer",
    keywords: [
      "responsive design", "HTML", "CSS", "JavaScript", "React", "accessibility",
      "SEO", "web performance", "cross-browser", "REST APIs", "deployment",
      "version control", "progressive web apps", "UX", "Core Web Vitals",
    ],
    verbs: ["launched", "optimized", "built", "improved", "shipped", "migrated", "accelerated", "modernized", "integrated", "resolved"],
    nextRoles: ["Senior Frontend Engineer", "Full-Stack Engineer", "Technical Lead", "Web Platform Engineer"],
    certifications: ["freeCodeCamp Responsive Web Design", "AWS Certified Cloud Practitioner", "MDN Web Development Fundamentals"],
    focus: ["Ship one public project with Lighthouse 95+ performance", "Add accessibility (WCAG AA) to your main project", "Learn one framework deeply (React or Vue) and document the learning"],
  },
  "UI/UX Designer": {
    label: "UI/UX Designer",
    keywords: [
      "user research", "wireframing", "prototyping", "design systems", "Figma",
      "usability testing", "interaction design", "visual design", "accessibility",
      "design thinking", "user flows", "information architecture", "handoff",
      "user interviews",
    ],
    verbs: ["designed", "prototyped", "researched", "systematized", "validated", "crafted", "streamlined", "increased", "defined", "championed"],
    nextRoles: ["Senior Product Designer", "Design Lead", "UX Researcher", "Design Systems Engineer"],
    certifications: ["NN/g UX Certification (Coursera)", "Figma Advanced UI Design", "Google UX Design Professional Certificate"],
    focus: ["Add two case studies with research → decision → outcome structure", "Build or contribute to a component library", "Run and document one round of moderated usability testing"],
  },
};

/* --------------------------- Utilities ---------------------------- */

const STOPWORDS = new Set([
  "the","and","for","with","you","your","our","are","will","that","this","from","have","has","was","were","who","what","when","where","how","all","any","can","could","should","would","about","into","over","under","more","most","other","some","such","than","then","them","their","there","these","they","this","those","through","very","also","not","but","each","both","few","if","in","of","on","or","to","up","as","be","by","do","he","her","his","it","its","me","my","no","off","out","so","we","us","at","is","am","be","been","being","he","she","an","a","i","d","ll","re","ve","s","t","must","may","might","shall","per","via","etc","ability","required","requirements","role","candidate","experience","experienced","skills","skill","work","working","working","team","teams","company","join","help","looking","seeking","ideal","strong","plus","across","within","under","between","able","knowledge","familiar","understanding","environment","environments","day","days","year","years","good","great","new","one","two","time","way","things","thing","people","world","business","using","use","used","make","makes","made","take","takes","day-to-day","plus","etc","min","max",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9+#.\-]*/g) ?? []).map((w) => w.replace(/\.$/, ""));
}

function bigrams(words: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`;
    m.set(pair, (m.get(pair) ?? 0) + 1);
  }
  return m;
}

export function extractJdKeywords(jdText: string, profileText: string, limit = 12): KeywordHit[] {
  const words = tokenize(jdText);
  const singles = new Map<string, number>();
  for (const w of words) {
    if (w.length < 3 || STOPWORDS.has(w)) continue;
    singles.set(w, (singles.get(w) ?? 0) + 1);
  }
  const big = bigrams(words.filter((w) => !STOPWORDS.has(w)));
  const bigPairs = [...big.entries()].filter(
    ([p, n]) => n >= 2 && p.split(" ").every((w) => w.length > 2 && !STOPWORDS.has(w))
  );
  const inProfile = (w: string) => profileText.toLowerCase().includes(w);

  const hits: KeywordHit[] = [
    ...bigPairs.map(([word, count]) => ({ word, count, inProfile: inProfile(word) })),
    ...[...singles.entries()].map(([word, count]) => ({ word, count, inProfile: inProfile(word) })),
  ].sort((a, b) => b.count - a.count);

  const out: KeywordHit[] = [];
  const seen = new Set<string>();
  for (const h of hits) {
    if (seen.has(h.word)) continue;
    // Skip single words fully contained in an already-picked phrase
    if (!h.word.includes(" ") && [...seen].some((s) => s.includes(h.word))) continue;
    seen.add(h.word);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

/* ------------------------- Content generators ---------------------- */

function hashWords(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickSeeded<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt * 7919) % arr.length];
}

export function generateHeadline(input: { role: Role; skills: string[]; years?: string; impact?: string }): ToolResult {
  const def = ROLE_DEFS[input.role];
  const seed = hashWords(input.role + input.skills.join(","));
  const s1 = input.skills[0] ?? def.keywords[0];
  const s2 = input.skills[1] ?? def.keywords[1];
  const yrs = input.years?.trim();
  const impact = input.impact?.trim();

  const templates: string[] = [
    `${input.role} | ${cap(s1)} · ${cap(s2)} | Turning complex problems into shipped, measurable outcomes`,
    `${input.role} — building production ${def.keywords[0]} solutions with ${s1} & ${s2}`,
    yrs ? `${input.role} with ${yrs} in ${s1} · helping teams ship ${def.keywords[1] ?? "better software"} faster` : `${input.role} specializing in ${s1}, ${s2} and ${def.keywords[0]}`,
    `${cap(s1)} × ${cap(s2)} | ${input.role} focused on ${impact || def.keywords[1] || "real business impact"}`,
    `Shipping ${def.keywords[0]} at scale | ${input.role} | ${cap(s1)} · ${cap(s2)}${yrs ? ` · ${yrs} experience` : ""}`,
    `I help teams ${impact ? impact.toLowerCase() : `design, build and scale ${def.keywords[0]}`}`,
  ];
  return { items: templates.slice(0, 5), mode: "demo" };
}

export function generateSummary(input: { role: Role; skills: string[]; years?: string; impact?: string }): ToolResult {
  const def = ROLE_DEFS[input.role];
  const seed = hashWords(input.skills.join(",") + input.years);
  const yrs = input.years?.trim();
  const k = (i: number) => def.keywords[i % def.keywords.length];
  const skills = input.skills.slice(0, 4);
  const skillPhrase = skills.length ? skills.map(cap).join(", ") : `${k(0)}, ${k(1)} and ${k(2)}`;

  const opener = pickSeeded(
    [
      yrs
        ? `I'm a ${input.role} with ${yrs} of experience turning ambiguous problems into reliable, measurable outcomes.`
        : `I'm a ${input.role} who cares about work that survives contact with production.`,
      `${cap(input.role)} — ${yrs ? `with ${yrs} in` : "focused on"} ${skillPhrase.toLowerCase()} and the messy middle where plans meet reality.`,
    ],
    seed, 1
  );

  const middle = `My core strengths: ${skillPhrase.toLowerCase()}. I work end-to-end — from ${k(0)} and ${k(1)} to ${k(2)} and ${k(3)} — and I measure my work by the outcomes it produces, not the hours it takes. When I joined a team, I expected to ${def.focus[0].toLowerCase()}; lately I've been doing exactly that.`;

  const closer = pickSeeded(
    [
      `I'm currently looking for ${input.impact ? `opportunities where I can ${input.impact.toLowerCase()}` : `a team where ${def.keywords[0]} has a real product impact`}. Open to conversations about ${input.role} roles, ${def.keywords[1]} challenges, and building things people actually use.`,
      `Let's talk if you're building in ${def.keywords[0]}, hiring a ${input.role}, or just want to compare notes on ${def.keywords[1]}.`,
    ],
    seed, 2
  );

  return { items: [`${opener}\n\n${middle}\n\n${closer}`], mode: "demo" };
}

const WEAK_VERBS: [RegExp, string[]][] = [
  [/\bworked on\b/i, ["delivered", "drove", "shipped"]],
  [/\bhelped\b/i, ["drove", "enabled", "partnered to deliver"]],
  [/\bmade\b/i, ["built", "produced", "delivered"]],
  [/\bwas responsible for\b/i, ["owned"]],
  [/\btook care of\b/i, ["owned", "managed"]],
  [/\bdid\b/i, ["executed", "delivered"]],
  [/\bused\b/i, ["leveraged", "applied"]],
  [/\bwas involved in\b/i, ["contributed to", "shipped"]],
];

export function rewriteExperience(input: { role: Role; lines: string }): ToolResult {
  const def = ROLE_DEFS[input.role];
  const lines = input.lines.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  const out = lines.slice(0, 10).map((line, i) => {
    let l = line.replace(/[.\s]+$/, "");
    // swap weak openers
    let swapped = false;
    for (const [re, replacements] of WEAK_VERBS) {
      if (re.test(l)) {
        l = l.replace(re, replacements[i % replacements.length]);
        swapped = true;
        break;
      }
    }
    // if nothing was swapped, ensure a strong leading verb
    const firstWord = l.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
    const startsStrong = def.verbs.includes(firstWord) || /^(built|led|created|launched|designed|reduced|increased|cut|saved|grew|migrated|automated|improved|developed|implemented|engineered|shipped|architected|analyzed|modeled|prototyped|researched|defined|owned|delivered|optimized|deployed|spearheaded|established|drove|enabled|leveraged|applied|executed|managed|contributed|produced)/i.test(l);
    if (!swapped && !startsStrong) {
      l = `${pickSeeded(def.verbs, hashWords(l), i)} ${l.charAt(0).toLowerCase()}${l.slice(1)}`;
    }
    // quantification: keep existing numbers, otherwise flag the gap
    const hasNumber = /\d/.test(l);
    if (!hasNumber) {
      l = `${l} (add a number — % improvement, $ saved, or time reduced)`;
    }
    return `• ${cap(l)}`;
  });
  if (!out.length) out.push("• (Paste your experience bullets above — one per line)");
  return { items: out, mode: "demo" };
}

export function generateObjective(input: { role: Role; industry?: string; skills: string[]; horizon?: string }): ToolResult {
  const def = ROLE_DEFS[input.role];
  const ind = input.industry?.trim();
  const s = input.skills[0] ? cap(input.skills[0]) : cap(def.keywords[0]);
  const horizon = input.horizon?.trim() || "the next 1–3 years";
  const items = [
    `To grow as a ${input.role} ${ind ? `in ${ind}` : ""} over ${horizon} — deepening ${s} and ${def.keywords[1]} skills while shipping work with clear, measurable business impact.`,
    `A focused ${input.role} aiming to ${def.focus[0].toLowerCase()} — while contributing to a team that values ${def.keywords[0]} done properly.`,
    `To build on a strong foundation of ${s} and ${def.keywords[2]} and take on progressively larger ${def.keywords[0]} responsibilities ${ind ? `in the ${ind} sector` : "over the next few years"}.`,
    `Seeking a ${input.role} role where ${def.keywords[0]} and ${def.keywords[3]} directly move a product metric — and where I can grow into ${def.nextRoles[0]}.`,
  ];
  return { items, mode: "demo" };
}

/* --------------------------- Scoring ------------------------------- */

function scoreHeadline(h: string, def: RoleDef, role: Role): ScoreSection {
  const hl = h.trim();
  let s = 0;
  const detail: string[] = [];
  if (!hl) {
    detail.push("No headline yet — add one to start scoring.");
    return { key: "headline", label: "Headline", score: 0, max: 20, detail: detail.join(" ") };
  }
  s += 8;
  detail.push("Headline present.");
  if (hl.length >= 30 && hl.length <= 120) {
    s += 4;
    detail.push("Good length (30–120 chars).");
  } else {
    detail.push(`Length ${hl.length} — aim for 30–120 characters.`);
  }
  const low = hl.toLowerCase();
  const hits = def.keywords.filter((k) => low.includes(k.toLowerCase()));
  const roleWord = role.split(" ")[0].toLowerCase();
  if (hits.length >= 2 || (hits.length >= 1 && low.includes(roleWord))) {
    s += 5;
    detail.push(`Keyword-rich (${hits.slice(0, 2).join(", ")}${hits.length > 2 ? "…" : ""}).`);
  } else if (hits.length === 1 || low.includes(roleWord)) {
    s += 2;
    detail.push("Add 1–2 more role keywords.");
  } else {
    detail.push("No role keywords detected — recruiters search for those.");
  }
  if (!/\bI (am|am a)\b/i.test(hl)) s += 3;
  else {
    detail.push('Avoid "I am…" — headlines read best as keywords + value.');
  }
  return { key: "headline", label: "Headline", score: Math.min(s, 20), max: 20, detail: detail.join(" ") };
}

function scoreAbout(a: string, def: RoleDef): ScoreSection {
  const ab = a.trim();
  let s = 0;
  const detail: string[] = [];
  if (!ab) {
    return { key: "about", label: "About", score: 0, max: 20, detail: "No About section — this is prime recruiter real estate." };
  }
  s += 6;
  detail.push("About section present.");
  if (ab.length >= 600) {
    s += 6;
  } else if (ab.length >= 300) {
    s += 4;
    detail.push("Solid length — 600+ characters reads even better.");
  } else if (ab.length >= 120) {
    s += 2;
    detail.push("A bit short — expand toward 300–600 characters.");
  } else {
    detail.push("Very short — write 2–3 short paragraphs.");
  }
  if (/\bI\b|\bwe\b/i.test(ab)) {
    s += 4;
    detail.push("First-person voice — good.");
  } else {
    detail.push("Write in first person (\"I…\").");
  }
  const low = ab.toLowerCase();
  const hits = def.keywords.filter((k) => low.includes(k.toLowerCase())).length;
  if (hits >= 4) {
    s += 4;
    detail.push(`Strong keyword coverage (${hits} matches).`);
  } else if (hits >= 2) {
    s += 2;
    detail.push("Weave in a few more natural keywords.");
  } else {
    detail.push("Few role keywords — recruiters and ATS scan for them.");
  }
  return { key: "about", label: "About", score: Math.min(s, 20), max: 20, detail: detail.join(" ") };
}

function scoreExperience(x: string, def: RoleDef): ScoreSection {
  const lines = x.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  let s = 0;
  const detail: string[] = [];
  if (!lines.length) {
    return { key: "experience", label: "Experience", score: 0, max: 20, detail: "No experience text — add bullets, one achievement per line." };
  }
  s += 6;
  detail.push("Experience provided.");
  if (lines.length >= 4) {
    s += 4;
    detail.push(`${lines.length} bullets — good density.`);
  } else {
    s += 2;
    detail.push("4+ bullets per role keeps it scannable.");
  }
  const verbHits = lines.filter((l) => def.verbs.some((v) => new RegExp(`^\\s*${v}[^a-z]`, "i").test(l))).length;
  if (verbHits >= Math.min(3, lines.length)) {
    s += 5;
    detail.push("Strong action verbs lead the bullets.");
  } else if (verbHits >= 1) {
    s += 2;
    detail.push("Start more bullets with strong verbs (delivered, optimized, led…).");
  } else {
    detail.push("Bullets should start with action verbs.");
  }
  const quantified = lines.filter((l) => /\d/.test(l)).length;
  if (quantified >= 2) {
    s += 5;
    detail.push(`${quantified} bullets carry numbers — measurable impact.`);
  } else if (quantified === 1) {
    s += 2;
    detail.push("Quantify one more bullet (% / $ / time).");
  } else {
    detail.push("No numbers found — quantify at least two bullets.");
  }
  return { key: "experience", label: "Experience", score: Math.min(s, 20), max: 20, detail: detail.join(" ") };
}

function scoreSkills(skills: string[], def: RoleDef): ScoreSection {
  let s = 0;
  const detail: string[] = [];
  if (!skills.length) {
    return { key: "skills", label: "Skills", score: 0, max: 20, detail: "No skills added — list 8–15 relevant ones." };
  }
  if (skills.length >= 10) {
    s += 8;
  } else if (skills.length >= 5) {
    s += 5;
    detail.push(`${skills.length} skills — 10+ gives recruiters more hooks.`);
  } else {
    s += 2;
    detail.push("Add more skills (aim for 8–15).");
  }
  const low = skills.map((x) => x.toLowerCase());
  const overlap = def.keywords.filter((k) => low.some((sk) => sk.includes(k) || k.includes(sk))).length;
  if (overlap >= 4) {
    s += 8;
    detail.push(`Excellent alignment with the role (${overlap} matching keywords).`);
  } else if (overlap >= 2) {
    s += 4;
    detail.push("Good alignment — add a couple more role keywords.");
  } else {
    s += 1;
    detail.push("Low alignment with the target role's keywords.");
  }
  if (skills.length >= 10 && overlap >= 2) s += 4;
  return { key: "skills", label: "Skills", score: Math.min(s, 20), max: 20, detail: detail.join(" ") };
}

function scoreCompleteness(p: ProfileInput): ScoreSection {
  let s = 0;
  const detail: string[] = [];
  if (p.fullName.trim()) {
    s += 4;
  } else {
    detail.push("Add your full name.");
  }
  if (p.role) {
    s += 4;
    detail.push(`Targeting: ${p.role}.`);
  } else {
    detail.push("Pick a target role for tailored analysis.");
  }
  if (p.jdText.trim().length > 40) {
    s += 4;
    detail.push("Job description attached — keyword matching is live.");
  } else {
    detail.push("Paste a job description to unlock keyword matching.");
  }
  if (p.experience.trim().length >= 200) {
    s += 4;
  } else if (p.experience.trim()) {
    s += 2;
    detail.push("Add more experience detail (200+ characters).");
  } else {
    detail.push("Add experience content.");
  }
  s += 4; // photo/URL can't be verified server-side; award baseline
  return { key: "completeness", label: "Completeness", score: Math.min(s, 20), max: 20, detail: detail.join(" ") };
}

export function analyzeProfile(p: ProfileInput, mode: "ai" | "demo" = "demo"): Analysis {
  const def = ROLE_DEFS[p.role] ?? ROLE_DEFS["Software Developer"];
  const sections: ScoreSection[] = [
    scoreHeadline(p.headline, def, p.role),
    scoreAbout(p.about, def),
    scoreExperience(p.experience, def),
    scoreSkills(p.skills, def),
    scoreCompleteness(p),
  ];
  const score = Math.min(100, Math.round(sections.reduce((a, b) => a + b.score, 0)));

  const profileText = `${p.headline} ${p.about} ${p.experience} ${p.skills.join(" ")}`;
  const profileKeywords = def.keywords.filter((k) => profileText.toLowerCase().includes(k.toLowerCase()));
  const missingKeywords = def.keywords.filter((k) => !profileText.toLowerCase().includes(k.toLowerCase())).slice(0, 8);
  const jdKeywords = p.jdText.trim().length > 40 ? extractJdKeywords(p.jdText, profileText) : [];
  const jdCoverage = jdKeywords.length
    ? Math.round((jdKeywords.filter((k) => k.inProfile).length / jdKeywords.length) * 100)
    : 0;

  const checklist: ChecklistItem[] = [
    { id: "headline", label: "Headline added", done: !!p.headline.trim() },
    { id: "headline-kw", label: "Headline contains 2+ role keywords", done: sections[0].score >= 15 },
    { id: "about", label: "About section ≥ 300 characters", done: p.about.trim().length >= 300 },
    { id: "bullets", label: "Experience has 4+ bullets", done: p.experience.split("\n").filter((l) => l.trim()).length >= 4 },
    { id: "quantified", label: "At least 2 quantified achievements", done: p.experience.split("\n").filter((l) => /\d/.test(l)).length >= 2 },
    { id: "skills", label: "8+ skills listed", done: p.skills.length >= 8 },
    { id: "role", label: `Targeting: ${p.role || "no role yet"}`, done: !!p.role },
    { id: "jd", label: `Job-description keyword coverage ≥ 50% (now ${jdCoverage}%${jdKeywords.length ? "" : " — no JD yet"})`, done: jdKeywords.length > 0 && jdCoverage >= 50 },
    { id: "photo", label: "Professional photo uploaded (check in LinkedIn)", done: false },
    { id: "url", label: "Custom public URL set (check in LinkedIn)", done: false },
  ];

  const suggestions: Suggestion[] = [];
  const add = (priority: Suggestion["priority"], title: string, tip: string) => suggestions.push({ priority, title, tip });

  if (sections[0].score < 15) add("high", "Sharpen your headline", `Rewrite it as: Role | 2–3 keywords | one line of value. Try: "${generateHeadline({ role: p.role, skills: p.skills }).items[0]}"`);
  if (sections[1].score < 12) add("high", "Expand your About section", `Write 3 short paragraphs: who you are + proof, what you do best (${profileKeywords.slice(0, 3).join(", ") || "your top skills"}), and what you're looking for.`);
  if (sections[2].score < 12) add("high", "Quantify your experience", "Rewrite weak bullets with strong verbs and numbers: 'Reduced build time from 25 to 8 minutes (−68%)'.");
  if (sections[3].score < 12) add("medium", "Tighten your skill set", `Add 8–15 skills. Highest-value additions for ${p.role}: ${missingKeywords.slice(0, 3).join(", ")}.`);
  if (jdKeywords.length && jdCoverage < 50) add("high", `Close the job-description gap (${jdCoverage}% coverage)`, `Mirror the job's language. Add these where truthful: ${jdKeywords.filter((k) => !k.inProfile).slice(0, 3).map((k) => k.word).join(", ")}.`);
  if (!jdKeywords.length) add("medium", "Run a keyword check against a real job", "Paste a target job description to see exactly which terms the role expects from your profile.");
  if (suggestions.length < 5) add("low", "Keep it current", "Update your profile every 30–45 days; recent activity gets more recruiter visibility.");
  if (suggestions.length < 5) add("low", "Turn on creator mode", "Publishing one short technical post per month is a cheap, high-signal visibility boost.");

  const insights: Insights = {
    nextRoles: def.nextRoles,
    certifications: def.certifications,
    focus: def.focus,
  };

  return { score, sections, checklist, profileKeywords, missingKeywords, jdKeywords, jdCoverage, suggestions, insights, mode };
}

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
