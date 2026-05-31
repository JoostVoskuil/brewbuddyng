<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.hydrometerCorrection') }}</h1>
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">Measured Gravity (SG)</label
        ><input
          v-model.number="form.sg"
          type="number"
          step="0.001"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Sample Temperature (°C)</label
          ><input
            v-model.number="form.tempC"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Calibration Temperature (°C)</label
          ><input
            v-model.number="form.calibrationTempC"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        Calculate
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-1">
        <p class="text-lg font-semibold">Corrected SG: {{ result.corrected.toFixed(3) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  sg: 1.05,
  tempC: 30,
  calibrationTempC: 20,
})
const result = ref<{ corrected: number } | null>(null)

async function calculate() {
  const url: string = '/api/calculations/hydrometer-correction'
  result.value = await $fetch<{ corrected: number }>(url, {
    method: 'POST',
    body: form.value,
  })
}
</script>
