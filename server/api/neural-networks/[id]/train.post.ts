import { eq } from 'drizzle-orm'
import { neuralNetworks, neuralNetworkSamples } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { neuralNetworkTrainRequest } from '~/server/utils/validation'
import { serializeNetwork } from '~/server/utils/calculations/neural'
import { trainStoredNetwork } from '~/server/utils/nn/neural-api'

function parseId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'Invalid id' })
  return id
}

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const options = await readValidatedBody(event, (value) => neuralNetworkTrainRequest.parse(value ?? {}))
  const db = useDB()
  const network = await db.select().from(neuralNetworks).where(eq(neuralNetworks.id, id)).get()
  if (!network) throw createError({ statusCode: 404, message: 'Neural network not found' })
  const samples = await db
    .select()
    .from(neuralNetworkSamples)
    .where(eq(neuralNetworkSamples.networkId, id))
    .all()
  const trainingRows = samples.filter((sample) => sample.useForTraining !== false)
  if (!trainingRows.length) throw createError({ statusCode: 400, message: 'No training samples' })

  const history: Array<{ epoch: number, rmse: number }> = []
  const result = trainStoredNetwork(network, trainingRows, {
    ...options,
    maxEpochs: Math.min(options.maxEpochs, 20000),
    onEpoch: options.collectHistory
      ? (epoch, rmse) => {
          if (epoch === 1 || epoch % 25 === 0 || rmse <= options.targetRmse) history.push({ epoch, rmse })
        }
      : undefined,
  })
  const trainedAt = new Date().toISOString()
  await db
    .update(neuralNetworks)
    .set({
      weights: serializeNetwork(result.network),
      trainedAt,
      rounds: (network.rounds ?? 0) + result.epochs,
      finalError: result.rmse,
    })
    .where(eq(neuralNetworks.id, id))
  return { rmse: result.rmse, epochs: result.epochs, trainedAt, history }
})
