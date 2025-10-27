import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  // Use Turso in production, local SQLite in development
  const useTurso = process.env.NODE_ENV === 'production' || process.env.USE_TURSO === 'true'

  if (useTurso) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (url && authToken) {
      const libsql = createClient({ url, authToken })
      const adapter = new PrismaLibSQL(libsql as any)
      return new PrismaClient({ adapter } as any)
    }

    console.warn('Turso credentials not available, using local SQLite')
  }

  // Local development with SQLite
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma