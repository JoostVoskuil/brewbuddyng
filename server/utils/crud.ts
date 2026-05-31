import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { ZodTypeAny } from 'zod'
import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDB } from '~/server/db'

/**
 * Generic CRUD route factories.
 *
 * Almost every ingredient resource (fermentables, hops, yeasts, ...) exposes
 * the same REST surface:
 *   - `GET    /api/<resource>`        list all
 *   - `POST   /api/<resource>`        create (validated)
 *   - `GET    /api/<resource>/:id`    read one
 *   - `PUT    /api/<resource>/:id`    update (validated)
 *   - `DELETE /api/<resource>/:id`    delete
 *
 * These helpers remove the boilerplate (and the divergence) that used to live
 * in ~16 near-identical handler files. Validation is driven by the Zod schema
 * derived from the Drizzle table, so unknown/invalid input is rejected with a
 * 400 instead of being silently coerced.
 */

interface CrudOptions {
  /** The Drizzle table backing this resource. Must have an `id` column. */
  table: SQLiteTable
  /** Zod schema validating the request body on create. */
  insertSchema: ZodTypeAny
  /** Zod schema validating the request body on update (typically partial). */
  updateSchema: ZodTypeAny
  /** Human-readable singular name, used in 404 messages (e.g. "Fermentable"). */
  name: string
}

function tableId(table: SQLiteTable) {
  // Every resource table in this app has an auto-increment `id`.
  return (table as unknown as { id: Parameters<typeof eq>[0] }).id
}

function parseId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }
  return id
}

/** Handler for `/api/<resource>` (list + create). */
export function defineCollectionHandler(options: CrudOptions) {
  const { table, insertSchema, name } = options
  return defineEventHandler(async (event) => {
    const db = useDB()
    const method = getMethod(event)

    if (method === 'GET') {
      return await db.select().from(table).all()
    }

    if (method === 'POST') {
      const body = await readValidatedBody(event, (b) => insertSchema.parse(b))
      const [created] = await db
        .insert(table)
        .values(body as never)
        .returning()
      setResponseStatus(event, 201)
      return created
    }

    throw createError({ statusCode: 405, message: `Method ${method} not allowed on ${name}` })
  })
}

/** Handler for `/api/<resource>/:id` (read + update + delete). */
export function defineItemHandler(options: CrudOptions) {
  const { table, updateSchema, name } = options
  return defineEventHandler(async (event) => {
    const db = useDB()
    const id = parseId(event)
    const method = getMethod(event)
    const idColumn = tableId(table)

    if (method === 'GET') {
      const row = await db.select().from(table).where(eq(idColumn, id)).get()
      if (!row) throw createError({ statusCode: 404, message: `${name} not found` })
      return row
    }

    if (method === 'PUT') {
      const body = await readValidatedBody(event, (b) => updateSchema.parse(b))
      const [updated] = await db
        .update(table)
        .set(body as never)
        .where(eq(idColumn, id))
        .returning()
      if (!updated) throw createError({ statusCode: 404, message: `${name} not found` })
      return updated
    }

    if (method === 'DELETE') {
      const [deleted] = await db.delete(table).where(eq(idColumn, id)).returning()
      if (!deleted) throw createError({ statusCode: 404, message: `${name} not found` })
      return { success: true }
    }

    throw createError({ statusCode: 405, message: `Method ${method} not allowed on ${name}` })
  })
}
