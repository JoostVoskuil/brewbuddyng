import { useDB } from '~/server/db'
import { mashProfiles, mashSteps } from '~/server/db/schema'
import { mashProfileUpdate } from '~/server/utils/validation'
import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }
  const method = getMethod(event)

  if (method === 'GET') {
    const profile = await db.select().from(mashProfiles).where(eq(mashProfiles.id, id)).get()
    if (!profile) throw createError({ statusCode: 404, message: 'Mash profile not found' })

    const steps = await db
      .select()
      .from(mashSteps)
      .where(eq(mashSteps.mashProfileId, id))
      .orderBy(asc(mashSteps.sortOrder))
      .all()

    return { ...profile, steps }
  }

  if (method === 'PUT') {
    const body = await readValidatedBody(event, (b) => mashProfileUpdate.parse(b))
    const { steps, ...profileData } = body

    const [updated] = await db
      .update(mashProfiles)
      .set(profileData)
      .where(eq(mashProfiles.id, id))
      .returning()
    if (!updated) throw createError({ statusCode: 404, message: 'Mash profile not found' })

    // Replace the step list wholesale when provided. Steps never carry their
    // own id/mashProfileId — those are owned by the server.
    if (steps !== undefined) {
      await db.delete(mashSteps).where(eq(mashSteps.mashProfileId, id))
      if (steps.length) {
        await db
          .insert(mashSteps)
          .values(steps.map((step) => ({ ...step, mashProfileId: id })) as never)
      }
    }

    return updated
  }

  if (method === 'DELETE') {
    const [deleted] = await db.delete(mashProfiles).where(eq(mashProfiles.id, id)).returning()
    if (!deleted) throw createError({ statusCode: 404, message: 'Mash profile not found' })
    return { success: true }
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed` })
})
