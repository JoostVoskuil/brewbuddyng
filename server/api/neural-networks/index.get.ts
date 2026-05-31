import { neuralNetworks, neuralNetworkSamples } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { toNetworkResponse } from '~/server/utils/nn/neural-api'

export default defineEventHandler(async () => {
  const db = useDB()
  const rows = await db.select().from(neuralNetworks).all()
  const samples = await db.select().from(neuralNetworkSamples).all()
  const counts = new Map<number, number>()
  for (const sample of samples)
    counts.set(sample.networkId, (counts.get(sample.networkId) ?? 0) + 1)
  return rows.map((row) => toNetworkResponse(row, counts.get(row.id) ?? 0))
})
