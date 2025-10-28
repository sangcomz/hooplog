import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

const isValidEnv = (v?: string) => Boolean(v) && v !== 'undefined' && v !== 'null'

const createDb = () => {
  const useTurso = process.env.NODE_ENV === 'production' || process.env.USE_TURSO === 'true'

  let url: string
  let authToken: string | undefined

  if (useTurso) {
    console.log("Initializing Drizzle with Turso DB...")
    url = process.env.TURSO_DATABASE_URL!
    authToken = process.env.TURSO_AUTH_TOKEN

    if (!isValidEnv(url) || !isValidEnv(authToken)) {
      throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set when using Turso.')
    }
  } else {
    console.log("Initializing Drizzle with Local SQLite DB...")
    url = process.env.DATABASE_URL!
    authToken = undefined

    if (!isValidEnv(url)) {
      throw new Error('DATABASE_URL must be set for local development (e.g., "file:./dev.db").')
    }
  }

  const client = createClient({ url, authToken })
  return drizzle(client, { schema })
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db

export * from "./schema"
