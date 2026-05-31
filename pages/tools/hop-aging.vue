<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.hopAging') }}</h1>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Alpha acid % (fresh)</label>
          <input
            v-model.number="form.alpha"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Storage time (days)</label>
          <input
            v-model.number="form.days"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium">Storage condition</label>
        <select
          v-model.number="form.storageFactor"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        >
          <option :value="0.25">Frozen, oxygen-barrier (0.25)</option>
          <option :value="0.5">Cold / fridge (0.5)</option>
          <option :value="1">Room temperature, sealed (1.0)</option>
          <option :value="1.5">Warm or exposed to air (1.5)</option>
        </select>
      </div>
      <div>
        <label class="text-sm font-medium">% alpha lost in 6 months (variety stability)</label>
        <input
          v-model.number="form.percentLostSixMonths"
          type="number"
          step="1"
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
          <span>Aged alpha acid:</span>
          <span class="font-mono font-semibold">{{ result.agedAlpha }}%</span>
        </div>
        <div class="flex justify-between">
          <span>Alpha lost:</span>
          <span class="font-mono font-semibold">{{ result.percentLost }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({ alpha: 6, days: 180, storageFactor: 1, percentLostSixMonths: 35 })
const result = ref<Record<string, number> | null>(null)
async function calculate() {
  result.value = (await $fetch('/api/calculations/hop-aging', {
    method: 'POST',
    body: form.value,
  })) as unknown as Record<string, number>
}
</script>
