import { Pool, QueryResult, QueryResultRow } from "@neondatabase/serverless"
import { seedDatabase } from "./seed"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://postgres:postgres@localhost:5432/billing_db"

let pool: Pool | null = null
let initialized = false
let initializingPromise: Promise<void> | null = null

async function initDb() {
  if (initialized) return
  if (initializingPromise) return initializingPromise
  
  initializingPromise = (async () => {
    try {
      await seedDatabase()
      initialized = true
    } catch (err) {
      console.error("Failed to auto-seed database:", err)
      initializingPromise = null // allow retry
    }
  })()
  
  return initializingPromise
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

export async function rawQuery<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool()
  return p.query<T>(text, params)
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool()
  if (!initialized) {
    await initDb()
  }
  return p.query<T>(text, params)
}

export async function getClient() {
  const p = getPool()
  if (!initialized) {
    await initDb()
  }
  return p.connect()
}


