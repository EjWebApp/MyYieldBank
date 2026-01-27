import {
    pgSchema,
    pgTable,
    text,
    timestamp,
    uuid,
  } from "drizzle-orm/pg-core";
  
  const users = pgSchema("auth").table("users", {
    id: uuid().primaryKey(),
  });
  
  export const profiles = pgTable("profiles", {
    profile_id: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    avatar: text(),
    name: text().notNull(),
    username: text().notNull(),
    headline: text(),
    bio: text(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  });
  