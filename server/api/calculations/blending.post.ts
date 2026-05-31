import {
  blendGravity,
  totalBlendVolume,
  type BlendPart,
} from '~/server/utils/calculations/blending'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parts: BlendPart[] = Array.isArray(body.parts) ? body.parts : []
  return {
    blendedSG: Number(blendGravity(parts).toFixed(4)),
    totalVolumeL: Number(totalBlendVolume(parts).toFixed(2)),
  }
})
