<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.ogAfterFermentation') }}</h1>
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">{{ $t('tools.refractometerFg') }}</label>
        <input
          v-model.number="form.fg"
          type="number"
          step="0.001"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('tools.refractometerBrix') }}</label>
        <input
          v-model.number="form.brix"
          type="number"
          step="0.1"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('tools.brixFactor') }}</label>
        <input
          v-model.number="form.brixFactor"
          type="number"
          step="0.01"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        {{ $t('common.calculate') }}
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <div class="flex justify-between">
          <span>{{ $t('tools.originalGravity') }}:</span
          ><span class="font-mono font-semibold">{{ result.og }}</span>
        </div>
        <div class="flex justify-between">
          <span>{{ $t('tools.abv') }}:</span
          ><span class="font-mono font-semibold">{{ result.abv }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({ fg: 1.012, brix: 8, brixFactor: 1.03 })
const result = ref<{ og: number; abv: number } | null>(null)
async function calculate() {
  result.value = await $fetch<{ og: number; abv: number }>(
    '/api/calculations/og-after-fermentation',
    { method: 'POST', body: form.value },
  )
}
</script>
