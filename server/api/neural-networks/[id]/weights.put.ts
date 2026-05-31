import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { neuralNetworks } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { deserializeNetwork, serializeNetwork } from '~/server/utils/calculations/neural'
import { toNetworkResponse } from '~/server/utils/nn/neural-api'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

const payloadSchema = z.object({
  name: z.string().optional(),
  inputParamsList: z.array(z.string()).optional(),
  outputParamsList: z.array(z.string()).optional(),
  hiddenLayersList: z.array(z.number().int().positive()).optional(),
  weights: z.string().nullable().optional(),
  network: z.unknown().optional(),
})

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const raw = await readBody(event)
  const body = payloadSchema.parse(raw)
  const serialized = body.weights ?? JSON.stringify(body.network ?? raw)
  const network = deserializeNetwork(serialized)
  const [updated] = await useDB()
    .update(neuralNetworks)
    .set({
      ...(body.name ? { name: body.name } : {}),
      inputParams: JSON.stringify(
        body.inputParamsList ??
          Array.from({ length: network.inputSize }, (_, i) => `input${i + 1}`),
      ),
      outputParams: JSON.stringify(
        body.outputParamsList ??
          Array.from({ length: network.outputSize }, (_, i) => `output${i + 1}`),
      ),
      hiddenLayers: JSON.stringify(body.hiddenLayersList ?? network.hiddenLayers),
      weights: serializeNetwork(network),
      finalError: Number.isFinite(network.rmse) ? network.rmse : null,
      trainedAt: network.trained ? new Date().toISOString() : null,
    })
    .where(eq(neuralNetworks.id, id))
    .returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Neural network not found' })
  return toNetworkResponse(updated)
})
