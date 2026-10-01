import type {
  Analysis,
  ProfileDetail,
  ProfileInput,
  ProfileRow,
  ToolResult,
} from "./appTypes";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parse(res: Response) {
  let body: { success?: boolean; error?: string } & Record<string, unknown>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError("The server returned an unexpected response.", res.status);
  }
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error ?? "Something went wrong.", res.status);
  }
  return body;
}

const BASE = "/api";

export const api = {
  async analyze(input: ProfileInput): Promise<Analysis> {
    const body = await parse(
      await fetch(`${BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return body.analysis as Analysis;
  },

  async runTool(tool: string, input: Record<string, unknown>): Promise<ToolResult> {
    const body = await parse(
      await fetch(`${BASE}/tools/${tool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return { items: body.items as string[], mode: body.mode as "ai" | "demo" };
  },

  async listProfiles(): Promise<ProfileRow[]> {
    const body = await parse(await fetch(`${BASE}/profiles`));
    return body.profiles as ProfileRow[];
  },

  async getProfile(id: string): Promise<ProfileDetail> {
    const body = await parse(await fetch(`${BASE}/profiles/${id}`));
    return body.profile as ProfileDetail;
  },

  async saveProfile(
    data: (ProfileInput & { id?: string | null })
  ): Promise<ProfileRow> {
    const body = await parse(
      await fetch(`${BASE}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    );
    return body.profile as ProfileRow;
  },

  async deleteProfile(id: string): Promise<void> {
    await parse(await fetch(`${BASE}/profiles/${id}`, { method: "DELETE" }));
  },
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status >= 500 || e.status === 0) {
      return "Unable to connect to the server. Please try again.";
    }
    return e.message;
  }
  if (e instanceof TypeError) {
    return "Unable to connect to the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
