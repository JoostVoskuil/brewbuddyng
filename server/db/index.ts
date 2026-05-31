import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { useRuntimeConfig } from '#imports'
import * as schema from './schema'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

let _db: ReturnType<typeof drizzle> | null = null

export function useDB() {
  if (!_db) {
    const config = useRuntimeConfig()
    const dbPath = config.databasePath as string

    // Ensure directory exists
    const dir = dirname(dbPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    _db = drizzle(sqlite, { schema })
  }
  return _db
}
