import { NextResponse } from "next/server";
import { clientIp, cors, httpError, preflight, rateLimit, strField } from "@/server/lib/http";
import { runAnalysis } from "@/server/ai";
import { ensureDemoUser } from "@/server/services/profileStore";
import { ROLES } from "@/lib/appTypes";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** POST /api/analyze — full profile strength analysis (score, keywords, suggestions). */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`analyze:${ip}`, 40, 60_000)) {
    return cors(httpError(429, "Too many requests. Please wait a moment."));
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return cors(httpError(400, "Request body must be valid JSON."));
  }

  const role = (ROLES as readonly string[]).includes(strField(body, "role"))
    ? (strField(body, "role") as (typeof ROLES)[number])
    : "Software Developer";
  const skills = Array.isArray(body.skills)
    ? body.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 30)
    : [];

  try {
    await ensureDemoUser();
    const analysis = await runAnalysis({
      fullName: strField(body, "fullName", { max: 120 }),
      role,
      headline: strField(body, "headline", { max: 400 }),
      about: strField(body, "about", { max: 12000 }),
      experience: strField(body, "experience", { max: 12000 }),
      skills,
      jdText: strField(body, "jdText", { max: 20000 }),
    });
    return cors(NextResponse.json({ success: true, analysis }));
  } catch (e) {
    console.error("[POST /api/analyze]", e);
    return cors(httpError(500, "Unable to run the analysis. Please try again."));
  }
}
