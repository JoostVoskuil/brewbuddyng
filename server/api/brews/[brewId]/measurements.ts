import { useDB } from '~/server/db'
import { brewMeasurements } from '~/server/db/schema'
import { brewMeasurementCreate } from '~/server/utils/validation'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const brewId = Number(getRouterParam(event, 'brewId'))
  if (!Number.isInteger(brewId) || brewId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid brew id' })
  }
  const method = getMethod(event)

  if (method === 'GET') {
    return await db.select().from(brewMeasurements).where(eq(brewMeasurements.brewId, brewId)).all()
  }

  if (method === 'POST') {
    const body = await readValidatedBody(event, (b) => brewMeasurementCreate.parse(b))
    const [created] = await db
      .insert(brewMeasurements)
      .values({ ...body, brewId, datetime: body.datetime || new Date().toISOString() })
      .returning()
    setResponseStatus(event, 201)
    return created
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed` })
})
