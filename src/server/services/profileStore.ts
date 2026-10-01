import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import type { Analysis, ProfileDetail, ProfileInput, ProfileRow } from "@/lib/appTypes";
import { runAnalysis } from "@/server/ai";

export const DEMO_USER_ID = "user_demo";

export async function ensureDemoUser() {
  const existing = await db.select().from(users).where(eq(users.id, DEMO_USER_ID)).limit(1);
  if (existing.length) return existing[0];
  const [created] = await db
    .insert(users)
    .values({ id: DEMO_USER_ID, name: "Demo Creator", email: "creator@demo.app" })
    .returning();
  return created;
}

function mapRow(row: typeof profiles.$inferSelect): ProfileRow {
  return {
    ...row,
    skills: Array.isArray(row.skills) ? row.skills : [],
    generationMode: (row.generationMode === "ai" ? "ai" : "demo") as ProfileRow["generationMode"],
  };
}

export async function listProfiles(userId: string): Promise<ProfileRow[]> {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(desc(profiles.updatedAt));
  return rows.map(mapRow);
}

export async function getProfile(id: string): Promise<ProfileRow | null> {
  const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getProfileDetail(id: string): Promise<ProfileDetail | null> {
  const row = await getProfile(id);
  if (!row) return null;
  const input: ProfileInput = {
    fullName: row.fullName,
    role: row.role as ProfileInput["role"],
    headline: row.headline,
    about: row.about,
    experience: row.experience,
    skills: row.skills,
    jdText: row.jdText,
  };
  const analysis: Analysis = await runAnalysis(input);
  return { ...row, analysis };
}

export async function upsertProfile(
  userId: string,
  id: string | null,
  data: {
    fullName: string;
    role: string;
    headline: string;
    about: string;
    experience: string;
    skills: string[];
    jdText: string;
  }
): Promise<ProfileRow> {
  const analysis = await runAnalysis({
    fullName: data.fullName,
    role: data.role as ProfileInput["role"],
    headline: data.headline,
    about: data.about,
    experience: data.experience,
    skills: data.skills,
    jdText: data.jdText,
  });

  const values = {
    fullName: data.fullName.slice(0, 120),
    role: data.role.slice(0, 80),
    headline: data.headline.slice(0, 400),
    about: data.about.slice(0, 12000),
    experience: data.experience.slice(0, 12000),
    skills: data.skills.slice(0, 30),
    jdText: data.jdText.slice(0, 20000),
    score: analysis.score,
    generationMode: analysis.mode,
    updatedAt: new Date(),
  };

  if (id) {
    const updated = await db.update(profiles).set(values).where(eq(profiles.id, id)).returning();
    if (updated.length) return mapRow(updated[0]);
  }
  const [created] = await db
    .insert(profiles)
    .values({ id: randomUUID(), userId, ...values })
    .returning();
  return mapRow(created);
}

export async function deleteProfile(id: string): Promise<boolean> {
  const deleted = await db.delete(profiles).where(eq(profiles.id, id)).returning();
  return deleted.length > 0;
}
