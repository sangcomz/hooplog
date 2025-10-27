import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const isValidEnv = (v?: string) => Boolean(v) && v !== 'undefined' && v !== 'null'

const createPrismaClient = () => {
    const useTurso = process.env.NODE_ENV === 'production' || process.env.USE_TURSO === 'true'

    let url: string
    let authToken: string | undefined

    if (useTurso) {
        console.log("Initializing Prisma with Turso DB...")
        url = process.env.TURSO_DATABASE_URL!
        authToken = process.env.TURSO_AUTH_TOKEN

        if (!isValidEnv(url) || !isValidEnv(authToken)) {
            throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set when using Turso.')
        }
    } else {
        console.log("Initializing Prisma with Local SQLite DB...")
        url = process.env.DATABASE_URL!
        authToken = undefined

        if (!isValidEnv(url)) {
            throw new Error('DATABASE_URL must be set for local development (e.g., "file:./dev.db").')
        }
    }

    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSQL(libsql as any)
    return new PrismaClient({ adapter } as any)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
