import { eq } from 'drizzle-orm'
import { neuralNetworks } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { neuralNetworkUpdate } from '~/server/utils/validation'
import { toNetworkResponse } from '~/server/utils/nn/neural-api'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const body = await readValidatedBody(event, (value) => neuralNetworkUpdate.parse(value))
  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name
  if (body.notes !== undefined) update.notes = body.notes
  if (body.inputParams !== undefined) update.inputParams = JSON.stringify(body.inputParams)
  if (body.outputParams !== undefined) update.outputParams = JSON.stringify(body.outputParams)
  if (body.hiddenLayers !== undefined) update.hiddenLayers = JSON.stringify(body.hiddenLayers)
  const [updated] = await useDB().update(neuralNetworks).set(update).where(eq(neuralNetworks.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Neural network not found' })
  return toNetworkResponse(updated)
})
