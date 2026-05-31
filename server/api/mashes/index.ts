import { useDB } from '~/server/db'
import { mashProfiles, mashSteps } from '~/server/db/schema'
import { mashProfileCreate } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const method = getMethod(event)

  if (method === 'GET') {
    return await db.select().from(mashProfiles).all()
  }

  if (method === 'POST') {
    const body = await readValidatedBody(event, (b) => mashProfileCreate.parse(b))
    const { steps, ...profileData } = body

    const [created] = await db.insert(mashProfiles).values(profileData).returning()
    if (!created) throw createError({ statusCode: 500, message: 'Failed to create mash profile' })

    if (steps && steps.length) {
      await db
        .insert(mashSteps)
        .values(steps.map((step) => ({ ...step, mashProfileId: created.id })) as never)
    }

    setResponseStatus(event, 201)
    return created
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed` })
})
