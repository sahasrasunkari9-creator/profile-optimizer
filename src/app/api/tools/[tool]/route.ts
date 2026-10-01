import { NextResponse } from "next/server";
import { clientIp, cors, httpError, preflight, rateLimit } from "@/server/lib/http";
import { runTool, type ToolName } from "@/server/ai";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tool: string }> };
const TOOLS: ToolName[] = ["headline", "summary", "experience", "objective", "keywords", "review", "suggestions"];

export async function OPTIONS() {
  return preflight();
}

/** POST /api/tools/:tool — run one AI tool (headline, summary, experience, objective, keywords, review, suggestions). */
export async function POST(req: Request, { params }: Params) {
  const ip = clientIp(req);
  const { tool } = await params;
  if (!TOOLS.includes(tool as ToolName)) {
    return cors(httpError(404, "Unknown tool."));
  }
  if (!rateLimit(`tool:${tool}:${ip}`, 30, 60_000)) {
    return cors(httpError(429, "You're generating a little too fast. Give it a minute."));
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return cors(httpError(400, "Request body must be valid JSON."));
  }

  if (tool === "experience" && !String(body.lines ?? "").trim()) {
    return cors(httpError(400, "Please paste your experience bullets before generating."));
  }
  if (tool === "keywords" && !String(body.jdText ?? "").trim()) {
    return cors(httpError(400, "Please paste a job description before generating."));
  }

  try {
    const result = runTool(tool as ToolName, body);
    return cors(NextResponse.json({ success: true, tool, ...result }));
  } catch (e) {
    console.error(`[POST /api/tools/${tool}]`, e);
    return cors(httpError(500, "Unable to generate content. Please try again."));
  }
}
