import { NextResponse } from "next/server";
import { clientIp, cors, httpError, preflight, rateLimit, strField } from "@/server/lib/http";
import {
  DEMO_USER_ID,
  ensureDemoUser,
  listProfiles,
  upsertProfile,
} from "@/server/services/profileStore";
import { ROLES } from "@/lib/appTypes";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** GET /api/profiles — the user's saved profiles. */
export async function GET(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`profiles:${ip}`, 120, 60_000)) {
    return cors(httpError(429, "Too many requests. Please slow down."));
  }
  try {
    await ensureDemoUser();
    const list = await listProfiles(DEMO_USER_ID);
    return cors(NextResponse.json({ success: true, profiles: list }));
  } catch (e) {
    console.error("[GET /api/profiles]", e);
    return cors(httpError(500, "We couldn't load your profiles. Please try again."));
  }
}

/** POST /api/profiles — create (id omitted) or update (id present) a saved profile. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`save:${ip}`, 20, 60_000)) {
    return cors(httpError(429, "Too many saves. Please wait a moment."));
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return cors(httpError(400, "Request body must be valid JSON."));
  }
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
  const role = (ROLES as readonly string[]).includes(strField(body, "role"))
    ? (strField(body, "role") as (typeof ROLES)[number])
    : "Software Developer";
  const skills = Array.isArray(body.skills)
    ? body.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 30)
    : [];

  try {
    await ensureDemoUser();
    const profile = await upsertProfile(DEMO_USER_ID, id, {
      fullName: strField(body, "fullName", { max: 120 }),
      role,
      headline: strField(body, "headline", { max: 400 }),
      about: strField(body, "about", { max: 12000 }),
      experience: strField(body, "experience", { max: 12000 }),
      skills,
      jdText: strField(body, "jdText", { max: 20000 }),
    });
    return cors(NextResponse.json({ success: true, profile }));
  } catch (e) {
    console.error("[POST /api/profiles]", e);
    return cors(httpError(500, "We couldn't save your profile. Please try again."));
  }
}
