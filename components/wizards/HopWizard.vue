<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-2xl rounded-lg border bg-background p-4 shadow-xl">
      <div class="flex items-start justify-between gap-3 border-b pb-3">
        <div>
          <h2 class="text-lg font-semibold">{{ $t('wizard.hop.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ $t('wizard.hop.subtitle') }}</p>
        </div>
        <button type="button" class="text-xl leading-none" @click="$emit('close')">×</button>
      </div>

      <div class="grid gap-4 py-4 md:grid-cols-2">
        <label class="space-y-1 text-sm font-medium">
          {{ $t('recipe.targetIbu') }}
          <input
            v-model.number="targetIbu"
            type="number"
            step="1"
            min="0"
            class="w-full rounded border bg-background px-3 py-2 text-right"
          />
        </label>
        <label class="space-y-1 text-sm font-medium">
          {{ $t('wizard.hop.alpha') }}
          <input
            v-model.number="alpha"
            type="number"
            step="0.1"
            min="0"
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
            step="5"
            class="w-full"
          />
        </label>
      </div>

      <div class="rounded border">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="p-2 text-left">{{ $t('common.name') }}</th>
              <th class="p-2 text-right">g</th>
              <th class="p-2 text-right">{{ $t('recipe.contributionIbu') }}</th>
              <th class="p-2 text-right">{{ $t('recipe.miscTime') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="hop in preview" :key="hop.category" class="border-t">
              <td class="p-2">{{ hop.name }}</td>
              <td class="p-2 text-right tabular-nums">{{ hop.amount }}</td>
              <td class="p-2 text-right tabular-nums">{{ hop.ibu.toFixed(1) }}</td>
              <td class="p-2 text-right tabular-nums">{{ hop.time }}</td>
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
import { planHopWizard, type HopWizardCategory } from '~/server/utils/calculations/wizard'

const props = defineProps<{ target?: number; batchSize: number; boilSize: number; og: number }>()
const emit = defineEmits<{
  close: []
  apply: [mode: 'append' | 'replace', hops: ReturnType<typeof planHopWizard>]
}>()

const targetIbu = ref(props.target || 30)
const alpha = ref(6)
const proportions = reactive<Record<HopWizardCategory, number>>({
  bittering: 60,
  flavour: 25,
  aroma: 15,
})
const categories = [
  { key: 'bittering' as const, label: 'wizard.hop.bittering' },
  { key: 'flavour' as const, label: 'wizard.hop.flavour' },
  { key: 'aroma' as const, label: 'wizard.hop.aroma' },
]

const preview = computed(() =>
  planHopWizard({
    targetIbu: targetIbu.value,
    batchSize: props.batchSize,
    boilSize: props.boilSize,
    og: props.og,
    alpha: alpha.value,
    form: 'pellet',
    proportions,
  }),
)

function apply(mode: 'append' | 'replace') {
  emit('apply', mode, preview.value)
}
</script>
