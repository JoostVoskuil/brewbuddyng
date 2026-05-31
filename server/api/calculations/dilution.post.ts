import {
  dilutedGravity,
  concentratedGravity,
  waterToReachGravity,
  boilOffToReachGravity,
  sugarToReachGravity,
} from '~/server/utils/calculations/dilution'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sg = body.currentSG ?? 1.05
  const volumeL = body.currentVolumeL ?? 20

  const result: Record<string, number | null> = {
    dilutedSG: null,
    concentratedSG: null,
    waterToTargetL: null,
    boilOffToTargetL: null,
    sugarToTargetKg: null,
  }

  if (body.addWaterL != null) {
    result.dilutedSG = Number(dilutedGravity(sg, volumeL, body.addWaterL).toFixed(4))
  }
  if (body.boilOffL != null) {
    result.concentratedSG = Number(concentratedGravity(sg, volumeL, body.boilOffL).toFixed(4))
  }
  if (body.targetSG != null) {
    result.waterToTargetL = Number(waterToReachGravity(sg, volumeL, body.targetSG).toFixed(2))
    result.boilOffToTargetL = Number(boilOffToReachGravity(sg, volumeL, body.targetSG).toFixed(2))
    result.sugarToTargetKg = Number(
      sugarToReachGravity(sg, volumeL, body.targetSG, body.sugarYield ?? 100).toFixed(3),
    )
  }

  return result
})
