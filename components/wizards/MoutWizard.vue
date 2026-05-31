<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-2xl rounded-lg border bg-background p-4 shadow-xl">
      <div class="flex items-start justify-between gap-3 border-b pb-3">
        <div>
          <h2 class="text-lg font-semibold">{{ $t('wizard.mout.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ $t('wizard.mout.subtitle') }}</p>
        </div>
        <button type="button" class="text-xl leading-none" @click="$emit('close')">×</button>
      </div>

      <div class="grid gap-4 py-4 md:grid-cols-2">
        <label class="space-y-1 text-sm font-medium">
          {{ $t('recipe.targetOg') }}
          <input
            v-model.number="targetOg"
            type="number"
            step="0.001"
            min="1"
            class="w-full rounded border bg-background px-3 py-2 text-right"
          />
        </label>
        <label
          v-for="cat in categories"
          :key="cat.key"
          class="space-y-1 text-sm font-medium md:col-span-2"
        >
          <span class="flex justify-between"
            ><span>{{ $t(cat.label) }}</span
            ><span>{{ proportions[cat.key] }}%</span></span
          >
          <input
            v-model.number="proportions[cat.key]"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full"
          />
        </label>
      </div>

      <div class="rounded border">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="p-2 text-left">{{ $t('common.name') }}</th>
              <th class="p-2 text-right">kg</th>
              <th class="p-2 text-right">{{ $t('databases.yield') }} %</th>
              <th class="p-2 text-right">EBC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fermentable in preview" :key="fermentable.category" class="border-t">
              <td class="p-2">{{ fermentable.name }}</td>
              <td class="p-2 text-right tabular-nums">{{ fermentable.amount.toFixed(3) }}</td>
              <td class="p-2 text-right tabular-nums">{{ fermentable.yield }}</td>
              <td class="p-2 text-right tabular-nums">{{ fermentable.color }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="rounded border px-3 py-2 text-sm" @click="$emit('close')">
          {{ $t('common.cancel') }}
        </button>
        <button type="button" class="rounded border px-3 py-2 text-sm" @click="apply('append')">
          {{ $t('wizard.append') }}
        </button>
        <button
          type="button"
          class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
          @click="apply('replace')"
        >
          {{ $t('wizard.replace') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { planMaltWizard, type MaltWizardCategory } from '~/server/utils/calculations/wizard'

const props = defineProps<{ target?: number; batchSize: number; efficiency: number }>()
const emit = defineEmits<{
  close: []
  apply: [mode: 'append' | 'replace', fermentables: ReturnType<typeof planMaltWizard>]
}>()

const targetOg = ref(props.target || 1.05)
const proportions = reactive<Record<MaltWizardCategory, number>>({
  base: 85,
  caramel: 10,
  roast: 2,
  specialty: 3,
})
const categories = [
  { key: 'base' as const, label: 'wizard.mout.base' },
  { key: 'caramel' as const, label: 'wizard.mout.caramel' },
  { key: 'roast' as const, label: 'wizard.mout.roast' },
  { key: 'specialty' as const, label: 'wizard.mout.specialty' },
]

const preview = computed(() =>
  planMaltWizard({
    targetOg: targetOg.value,
    batchSize: props.batchSize,
    efficiency: props.efficiency,
    proportions,
  }),
)

function apply(mode: 'append' | 'replace') {
  emit('apply', mode, preview.value)
}
</script>
