import { eq } from 'drizzle-orm'
import { neuralNetworks, neuralNetworkSamples } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { toNetworkResponse } from '~/server/utils/nn/neural-api'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const db = useDB()
  const source = await db.select().from(neuralNetworks).where(eq(neuralNetworks.id, id)).get()
  if (!source) throw createError({ statusCode: 404, message: 'Neural network not found' })
  const [created] = await db
    .insert(neuralNetworks)
    .values({
      name: `${source.name} copy`,
      equipmentId: source.equipmentId,
      inputParams: source.inputParams,
      outputParams: source.outputParams,
      hiddenLayers: source.hiddenLayers,
      weights: source.weights,
      trainedAt: source.trainedAt,
      rounds: source.rounds,
      finalError: source.finalError,
      notes: source.notes,
    })
    .returning()
  const samples = await db.select().from(neuralNetworkSamples).where(eq(neuralNetworkSamples.networkId, id)).all()
  if (created && samples.length) {
    await db.insert(neuralNetworkSamples).values(samples.map((sample) => ({
      networkId: created.id,
      brewId: sample.brewId,
      inputs: sample.inputs,
      outputs: sample.outputs,
      useForTraining: sample.useForTraining,
      createdAt: new Date().toISOString(),
    })))
  }
  setResponseStatus(event, 201)
  return toNetworkResponse(created!, samples.length)
})
