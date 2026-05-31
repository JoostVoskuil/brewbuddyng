<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.blending') }}</h1>
    <div class="space-y-4">
      <table class="w-full text-sm border rounded-lg overflow-hidden">
        <thead class="bg-muted">
          <tr>
            <th class="text-left p-2">#</th>
            <th class="text-right p-2">SG</th>
            <th class="text-right p-2">Volume (L)</th>
            <th class="p-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in parts" :key="i" class="border-t">
            <td class="p-2">{{ i + 1 }}</td>
            <td class="p-2 text-right">
              <input
                v-model.number="p.sg"
                type="number"
                step="0.001"
                class="w-24 px-2 py-1 border rounded bg-background text-right"
              />
            </td>
            <td class="p-2 text-right">
              <input
                v-model.number="p.volume"
                type="number"
                step="0.1"
                class="w-24 px-2 py-1 border rounded bg-background text-right"
              />
            </td>
            <td class="p-2 text-right">
              <button v-if="parts.length > 2" class="text-destructive" @click="parts.splice(i, 1)">
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 border rounded-md text-sm"
          @click="parts.push({ sg: 1.05, volume: 10 })"
        >
          {{ $t('common.add') }}
        </button>
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          @click="calculate"
        >
          {{ $t('common.calculate') }}
        </button>
      </div>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <div class="flex justify-between">
          <span>Blended SG:</span>
          <span class="font-mono font-semibold">{{ result.blendedSG }}</span>
        </div>
        <div class="flex justify-between">
          <span>{{ $t('common.total') }} volume:</span>
          <span class="font-mono font-semibold">{{ result.totalVolumeL }} L</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const parts = ref([
  { sg: 1.04, volume: 10 },
  { sg: 1.06, volume: 10 },
])
const result = ref<Record<string, number> | null>(null)
async function calculate() {
  result.value = (await $fetch('/api/calculations/blending', {
    method: 'POST',
    body: { parts: parts.value },
  })) as unknown as Record<string, number>
}
</script>
