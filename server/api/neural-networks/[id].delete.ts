import { eq } from 'drizzle-orm'
import { neuralNetworks } from '~/server/db/schema'
import { useDB } from '~/server/db'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  await useDB().delete(neuralNetworks).where(eq(neuralNetworks.id, id))
  return { ok: true }
})
