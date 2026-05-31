import {
  cylinderVolumeLiters,
  cylinderHeightForVolume,
  litersPerCm,
  volumeFromCalibration,
} from '~/server/utils/calculations/kettle'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.mode === 'calibration') {
    return {
      volumeL: Number(
        volumeFromCalibration(
          body.heightCm ?? 0,
          body.litersPerCm ?? 0,
          body.offsetCm ?? 0,
        ).toFixed(2),
      ),
    }
  }

  const diameterCm = body.diameterCm ?? 0
  return {
    volumeL: Number(cylinderVolumeLiters(diameterCm, body.heightCm ?? 0).toFixed(2)),
    litersPerCm: Number(litersPerCm(diameterCm).toFixed(3)),
    heightForVolumeCm:
      body.targetVolumeL != null
        ? Number(cylinderHeightForVolume(diameterCm, body.targetVolumeL).toFixed(1))
        : null,
  }
})
