import { eq } from 'drizzle-orm'
import { neuralNetworks, neuralNetworkSamples } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { neuralNetworkSamplesAdd } from '~/server/utils/validation'
import { toNetworkResponse } from '~/server/utils/nn/neural-api'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const db = useDB()
  const network = await db.select().from(neuralNetworks).where(eq(neuralNetworks.id, id)).get()
  if (!network) throw createError({ statusCode: 404, message: 'Neural network not found' })
  const raw = await readBody(event)
  const body = neuralNetworkSamplesAdd.parse(Array.isArray(raw) ? { samples: raw } : raw)
  const meta = toNetworkResponse(network)
  for (const sample of body.samples) {
    if (sample.inputs.length !== meta.inputSize || sample.outputs.length !== meta.outputSize) {
      throw createError({ statusCode: 400, message: 'Sample dimensions do not match network' })
    }
  }

  const rows = body.samples.map((sample) => ({
    networkId: id,
    brewId: sample.brewId,
    inputs: JSON.stringify(sample.inputs),
    outputs: JSON.stringify(sample.outputs),
    useForTraining: sample.useForTraining ?? true,
    createdAt: new Date().toISOString(),
  }))
  const created = await db.insert(neuralNetworkSamples).values(rows).returning()
  setResponseStatus(event, 201)
  return created
})
