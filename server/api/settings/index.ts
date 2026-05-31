import { useDB } from '~/server/db'
import { settings } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const method = getMethod(event)

  if (method === 'GET') {
    const rows = await db.select().from(settings).all()
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(settings)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } })
    }
    return { success: true }
  }
})
