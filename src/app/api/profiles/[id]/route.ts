import { NextResponse } from "next/server";
import { clientIp, cors, httpError, notFound, preflight, rateLimit } from "@/server/lib/http";
import {
  deleteProfile,
  getProfileDetail,
} from "@/server/services/profileStore";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return preflight();
}

/** GET /api/profiles/:id — one saved profile with a fresh computed analysis. */
export async function GET(req: Request, { params }: Params) {
  const ip = clientIp(req);
  if (!rateLimit(`getprofile:${ip}`, 120, 60_000)) {
    return cors(httpError(429, "Too many requests. Please slow down."));
  }
  const { id } = await params;
  try {
    const profile = await getProfileDetail(id);
    if (!profile) return cors(notFound("Profile"));
    return cors(NextResponse.json({ success: true, profile }));
  } catch (e) {
    console.error("[GET /api/profiles/:id]", e);
    return cors(httpError(500, "We couldn't load this profile. Please try again."));
  }
}

/** DELETE /api/profiles/:id */
export async function DELETE(req: Request, { params }: Params) {
  const ip = clientIp(req);
  if (!rateLimit(`deleteprofile:${ip}`, 20, 60_000)) {
    return cors(httpError(429, "Too many requests. Please slow down."));
  }
  const { id } = await params;
  try {
    const deleted = await deleteProfile(id);
    if (!deleted) return cors(notFound("Profile"));
    return cors(NextResponse.json({ success: true, deleted: id }));
  } catch (e) {
    console.error("[DELETE /api/profiles/:id]", e);
    return cors(httpError(500, "We couldn't delete this profile. Please try again."));
  }
}
