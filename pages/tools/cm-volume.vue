<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl font-bold mb-2">{{ $t('tools.cmVolume.title') }}</h1>
    <p class="text-sm text-muted-foreground mb-6">{{ $t('tools.cmVolume.subtitle') }}</p>

    <div class="grid gap-6 lg:grid-cols-[1fr_220px]">
      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-medium">{{ $t('tools.cmVolume.equipment') }}</label>
            <select
              v-model.number="selectedEquipmentId"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="">{{ $t('tools.cmVolume.noEquipment') }}</option>
              <option v-for="item in equipment" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('tools.cmVolume.vessel') }}</label>
            <select
              v-model="vesselType"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="mashTun">{{ $t('tools.cmVolume.mashTun') }}</option>
              <option value="kettle">{{ $t('tools.cmVolume.kettle') }}</option>
              <option value="fermenter">{{ $t('tools.cmVolume.fermenter') }}</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-medium">{{ $t('tools.cmVolume.heightCm') }}</label>
            <input
              v-model.number="heightCm"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('tools.cmVolume.diameterCm') }}</label>
            <input
              v-model.number="diameterCm"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-medium">{{ $t('tools.cmVolume.cmUnderRim') }}</label>
            <div class="flex mt-1">
              <input
                :value="cmUnderRimInput"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 border rounded-l-md bg-background"
                @input="updateCmUnderRim"
              />
              <span class="px-3 py-2 border border-l-0 rounded-r-md bg-muted text-sm">cm</span>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('tools.cmVolume.volumeL') }}</label>
            <div class="flex mt-1">
              <input
                :value="volumeInput"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 border rounded-l-md bg-background"
                @input="updateVolume"
              />
              <span class="px-3 py-2 border border-l-0 rounded-r-md bg-muted text-sm">L</span>
            </div>
          </div>
        </div>

        <div class="border rounded-lg p-4 bg-muted/30 space-y-2">
          <div class="flex justify-between gap-4">
            <span>{{ $t('tools.cmVolume.fillHeight') }}</span>
            <span class="font-mono font-semibold">{{ fillHeightCm.toFixed(2) }} cm</span>
          </div>
          <div class="flex justify-between gap-4">
            <span>{{ $t('tools.cmVolume.litersPerCm') }}</span>
            <span class="font-mono font-semibold">{{ litersPerCmValue.toFixed(3) }} L/cm</span>
          </div>
          <p class="text-xs text-muted-foreground">{{ $t('tools.cmVolume.geometryNote') }}</p>
        </div>
      </div>

      <div class="border rounded-lg p-4 bg-card">
        <svg viewBox="0 0 120 240" class="w-full h-64" role="img" aria-labelledby="cm-volume-title">
          <title id="cm-volume-title">{{ $t('tools.cmVolume.illustration') }}</title>
          <ellipse cx="60" cy="24" rx="42" ry="14" fill="none" stroke="currentColor" />
          <path d="M18 24 v180 M102 24 v180" fill="none" stroke="currentColor" />
          <ellipse cx="60" cy="204" rx="42" ry="14" fill="none" stroke="currentColor" />
          <rect
            x="18"
            :y="fillY"
            width="84"
            :height="204 - fillY"
            fill="currentColor"
            opacity="0.18"
          />
          <ellipse cx="60" :cy="fillY" rx="42" ry="14" fill="currentColor" opacity="0.28" />
          <line x1="10" x2="110" y1="24" y2="24" stroke="currentColor" stroke-dasharray="4 3" />
          <line
            x1="10"
            x2="110"
            :y1="fillY"
            :y2="fillY"
            stroke="currentColor"
            stroke-dasharray="4 3"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  cmUnderRimForVolume,
  cylinderHeightForVolume,
  litersPerCm,
  volumeFromCmUnderRim,
} from '~/server/utils/calculations/kettle'

interface Equipment {
  id: number
  name: string
  tunVolume?: number | null
  kettleVolume?: number | null
  batchSize?: number | null
  boilSize?: number | null
}

type VesselType = 'mashTun' | 'kettle' | 'fermenter'

const { data: equipmentData } = await useFetch<Equipment[]>('/api/equipment', { default: () => [] })
const equipment = computed(() => equipmentData.value ?? [])

const selectedEquipmentId = ref<number | ''>('')
const vesselType = ref<VesselType>('kettle')
const heightCm = ref(45)
const diameterCm = ref(40)
const cmUnderRim = ref(10)
const volumeL = ref(volumeFromCmUnderRim(heightCm.value, diameterCm.value, cmUnderRim.value))
const activeInput = ref<'cm' | 'volume'>('cm')

const selectedEquipment = computed(() =>
  equipment.value.find((item) => item.id === selectedEquipmentId.value),
)
const litersPerCmValue = computed(() => litersPerCm(Number(diameterCm.value) || 0))
const fillHeightCm = computed(() =>
  activeInput.value === 'volume'
    ? cylinderHeightForVolume(Number(diameterCm.value) || 0, Number(volumeL.value) || 0)
    : Math.max(0, (Number(heightCm.value) || 0) - (Number(cmUnderRim.value) || 0)),
)
const fillY = computed(() => {
  const height = Number(heightCm.value) || 1
  const fraction = Math.min(1, Math.max(0, fillHeightCm.value / height))
  return 204 - fraction * 180
})
const cmUnderRimInput = computed(() => Number(cmUnderRim.value.toFixed(2)))
const volumeInput = computed(() => Number(volumeL.value.toFixed(2)))

watch([heightCm, diameterCm], () => recalculateActive())
watch([selectedEquipment, vesselType], () => applyDefaultGeometry())

function updateCmUnderRim(event: Event) {
  activeInput.value = 'cm'
  cmUnderRim.value = Number((event.target as HTMLInputElement).value) || 0
  volumeL.value = volumeFromCmUnderRim(heightCm.value, diameterCm.value, cmUnderRim.value)
}

function updateVolume(event: Event) {
  activeInput.value = 'volume'
  volumeL.value = Number((event.target as HTMLInputElement).value) || 0
  cmUnderRim.value = cmUnderRimForVolume(heightCm.value, diameterCm.value, volumeL.value)
}

function recalculateActive() {
  if (activeInput.value === 'volume') {
    cmUnderRim.value = cmUnderRimForVolume(heightCm.value, diameterCm.value, volumeL.value)
  } else {
    volumeL.value = volumeFromCmUnderRim(heightCm.value, diameterCm.value, cmUnderRim.value)
  }
}

function applyDefaultGeometry() {
  const defaults: Record<VesselType, { diameter: number; height: number; volume?: number | null }> =
    {
      mashTun: { diameter: 35, height: 45, volume: selectedEquipment.value?.tunVolume },
      kettle: {
        diameter: 40,
        height: 45,
        volume: selectedEquipment.value?.kettleVolume ?? selectedEquipment.value?.boilSize,
      },
      fermenter: { diameter: 35, height: 55, volume: selectedEquipment.value?.batchSize },
    }
  const next = defaults[vesselType.value]
  diameterCm.value = next.diameter
  heightCm.value = next.volume
    ? Math.max(next.height, cylinderHeightForVolume(next.diameter, next.volume))
    : next.height
  recalculateActive()
}
</script>
