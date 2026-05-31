<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.dilution') }}</h1>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Current SG</label>
          <input
            v-model.number="form.currentSG"
            type="number"
            step="0.001"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Current volume (L)</label>
          <input
            v-model.number="form.currentVolumeL"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Add water (L)</label>
          <input
            v-model.number="form.addWaterL"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Boil off (L)</label>
          <input
            v-model.number="form.boilOffL"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Target SG</label>
          <input
            v-model.number="form.targetSG"
            type="number"
            step="0.001"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Sugar yield %</label>
          <input
            v-model.number="form.sugarYield"
            type="number"
            step="1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        {{ $t('common.calculate') }}
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <div v-if="result.dilutedSG != null" class="flex justify-between">
          <span>SG after adding water:</span>
          <span class="font-mono font-semibold">{{ result.dilutedSG }}</span>
        </div>
        <div v-if="result.concentratedSG != null" class="flex justify-between">
          <span>SG after boil-off:</span>
          <span class="font-mono font-semibold">{{ result.concentratedSG }}</span>
        </div>
        <div v-if="result.waterToTargetL != null" class="flex justify-between">
          <span>Water to reach target:</span>
          <span class="font-mono font-semibold">{{ result.waterToTargetL }} L</span>
        </div>
        <div v-if="result.boilOffToTargetL != null" class="flex justify-between">
          <span>Boil-off to reach target:</span>
          <span class="font-mono font-semibold">{{ result.boilOffToTargetL }} L</span>
        </div>
        <div v-if="result.sugarToTargetKg != null" class="flex justify-between">
          <span>Sugar to reach target:</span>
          <span class="font-mono font-semibold">{{ result.sugarToTargetKg }} kg</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  currentSG: 1.05,
  currentVolumeL: 20,
  addWaterL: undefined as number | undefined,
  boilOffL: undefined as number | undefined,
  targetSG: undefined as number | undefined,
  sugarYield: 100,
})
const result = ref<Record<string, number | null> | null>(null)
async function calculate() {
  result.value = (await $fetch('/api/calculations/dilution', {
    method: 'POST',
    body: form.value,
  })) as unknown as Record<string, number | null>
}
</script>
