<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.boilTest') }}</h1>
    <p class="text-sm text-muted-foreground mb-4">{{ $t('tools.boilTestInfo') }}</p>
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">{{ $t('tools.sgBefore') }}</label>
        <input
          v-model.number="form.sgBefore"
          type="number"
          step="0.001"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('tools.sgAfter') }}</label>
        <input
          v-model.number="form.sgAfter"
          type="number"
          step="0.001"
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
          <span>{{ $t('tools.abv') }}:</span
          ><span class="font-mono font-semibold">{{ result.abv }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({ sgBefore: 1.012, sgAfter: 1.022 })
const result = ref<{ abv: number } | null>(null)
async function calculate() {
  result.value = await $fetch<{ abv: number }>('/api/calculations/boil-test', {
    method: 'POST',
    body: form.value,
  })
}
</script>
