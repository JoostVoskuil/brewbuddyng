<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.sgPlatoBrix') }}</h1>
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">{{ $t('tools.wortMeasurement') }}</label>
        <div class="flex gap-2 mt-1">
          <input
            v-model.number="form.value"
            type="number"
            step="0.001"
            class="flex-1 px-3 py-2 border rounded-md bg-background"
          />
          <select v-model="form.unit" class="px-3 py-2 border rounded-md bg-background">
            <option value="sg">SG</option>
            <option value="plato">°Plato</option>
            <option value="brix">°Brix</option>
          </select>
        </div>
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('tools.beerBrix') }}</label>
        <input
          v-model="form.beerBrix"
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
        <h2 class="font-semibold">{{ $t('tools.wort') }}</h2>
        <div class="flex justify-between">
          <span>SG:</span><span class="font-mono font-semibold">{{ result.wort.sg }}</span>
        </div>
        <div class="flex justify-between">
          <span>°Plato:</span><span class="font-mono font-semibold">{{ result.wort.plato }}</span>
        </div>
        <div class="flex justify-between">
          <span>°Brix:</span><span class="font-mono font-semibold">{{ result.wort.brix }}</span>
        </div>
        <template v-if="result.beer">
          <h2 class="font-semibold pt-2">{{ $t('tools.beer') }}</h2>
          <div class="flex justify-between">
            <span>FG:</span><span class="font-mono font-semibold">{{ result.beer.fg }}</span>
          </div>
          <div class="flex justify-between">
            <span>°Plato:</span><span class="font-mono font-semibold">{{ result.beer.plato }}</span>
          </div>
          <div class="flex justify-between">
            <span>ABV:</span><span class="font-mono font-semibold">{{ result.beer.abv }}%</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('tools.attenuation') }}:</span
            ><span class="font-mono font-semibold">{{ result.beer.attenuation }}%</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ConvResult {
  wort: { sg: number; plato: number; brix: number }
  beer: { fg: number; plato: number; brix: number; abv: number; attenuation: number } | null
}
const form = ref({ value: 1.05, unit: 'sg' as 'sg' | 'plato' | 'brix', beerBrix: '', brixFactor: 1.03 })
const result = ref<ConvResult | null>(null)
async function calculate() {
  result.value = await $fetch<ConvResult>('/api/calculations/sg-plato-brix', {
    method: 'POST',
    body: form.value,
  })
}
</script>
