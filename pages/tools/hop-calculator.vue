<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.hopCalculator') }}</h1>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">OG</label
          ><input
            v-model.number="form.og"
            type="number"
            step="0.001"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Batch Size (L)</label
          ><input
            v-model.number="form.batchSize"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium">Alpha %</label
          ><input
            v-model.number="form.alpha"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Time (min)</label
          ><input
            v-model.number="form.time"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Target IBU</label
          ><input
            v-model.number="form.targetIBU"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium">Method</label>
        <select v-model="form.method" class="w-full mt-1 px-3 py-2 border rounded-md bg-background">
          <option value="tinseth">Tinseth</option>
          <option value="rager">Rager</option>
          <option value="garetz">Garetz</option>
          <option value="daniels">Daniels</option>
          <option value="mosher">Mosher</option>
          <option value="noonan">Noonan</option>
        </select>
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        Calculate
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30">
        <p class="text-lg font-semibold">{{ result.amount?.toFixed(1) }} g hops needed</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  og: 1.05,
  batchSize: 20,
  alpha: 5.5,
  time: 60,
  targetIBU: 35,
  method: 'tinseth',
})
const result = ref<Record<string, number> | null>(null)

async function calculate() {
  result.value = (await $fetch('/api/calculations/hop-wizard', {
    method: 'POST',
    body: {
      ...form.value,
      mode: 'amount',
      use: 'boil',
      form: 'pellet',
      boilSize: form.value.batchSize * 1.1,
    },
  })) as unknown as Record<string, number>
}
</script>
