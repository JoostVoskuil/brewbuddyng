<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.mashPh') }}</h1>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Calcium Ca²⁺ (mg/L)</label>
          <input
            v-model.number="form.calcium"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Magnesium Mg²⁺ (mg/L)</label>
          <input
            v-model.number="form.magnesium"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Bicarbonate HCO₃⁻ (mg/L)</label>
          <input
            v-model.number="form.bicarbonate"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Grain colour (EBC, avg)</label>
          <input
            v-model.number="form.grainColorEBC"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Mash volume (L)</label>
          <input
            v-model.number="form.volumeL"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Target pH</label>
          <input
            v-model.number="form.targetPH"
            type="number"
            step="0.05"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium">Acid</label>
        <select v-model="form.acid" class="w-full mt-1 px-3 py-2 border rounded-md bg-background">
          <option value="lactic88">Lactic acid 88%</option>
          <option value="phosphoric10">Phosphoric acid 10%</option>
          <option value="phosphoric85">Phosphoric acid 85%</option>
        </select>
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        {{ $t('common.calculate') }}
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <div class="flex justify-between">
          <span>Estimated mash pH:</span>
          <span class="font-mono font-semibold">{{ result.currentPH }}</span>
        </div>
        <div v-if="(result.acidMl ?? 0) > 0" class="flex justify-between">
          <span>Acid to add:</span>
          <span class="font-mono font-semibold">{{ result.acidMl }} mL</span>
        </div>
        <div v-if="(result.bakingSodaGrams ?? 0) > 0" class="flex justify-between">
          <span>Baking soda to add:</span>
          <span class="font-mono font-semibold">{{ result.bakingSodaGrams }} g</span>
        </div>
        <p class="text-xs text-muted-foreground pt-1">
          Estimate based on residual alkalinity. Always confirm with a pH meter.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  calcium: 50,
  magnesium: 10,
  bicarbonate: 150,
  grainColorEBC: 10,
  volumeL: 30,
  targetPH: 5.4,
  acid: 'lactic88',
})
const result = ref<Record<string, number> | null>(null)
async function calculate() {
  result.value = (await $fetch('/api/calculations/mash-ph', {
    method: 'POST',
    body: form.value,
  })) as unknown as Record<string, number>
}
</script>
