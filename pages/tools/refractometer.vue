<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.refractometer') }}</h1>
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">OG Brix Reading</label
        ><input
          v-model.number="form.ogBrix"
          type="number"
          step="0.1"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">Current Brix Reading (leave empty for OG only)</label
        ><input
          v-model.number="form.currentBrix"
          type="number"
          step="0.1"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">Wort Correction Factor</label
        ><input
          v-model.number="form.wcf"
          type="number"
          step="0.01"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        Calculate
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <div class="flex justify-between">
          <span>OG:</span><span class="font-mono font-semibold">{{ result.og }}</span>
        </div>
        <div v-if="result.fg" class="flex justify-between">
          <span>FG:</span><span class="font-mono font-semibold">{{ result.fg }}</span>
        </div>
        <div v-if="result.abv" class="flex justify-between">
          <span>ABV:</span><span class="font-mono font-semibold">{{ result.abv }}%</span>
        </div>
        <div v-if="result.attenuation" class="flex justify-between">
          <span>Attenuation:</span
          ><span class="font-mono font-semibold">{{ result.attenuation }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({ ogBrix: 12, currentBrix: 6, wcf: 1.04 })
const result = ref<Record<string, number> | null>(null)
async function calculate() {
  result.value = (await $fetch('/api/calculations/refractometer', {
    method: 'POST',
    body: form.value,
  })) as unknown as Record<string, number>
}
</script>
