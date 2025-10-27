import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const isValidEnv = (v?: string) => Boolean(v) && v !== 'undefined' && v !== 'null'

const createPrismaClient = () => {
  // Use Turso in production, local SQLite in development
  const useTurso = process.env.NODE_ENV === 'production' || process.env.USE_TURSO === 'true'

  if (useTurso) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (isValidEnv(url) && isValidEnv(authToken)) {
      try {
        const libsql = createClient({ url: url as string, authToken: authToken as string })
        const adapter = new PrismaLibSQL(libsql as any)
        return new PrismaClient({ adapter } as any)
      } catch (err) {
        // If anything goes wrong initializing the Turso client at build time,
        // fall back to the local SQLite client so the build can continue.
        console.warn('Failed to initialize Turso client (falling back to SQLite):', err)
      }
    } else {
      console.warn('Turso credentials not available or invalid (e.g. "undefined"), using local SQLite')
    }
  }

  // Local development with SQLite
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma