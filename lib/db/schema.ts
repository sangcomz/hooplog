import { sqliteTable, text, integer, unique, index } from "drizzle-orm/sqlite-core"
import { createId } from "@paralleldrive/cuid2"

// Enums
export const memberRoleEnum = ["MANAGER", "MEMBER"] as const
export const memberTierEnum = ["A", "B", "C"] as const
export const attendanceStatusEnum = ["attend", "absent", "pending"] as const

export type MemberRole = typeof memberRoleEnum[number]
export type MemberTier = typeof memberTierEnum[number]
export type AttendanceStatus = typeof attendanceStatusEnum[number]

// Users table
export const users = sqliteTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// Accounts table (NextAuth)
export const accounts = sqliteTable(
  "Account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    providerProviderAccountIdUnique: unique("Account_provider_providerAccountId_key").on(
      account.provider,
      account.providerAccountId
    ),
  })
)

// Sessions table (NextAuth)
export const sessions = sqliteTable("Session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

// Verification tokens table (NextAuth)
export const verificationTokens = sqliteTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    identifierTokenUnique: unique("VerificationToken_identifier_token_key").on(
      vt.identifier,
      vt.token
    ),
  })
)

// Teams table
export const teams = sqliteTable("Team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// Team members table
export const teamMembers = sqliteTable(
  "TeamMember",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: text("teamId")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    role: text("role", { enum: memberRoleEnum }).notNull().default("MEMBER"),
    tier: text("tier", { enum: memberTierEnum }).notNull().default("C"),
  },
  (tm) => ({
    userIdTeamIdUnique: unique("TeamMember_userId_teamId_key").on(
      tm.userId,
      tm.teamId
    ),
  })
)

// Games table
export const games = sqliteTable("Game", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("teamId")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  creatorId: text("creatorId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  location: text("location"),
  description: text("description"),
  teamCount: integer("teamCount").notNull().default(2),
  playersPerTeam: integer("playersPerTeam").notNull().default(5),
  teams: text("teams", { mode: "json" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// Attendances table
export const attendances = sqliteTable(
  "Attendance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    gameId: text("gameId")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: attendanceStatusEnum }).notNull().default("pending"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (att) => ({
    gameIdUserIdUnique: unique("Attendance_gameId_userId_key").on(
      att.gameId,
      att.userId
    ),
  })
)

// Guests table
export const guests = sqliteTable("Guest", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  gameId: text("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tier: text("tier", { enum: memberTierEnum }).notNull().default("C"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
})
