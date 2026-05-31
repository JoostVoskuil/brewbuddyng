<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.carbonation') }}</h1>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Target CO₂ Volumes</label
          ><input
            v-model.number="form.volumesCO2"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Temperature (°C)</label
          ><input
            v-model.number="form.tempC"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium">Mode</label>
        <select v-model="form.mode" class="w-full mt-1 px-3 py-2 border rounded-md bg-background">
          <option value="forced">Forced Carbonation (Keg)</option>
          <option value="priming">Priming Sugar (Bottle)</option>
        </select>
      </div>
      <div v-if="form.mode === 'priming'" class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Beer Volume (L)</label
          ><input
            v-model.number="form.beerVolumeL"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Sugar Type</label>
          <select
            v-model="form.sugarType"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          >
            <option value="sucrose">Sucrose (Table sugar)</option>
            <option value="glucose">Glucose (Corn sugar)</option>
            <option value="honey">Honey</option>
            <option value="dme">DME</option>
          </select>
        </div>
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        Calculate
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-1">
        <p v-if="result.psi" class="text-lg font-semibold">
          {{ result.psi }} PSI / {{ result.bar }} bar
        </p>
        <p v-if="result.sugarGrams" class="text-lg font-semibold">
          {{ result.sugarGrams }} g total sugar
        </p>
        <p v-if="result.sugarPerBottle" class="text-sm text-muted-foreground">
          ~{{ result.sugarPerBottle }} g per 330ml bottle
        </p>
        <p class="text-sm text-muted-foreground">
          Dissolved CO₂ at {{ form.tempC }}°C: {{ result.dissolved }} vol
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  volumesCO2: 2.4,
  tempC: 4,
  mode: 'forced',
  beerVolumeL: 20,
  sugarType: 'sucrose',
})
const result = ref<Record<string, number> | null>(null)

async function calculate() {
  result.value = (await $fetch('/api/calculations/carbonation', {
    method: 'POST',
    body: form.value,
  })) as unknown as Record<string, number>
}
</script>
