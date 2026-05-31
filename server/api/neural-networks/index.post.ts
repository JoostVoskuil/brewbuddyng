import { neuralNetworks } from '~/server/db/schema'
import { useDB } from '~/server/db'
import { neuralNetworkCreate } from '~/server/utils/validation'
import {
  createNeuralNetwork,
  serializeNetwork,
  type ActivationName,
} from '~/server/utils/calculations/neural'
import { toNetworkResponse } from '~/server/utils/nn/neural-api'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (value) => neuralNetworkCreate.parse(value))
  const inputSize = body.inputSize ?? body.inputParams?.length ?? 0
  const outputSize = body.outputSize ?? body.outputParams?.length ?? 0
  const inputParams =
    body.inputParams ?? Array.from({ length: inputSize }, (_, i) => `input${i + 1}`)
  const outputParams =
    body.outputParams ?? Array.from({ length: outputSize }, (_, i) => `output${i + 1}`)
  const hiddenLayers = body.hiddenLayers ?? [Math.max(1, Math.round((inputSize + outputSize) / 2))]
  const activation = (body.activation ?? 'sigmoid') as ActivationName
  const network = createNeuralNetwork({ inputSize, hiddenLayers, outputSize, activation })

  const [created] = await useDB()
    .insert(neuralNetworks)
    .values({
      name: body.name,
      equipmentId: body.equipmentId,
      inputParams: JSON.stringify(inputParams),
      outputParams: JSON.stringify(outputParams),
      hiddenLayers: JSON.stringify(hiddenLayers),
      weights: serializeNetwork(network),
      notes: body.notes,
    })
    .returning()

  setResponseStatus(event, 201)
  return toNetworkResponse(created!, 0)
})
