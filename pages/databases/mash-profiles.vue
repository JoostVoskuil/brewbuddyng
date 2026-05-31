<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('databases.mashProfiles') }}</h1>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        @click="openAdd"
      >
        {{ $t('common.add') }}
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="search"
        :placeholder="$t('common.search')"
        class="w-full max-w-sm px-3 py-2 border rounded-md bg-background"
      />
    </div>

    <div class="border rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted">
          <tr>
            <th class="text-left p-3 font-medium">{{ $t('common.name') }}</th>
            <th class="text-right p-3 font-medium">{{ $t('databases.grainTemp') }}</th>
            <th class="text-right p-3 font-medium">{{ $t('databases.tunTemp') }}</th>
            <th class="text-right p-3 font-medium">{{ $t('databases.spargeTemp') }}</th>
            <th class="text-right p-3 font-medium">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.id" class="border-t hover:bg-muted/50">
            <td class="p-3 font-medium">{{ item.name }}</td>
            <td class="p-3 text-right">{{ item.grainTemp?.toFixed(0) }}°C</td>
            <td class="p-3 text-right">{{ item.tunTemp?.toFixed(0) }}°C</td>
            <td class="p-3 text-right">{{ item.spargeTemp?.toFixed(0) }}°C</td>
            <td class="p-3 text-right">
              <button class="text-primary hover:underline mr-2" @click="editItem(item)">
                {{ $t('common.edit') }}
              </button>
              <button class="text-destructive hover:underline" @click="deleteItem(item.id)">
                {{ $t('common.delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="p-6 text-center text-muted-foreground">
              {{ $t('common.noResults') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Dialog -->
    <div
      v-if="dialogOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDialog"
    >
      <div class="bg-card border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingId ? $t('common.edit') : $t('common.add') }} {{ $t('databases.mashProfiles') }}
        </h2>
        <form class="space-y-3" @submit.prevent="saveItem">
          <div>
            <label class="text-sm font-medium">{{ $t('common.name') }}</label>
            <input
              v-model="form.name"
              required
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-sm font-medium">{{ $t('databases.grainTemp') }}</label>
              <input
                v-model.number="form.grainTemp"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.tunTemp') }}</label>
              <input
                v-model.number="form.tunTemp"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.spargeTemp') }}</label>
              <input
                v-model.number="form.spargeTemp"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>

          <!-- Steps -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium">{{ $t('databases.steps') }}</label>
              <button
                type="button"
                class="px-2 py-1 text-sm border rounded-md hover:bg-muted"
                @click="addStep"
              >
                {{ $t('databases.addStep') }}
              </button>
            </div>
            <table class="w-full text-sm border rounded-lg overflow-hidden">
              <thead class="bg-muted">
                <tr>
                  <th class="text-left p-2">{{ $t('common.name') }}</th>
                  <th class="text-left p-2">{{ $t('databases.stepType') }}</th>
                  <th class="text-right p-2">{{ $t('databases.stepTemp') }}</th>
                  <th class="text-right p-2">{{ $t('databases.stepTime') }}</th>
                  <th class="text-right p-2">{{ $t('databases.rampTime') }}</th>
                  <th class="text-right p-2">{{ $t('databases.infuseAmount') }}</th>
                  <th class="p-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(step, i) in form.steps" :key="i" class="border-t">
                  <td class="p-2">
                    <input
                      v-model="step.name"
                      class="w-full px-2 py-1 border rounded bg-background"
                    />
                  </td>
                  <td class="p-2">
                    <select
                      v-model="step.type"
                      class="px-2 py-1 border rounded bg-background text-sm"
                    >
                      <option v-for="st in stepTypes" :key="st" :value="st">{{ st }}</option>
                    </select>
                  </td>
                  <td class="p-2 text-right">
                    <input
                      v-model.number="step.stepTemp"
                      type="number"
                      step="0.1"
                      class="w-20 px-2 py-1 border rounded bg-background text-right"
                    />
                  </td>
                  <td class="p-2 text-right">
                    <input
                      v-model.number="step.stepTime"
                      type="number"
                      class="w-20 px-2 py-1 border rounded bg-background text-right"
                    />
                  </td>
                  <td class="p-2 text-right">
                    <input
                      v-model.number="step.rampTime"
                      type="number"
                      class="w-20 px-2 py-1 border rounded bg-background text-right"
                    />
                  </td>
                  <td class="p-2 text-right">
                    <input
                      v-model.number="step.infuseAmount"
                      type="number"
                      step="0.1"
                      class="w-20 px-2 py-1 border rounded bg-background text-right"
                    />
                  </td>
                  <td class="p-2 text-right">
                    <button type="button" class="text-destructive" @click="form.steps.splice(i, 1)">
                      ✕
                    </button>
                  </td>
                </tr>
                <tr v-if="!form.steps.length">
                  <td colspan="7" class="p-4 text-center text-muted-foreground">
                    {{ $t('common.noResults') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <label class="text-sm font-medium">{{ $t('common.notes') }}</label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="px-4 py-2 border rounded-md text-sm" @click="closeDialog">
              {{ $t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              {{ $t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MashProfile, MashStep } from '~/types'

type StepForm = Omit<MashStep, 'id' | 'mashProfileId'>

interface ProfileForm {
  name: string
  grainTemp: number
  tunTemp: number
  spargeTemp: number
  notes: string
  steps: StepForm[]
}

const stepTypes = ['Infusion', 'Temperature', 'Decoction']

const { t } = useI18n()
const profiles = ref<MashProfile[]>([])
const search = ref('')
const dialogOpen = ref(false)
const editingId = ref<number | null>(null)

function createEmptyForm(): ProfileForm {
  return {
    name: '',
    grainTemp: 20,
    tunTemp: 20,
    spargeTemp: 78,
    notes: '',
    steps: [],
  }
}
const form = ref<ProfileForm>(createEmptyForm())

const filtered = computed(() => {
  if (!search.value) return profiles.value
  const s = search.value.toLowerCase()
  return profiles.value.filter((p) => p.name.toLowerCase().includes(s))
})

function addStep() {
  form.value.steps.push({
    name: '',
    type: 'Infusion',
    stepTemp: 65,
    stepTime: 60,
    rampTime: 0,
    infuseAmount: 0,
    sortOrder: form.value.steps.length,
  })
}

function openAdd() {
  editingId.value = null
  form.value = createEmptyForm()
  dialogOpen.value = true
}

async function editItem(item: MashProfile) {
  const full = await $fetch<MashProfile & { steps: MashStep[] }>(`/api/mashes/${item.id}`)
  editingId.value = item.id
  form.value = {
    name: full.name,
    grainTemp: full.grainTemp ?? 20,
    tunTemp: full.tunTemp ?? 20,
    spargeTemp: full.spargeTemp ?? 78,
    notes: full.notes ?? '',
    steps: (full.steps ?? []).map((s) => ({
      name: s.name,
      type: s.type ?? 'Infusion',
      stepTemp: s.stepTemp,
      stepTime: s.stepTime,
      rampTime: s.rampTime ?? 0,
      infuseAmount: s.infuseAmount ?? 0,
      sortOrder: s.sortOrder ?? 0,
    })),
  }
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
  editingId.value = null
}

async function saveItem() {
  // Renumber steps by their current order before saving.
  const steps = form.value.steps.map((s, i) => ({ ...s, sortOrder: i }))
  const body = { ...form.value, steps }
  if (editingId.value) {
    await $fetch(`/api/mashes/${editingId.value}`, { method: 'PUT', body })
  } else {
    await $fetch('/api/mashes', { method: 'POST', body })
  }
  closeDialog()
  await loadProfiles()
}

async function deleteItem(id: number) {
  if (confirm(t('common.confirm') + '?')) {
    await $fetch(`/api/mashes/${id}`, { method: 'DELETE' })
    await loadProfiles()
  }
}

async function loadProfiles() {
  profiles.value = await $fetch<MashProfile[]>('/api/mashes')
}

onMounted(loadProfiles)
</script>
