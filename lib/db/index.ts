import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Single shared pg Pool: Better Auth and Drizzle both use this connection.
const globalForDb = globalThis as unknown as { __pool?: Pool }

let pool: Pool | undefined
let db: ReturnType<typeof drizzle> | null = null

if (process.env.DATABASE_URL) {
  pool =
    globalForDb.__pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    })

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pool = pool
  }

  db = drizzle(pool, { schema })
} else {
  // Avoid throwing during local development when a DATABASE_URL isn't provided.
  // API routes that require the DB should check for db truthiness before using it.
  // This prevents Next.js from failing to start when env is missing.
  // If you'd like the app to error loudly, remove this guard.
  /* eslint-disable no-console */
  console.warn("DATABASE_URL not set — DB pool not initialized. Some server routes may be disabled.")
}

export { pool, db }
