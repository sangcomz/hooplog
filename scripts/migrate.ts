import { createClient } from "@libsql/client"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

const runMigrate = async () => {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error("DATABASE_URL or TURSO_DATABASE_URL is not set")
  }

  console.log("Running migrations...")
  console.log("Database URL:", url.replace(/:[^:]*@/, ":****@"))

  const client = createClient({
    url,
    authToken,
  })

  // Get all .sql files from drizzle folder
  const migrationsFolder = join(process.cwd(), "drizzle")

  // Check if migrations folder exists
  try {
    const migrationFiles = readdirSync(migrationsFolder)
      .filter((file) => file.endsWith(".sql"))
      .sort()

    if (migrationFiles.length === 0) {
      console.log("No migration files found, skipping...")
      process.exit(0)
    }

    console.log(`Found ${migrationFiles.length} migration files`)

    // Execute each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`)
      const sql = readFileSync(join(migrationsFolder, file), "utf8")

      // Split by statement-breakpoint and execute each statement
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      for (const statement of statements) {
        try {
          await client.execute(statement)
        } catch (error: any) {
          // Ignore "already exists" and "duplicate column" errors
          if (
            error.message?.includes("already exists") ||
            error.message?.includes("duplicate column")
          ) {
            console.log(`  Skipping (already exists): ${statement.substring(0, 50)}...`)
          } else {
            throw error
          }
        }
      }
    }

    console.log("Migrations completed successfully!")
    process.exit(0)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log("No migrations folder found, skipping...")
      process.exit(0)
    }
    throw error
  }
}

runMigrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
