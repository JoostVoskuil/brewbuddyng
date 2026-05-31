<template>
  <section class="space-y-4">
    <div class="border rounded-lg p-4 space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold">{{ $t('brew.tabs.metingen.title') }}</h3>
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground"
            >{{ measurements.length }} {{ $t('brew.measurements').toLowerCase() }}</span
          >
          <button
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            @click="showForm = !showForm"
          >
            {{ showForm ? $t('common.cancel') : $t('common.add') }}
          </button>
        </div>
      </div>
      <BaseChart :option="option" height="420px" />
    </div>

    <div v-if="showForm" class="border rounded-lg p-4 space-y-3">
      <h4 class="font-medium text-sm">{{ $t('brew.tabs.metingen.addMeasurement') }}</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label class="text-xs font-medium text-muted-foreground">
          {{ $t('common.date') }}
          <input
            v-model="form.datetime"
            type="datetime-local"
            class="w-full mt-1 px-2 py-1.5 border rounded bg-background text-sm"
          />
        </label>
        <label class="text-xs font-medium text-muted-foreground">
          SG
          <input
            v-model.number="form.sg"
            type="number"
            step="0.001"
            min="0.990"
            max="1.200"
            class="w-full mt-1 px-2 py-1.5 border rounded bg-background text-sm font-mono"
          />
        </label>
        <label class="text-xs font-medium text-muted-foreground">
          T1 (°C)
          <input
            v-model.number="form.tempS1"
            type="number"
            step="0.1"
            class="w-full mt-1 px-2 py-1.5 border rounded bg-background text-sm font-mono"
          />
        </label>
        <label class="text-xs font-medium text-muted-foreground">
          T2 (°C)
          <input
            v-model.number="form.tempS2"
            type="number"
            step="0.1"
            class="w-full mt-1 px-2 py-1.5 border rounded bg-background text-sm font-mono"
          />
        </label>
        <label class="text-xs font-medium text-muted-foreground">
          Set (°C)
          <input
            v-model.number="form.setTemp"
            type="number"
            step="0.1"
            class="w-full mt-1 px-2 py-1.5 border rounded bg-background text-sm font-mono"
          />
        </label>
        <label class="col-span-2 md:col-span-3 text-xs font-medium text-muted-foreground">
          {{ $t('common.notes') }}
          <input
            v-model="form.notes"
            type="text"
            class="w-full mt-1 px-2 py-1.5 border rounded bg-background text-sm"
          />
        </label>
      </div>
      <div class="flex justify-end">
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-60"
          :disabled="saving"
          @click="submit"
        >
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </div>

    <div class="border rounded-lg p-4 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted text-muted-foreground">
          <tr>
            <th class="text-left p-2">{{ $t('common.date') }}</th>
            <th class="text-right p-2">SG</th>
            <th class="text-right p-2">T1</th>
            <th class="text-right p-2">T2</th>
            <th class="text-right p-2">Set</th>
            <th class="text-left p-2">TControl</th>
            <th class="text-left p-2">{{ $t('common.notes') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sorted" :key="row.id" class="border-t">
            <td class="p-2">{{ formatDate(row.datetime) }}</td>
            <td class="p-2 text-right font-mono">{{ row.sg || '—' }}</td>
            <td class="p-2 text-right font-mono">{{ row.tempS1 || '—' }}</td>
            <td class="p-2 text-right font-mono">{{ row.tempS2 || '—' }}</td>
            <td class="p-2 text-right font-mono">{{ row.setTemp || '—' }}</td>
            <td class="p-2">{{ row.seriesTag === 'tcontrol' ? '✓' : '—' }}</td>
            <td class="p-2">{{ row.notes }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { BrewMeasurement } from '~/types'
import { useTControlChart } from '~/composables/useTControlChart'
const props = defineProps<{ measurements: BrewMeasurement[]; brewId: number }>()
const emit = defineEmits<{ (e: 'add-measurement', payload: Record<string, unknown>): void }>()
const source = computed(() => props.measurements)
const { option, sorted } = useTControlChart(source)

const showForm = ref(false)
const saving = ref(false)

function nowLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const form = ref({ datetime: nowLocal(), sg: 1.0, tempS1: 0, tempS2: 0, setTemp: 0, notes: '' })

async function submit() {
  saving.value = true
  try {
    const body = {
      ...form.value,
      datetime: form.value.datetime
        ? new Date(form.value.datetime).toISOString()
        : new Date().toISOString(),
    }
    await $fetch(`/api/brews/${props.brewId}/measurements`, { method: 'POST', body })
    emit('add-measurement', body)
    showForm.value = false
    form.value = { datetime: nowLocal(), sg: 1.0, tempS1: 0, tempS2: 0, setTemp: 0, notes: '' }
  } finally {
    saving.value = false
  }
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—'
}
</script>
