import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** A saved LinkedIn profile draft + its last computed optimization score. */
export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull().default(""),
    role: text("role").notNull().default("Software Developer"),
    headline: text("headline").notNull().default(""),
    about: text("about").notNull().default(""),
    experience: text("experience").notNull().default(""),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    jdText: text("jd_text").notNull().default(""),
    score: integer("score").notNull().default(0),
    generationMode: text("generation_mode").notNull().default("demo"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("profiles_user_idx").on(t.userId),
  })
);
