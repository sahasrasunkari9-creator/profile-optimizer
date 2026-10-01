import { NextResponse } from "next/server";

/* ----------------------------- Errors ----------------------------- */

export function httpError(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

export function notFound(what = "Resource") {
  return httpError(404, `${what} not found.`);
}

/* ------------------------------ CORS ------------------------------ */

export const CORSED_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function cors(res: NextResponse) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORSED_HEADERS)) {
    headers.set(k, v);
  }
  return new NextResponse(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORSED_HEADERS });
}

/* -------------------------- Rate limiting -------------------------- */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

if (buckets.size > 4096) buckets.clear();

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

/* ---------------------------- Validation --------------------------- */

export function strField(
  body: Record<string, unknown>,
  key: string,
  opts: { min?: number; max?: number } = {}
): string {
  const v = typeof body[key] === "string" ? body[key].trim() : "";
  if (v.length > (opts.max ?? 20000)) return v.slice(0, opts.max ?? 20000);
  return v;
}
