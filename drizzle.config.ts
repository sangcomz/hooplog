import type { Config } from "drizzle-kit"

const isTurso = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL?.startsWith("libsql://")

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: isTurso
    ? {
        url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_URL || "file:./dev.db",
      },
} satisfies Config
