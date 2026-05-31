<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.yeastStarter') }}</h1>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">OG of beer</label
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
            v-model.number="form.batchSizeL"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Initial Cells (billion)</label
          ><input
            v-model.number="form.initialCellsBillion"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Days Old</label
          ><input
            v-model.number="form.daysOld"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="flex items-center gap-2 text-sm font-medium"
            ><input v-model="form.isLager" type="checkbox" class="rounded" /> Lager yeast</label
          >
        </div>
        <div>
          <label class="flex items-center gap-2 text-sm font-medium"
            ><input v-model="form.useStirPlate" type="checkbox" class="rounded" /> Stir plate</label
          >
        </div>
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        Calculate
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <div class="flex justify-between">
          <span>Required cells:</span
          ><span class="font-semibold">{{ result.requiredCells }} billion</span>
        </div>
        <div class="flex justify-between">
          <span>Available cells:</span
          ><span class="font-semibold">{{ result.availableCells }} billion</span>
        </div>
        <div class="flex justify-between text-primary">
          <span>Deficit:</span><span class="font-semibold">{{ result.deficit }} billion</span>
        </div>
        <div v-if="result.steps?.length" class="pt-2 border-t mt-2">
          <h4 class="font-medium text-sm mb-1">Starter Steps:</h4>
          <div v-for="(step, i) in result.steps" :key="i" class="text-sm">
            Step {{ i + 1 }}: {{ step.volumeL }}L → {{ step.cellsAfter }} billion cells
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  og: 1.06,
  batchSizeL: 20,
  initialCellsBillion: 100,
  daysOld: 30,
  isLager: false,
  useStirPlate: true,
  form: 'liquid',
})
interface StarterStep {
  volumeL: number
  cellsAfter: number
}
interface StarterResult {
  requiredCells: number
  availableCells: number
  deficit: number
  steps: StarterStep[]
}
const result = ref<StarterResult | null>(null)
async function calculate() {
  result.value = (await $fetch('/api/calculations/yeast-starter', {
    method: 'POST',
    body: form.value,
  })) as unknown as StarterResult
}
</script>
