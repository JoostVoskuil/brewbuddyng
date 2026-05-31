import { starterSize, viableCells, requiredCells } from '~/server/utils/calculations/yeast'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const required = requiredCells(body.og || 1.05, body.batchSizeL || 20, body.isLager || false)
  const available = viableCells(
    body.initialCellsBillion || 100,
    body.daysOld || 30,
    body.form || 'liquid',
  )

  const steps = starterSize(
    required,
    available,
    body.starterOG || 1.036,
    body.useStirPlate ?? true,
    body.maxSteps || 3,
  )

  return {
    requiredCells: Math.round(required),
    availableCells: Math.round(available),
    deficit: Math.round(Math.max(0, required - available)),
    steps,
  }
})
