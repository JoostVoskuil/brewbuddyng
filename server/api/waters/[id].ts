import { eq, ne } from 'drizzle-orm'
import { waters } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { waterUpdate } from '~/server/utils/validation'

function parseWaterId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = parseWaterId(event)
  const method = getMethod(event)

  if (method === 'GET') {
    const row = await db.select().from(waters).where(eq(waters.id, id)).get()
    if (!row) throw createError({ statusCode: 404, message: 'Water profile not found' })
    return row
  }

  if (method === 'PUT' || method === 'PATCH') {
    const body = await readValidatedBody(event, (b) => waterUpdate.parse(b))
    const updated = await db.transaction((tx) => {
      if (body.isDefault) {
        tx.update(waters).set({ isDefault: false }).where(ne(waters.id, id)).run()
      }

      return tx.update(waters).set(body).where(eq(waters.id, id)).returning().get()
    })

    if (!updated) throw createError({ statusCode: 404, message: 'Water profile not found' })
    return updated
  }

  if (method === 'DELETE') {
    const [deleted] = await db.delete(waters).where(eq(waters.id, id)).returning()
    if (!deleted) throw createError({ statusCode: 404, message: 'Water profile not found' })
    return { success: true }
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed on Water profile` })
})
