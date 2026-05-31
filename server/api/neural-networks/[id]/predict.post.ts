import { eq } from 'drizzle-orm'
import { neuralNetworks } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { neuralNetworkPredictRequest } from '~/server/utils/validation'
import { predictStoredNetwork, toNetworkResponse } from '~/server/utils/nn/neural-api'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const body = await readValidatedBody(event, (value) => neuralNetworkPredictRequest.parse(value))
  const network = await useDB().select().from(neuralNetworks).where(eq(neuralNetworks.id, id)).get()
  if (!network) throw createError({ statusCode: 404, message: 'Neural network not found' })
  if (!network.weights) throw createError({ statusCode: 400, message: 'Network has no weights' })
  const meta = toNetworkResponse(network)
  if (body.inputs.length !== meta.inputSize) {
    throw createError({ statusCode: 400, message: 'Input dimensions do not match network' })
  }
  return { outputs: predictStoredNetwork(network, body.inputs) }
})
