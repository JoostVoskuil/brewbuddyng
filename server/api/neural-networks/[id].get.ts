import { eq } from 'drizzle-orm'
import { neuralNetworks, neuralNetworkSamples } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { toNetworkResponse } from '~/server/utils/nn/neural-api'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const db = useDB()
  const row = await db.select().from(neuralNetworks).where(eq(neuralNetworks.id, id)).get()
  if (!row) throw createError({ statusCode: 404, message: 'Neural network not found' })
  const samples = await db
    .select()
    .from(neuralNetworkSamples)
    .where(eq(neuralNetworkSamples.networkId, id))
    .all()
  return { ...toNetworkResponse(row, samples.length), samples }
})
