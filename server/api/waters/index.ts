import { waters } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { waterInsert } from '~/server/utils/validation'
import { eq, ne } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const method = getMethod(event)

  if (method === 'GET') {
    return await db.select().from(waters).all()
  }

  if (method === 'POST') {
    const body = await readValidatedBody(event, (b) => waterInsert.parse(b))
    const created = await db.transaction((tx) => {
      const shouldBeDefault = body.isDefault === true
      const row = tx
        .insert(waters)
        .values(shouldBeDefault ? { ...body, isDefault: false } : body)
        .returning()
        .get()

      if (shouldBeDefault) {
        tx.update(waters).set({ isDefault: false }).where(ne(waters.id, row.id)).run()
        return tx.update(waters).set({ isDefault: true }).where(eq(waters.id, row.id)).returning().get()
      }

      return row
    })

    setResponseStatus(event, 201)
    return created
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed on Water` })
})
