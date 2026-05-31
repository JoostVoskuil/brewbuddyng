<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.kettleVolume') }}</h1>
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">Vessel shape</label>
        <select v-model="form.mode" class="w-full mt-1 px-3 py-2 border rounded-md bg-background">
          <option value="cylinder">Straight cylinder (by diameter)</option>
          <option value="calibration">Linear calibration (L per cm)</option>
        </select>
      </div>

      <template v-if="form.mode === 'cylinder'">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium">Inner diameter (cm)</label>
            <input
              v-model.number="form.diameterCm"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Liquid height (cm)</label>
            <input
              v-model.number="form.heightCm"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Reverse: height for volume (L)</label>
            <input
              v-model.number="form.targetVolumeL"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium">Litres per cm</label>
            <input
              v-model.number="form.litersPerCm"
              type="number"
              step="0.01"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Dead-space offset (cm)</label>
            <input
              v-model.number="form.offsetCm"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Liquid height (cm)</label>
            <input
              v-model.number="form.heightCm"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
      </template>

      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        {{ $t('common.calculate') }}
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <div class="flex justify-between">
          <span>Volume:</span>
          <span class="font-mono font-semibold">{{ result.volumeL }} L</span>
        </div>
        <div v-if="result.litersPerCm != null" class="flex justify-between">
          <span>Litres per cm:</span>
          <span class="font-mono font-semibold">{{ result.litersPerCm }}</span>
        </div>
        <div v-if="result.heightForVolumeCm != null" class="flex justify-between">
          <span>Height for {{ form.targetVolumeL }} L:</span>
          <span class="font-mono font-semibold">{{ result.heightForVolumeCm }} cm</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  mode: 'cylinder',
  diameterCm: 35,
  heightCm: 20,
  targetVolumeL: undefined as number | undefined,
  litersPerCm: 0.7,
  offsetCm: 0,
})
const result = ref<Record<string, number | null> | null>(null)
async function calculate() {
  result.value = (await $fetch('/api/calculations/kettle-volume', {
    method: 'POST',
    body: form.value,
  })) as unknown as Record<string, number | null>
}
</script>
