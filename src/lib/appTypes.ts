export const ROLES = [
  "AI Engineer",
  "Software Developer",
  "Data Scientist",
  "Web Developer",
  "UI/UX Designer",
] as const;

export type Role = (typeof ROLES)[number];

export type GenerationMode = "ai" | "demo";

export interface ProfileInput {
  fullName: string;
  role: Role;
  headline: string;
  about: string;
  experience: string;
  skills: string[];
  jdText: string;
}

export interface ProfileRow {
  id: string;
  userId: string;
  fullName: string;
  role: string;
  headline: string;
  about: string;
  experience: string;
  skills: string[];
  jdText: string;
  score: number;
  generationMode: GenerationMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreSection {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface KeywordHit {
  word: string;
  count: number;
  inProfile: boolean;
}

export interface Suggestion {
  priority: "high" | "medium" | "low";
  title: string;
  tip: string;
}

export interface Insights {
  nextRoles: string[];
  certifications: string[];
  focus: string[];
}

export interface Analysis {
  score: number;
  sections: ScoreSection[];
  checklist: ChecklistItem[];
  profileKeywords: string[];
  missingKeywords: string[];
  jdKeywords: KeywordHit[];
  jdCoverage: number;
  suggestions: Suggestion[];
  insights: Insights;
  mode: GenerationMode;
}

export interface ToolResult {
  items: string[];
  mode: GenerationMode;
}

export interface ProfileDetail extends ProfileRow {
  analysis: Analysis;
}
