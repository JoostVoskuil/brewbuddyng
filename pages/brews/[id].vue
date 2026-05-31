<template>
  <div v-if="brew" class="space-y-6">
    <div class="hidden print:flex items-center justify-between gap-4 pb-4 border-b">
      <div>
        <p class="text-sm uppercase tracking-wide text-muted-foreground">{{ printBreweryName }}</p>
        <h1 class="text-2xl font-bold">{{ brew.name }}</h1>
        <p v-if="brew.code" class="font-mono text-sm text-muted-foreground">{{ brew.code }}</p>
      </div>
      <img
        v-if="printBreweryLogo"
        :src="printBreweryLogo"
        :alt="printBreweryName"
        class="max-h-20 max-w-40 object-contain"
      />
    </div>

    <div class="flex flex-col gap-4 print:hidden">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-baseline gap-3 min-w-0">
          <span
            v-if="brew.code"
            class="font-mono text-sm px-2 py-0.5 rounded bg-muted text-muted-foreground"
            >{{ brew.code }}</span
          >
          <h1 class="text-2xl font-bold truncate">{{ brew.name }}</h1>
        </div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-2 border rounded-md text-sm" @click="showDivideDialog = true">
            {{ $t('brew.divide.button') }}
          </button>
          <button class="px-3 py-2 border rounded-md text-sm" @click="printBrew">
            {{ $t('common.print') }}
          </button>
          <NuxtLink to="/brews" class="px-3 py-2 border rounded-md text-sm"
            >← {{ $t('common.back') }}</NuxtLink
          >
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-lg p-4">
        <label class="text-sm text-muted-foreground">
          {{ $t('brew.code') }}
          <input
            v-model="headerForm.code"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background font-mono"
          />
        </label>
        <label class="text-sm text-muted-foreground">
          {{ $t('brew.date') }}
          <input
            v-model="headerForm.brewDate"
            type="date"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </label>
        <label class="text-sm text-muted-foreground">
          {{ $t('brew.status') }}
          <select
            v-model="headerForm.status"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          >
            <option value="planned">{{ $t('brew.statuses.planned') }}</option>
            <option value="brewing">{{ $t('brew.statuses.brewing') }}</option>
            <option value="fermenting">{{ $t('brew.statuses.fermenting') }}</option>
            <option value="conditioning">{{ $t('brew.statuses.conditioning') }}</option>
            <option value="completed">{{ $t('brew.statuses.completed') }}</option>
          </select>
        </label>
        <div class="flex items-end">
          <button
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-60"
            :disabled="saveStatus === 'saving'"
            @click="saveHeader"
          >
            {{ saveLabel }}
          </button>
        </div>
      </div>
    </div>

    <nav class="flex gap-2 overflow-x-auto border-b print:hidden" aria-label="Brew tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-3 py-2 text-sm border-b-2 whitespace-nowrap"
        :class="
          activeTab === tab.id
            ? 'border-primary text-primary font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = tab.id"
      >
        {{ $t(tab.labelKey) }}
      </button>
    </nav>

    <BrewRecept v-if="activeTab === 'recept'" :recipe="recipe" :style-name="styleName" />
    <BrewMaischen
      v-else-if="activeTab === 'maischen'"
      :brew="brew"
      :recipe="recipe"
      @save="saveBrew"
    />
    <BrewBrouwdag
      v-else-if="activeTab === 'brouwdag'"
      :brew="brew"
      :recipe="recipe"
      @save="saveBrew"
      @add-measurement="addMeasurement"
      @refresh="refreshAll"
    />
    <BrewChecklist
      v-else-if="activeTab === 'checklist'"
      :brew="brew"
      :recipe="recipe"
      @save="saveBrew"
    />
    <BrewVergisting v-else-if="activeTab === 'vergisting'" :brew="brew" @save="saveBrew" />
    <BrewBottelen v-else-if="activeTab === 'bottelen'" :brew="brew" @save="saveBrew" />
    <BrewMetingen
      v-else-if="activeTab === 'metingen'"
      :measurements="brew.measurements"
      :brew-id="brew.id"
      @add-measurement="refreshAll"
    />
    <BrewNotities v-else :brew="brew" :recipe="recipe" @save="saveBrew" />

    <BrewDialogsDivideBrewDialog
      v-if="showDivideDialog && brew"
      :brew-id="brew.id"
      :brew-name="brew.name"
      @close="showDivideDialog = false"
      @divided="onDivided"
    />

    <div class="flex items-center gap-4 print:hidden">
      <button class="text-sm text-primary hover:underline" @click="copyToRecipe">
        {{ $t('recipe.copyToRecipe') }}
      </button>
    </div>
  </div>
  <div v-else class="text-center py-12 text-muted-foreground">{{ $t('common.loading') }}</div>
</template>

<script setup lang="ts">
import type {
  Brew,
  BrewChecklistItem,
  BrewMeasurement,
  BrewWithDetails,
  RecipeWithIngredients,
} from '~/types'

type BrewTab =
  | 'recept'
  | 'maischen'
  | 'brouwdag'
  | 'checklist'
  | 'vergisting'
  | 'bottelen'
  | 'metingen'
  | 'notities'
type BrewPatch = Partial<Brew> & { checklist?: BrewChecklistItem[] }

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const { t } = useI18n()
const brew = ref<BrewWithDetails | null>(null)
const recipe = ref<RecipeWithIngredients | null>(null)
const brewerySettings = ref<Record<string, string>>({})
const headerForm = reactive({ code: '', brewDate: '', status: 'planned' })
const { status: saveStatus, run: runSave } = useSaveState()
const showDivideDialog = ref(false)

const tabs: { id: BrewTab; labelKey: string }[] = [
  { id: 'recept', labelKey: 'brew.tabs.recept' },
  { id: 'maischen', labelKey: 'brew.tabs.maischen' },
  { id: 'brouwdag', labelKey: 'brew.tabs.brouwdag' },
  { id: 'checklist', labelKey: 'brew.tabs.checklist.title' },
  { id: 'vergisting', labelKey: 'brew.tabs.vergisting' },
  { id: 'bottelen', labelKey: 'brew.tabs.bottelen' },
  { id: 'metingen', labelKey: 'brew.tabs.metingen.title' },
  { id: 'notities', labelKey: 'brew.tabs.notities' },
]
const tabIds = tabs.map((tab) => tab.id)

const activeTab = computed<BrewTab>({
  get() {
    const value = route.query.tab
    return typeof value === 'string' && tabIds.includes(value as BrewTab)
      ? (value as BrewTab)
      : 'recept'
  },
  set(tab) {
    router.replace({ query: { ...route.query, tab } })
  },
})

const printBreweryName = computed(
  () => brewerySettings.value.breweryName || t('settings.printHeader'),
)
const printBreweryLogo = computed(() => brewerySettings.value.breweryLogo || '')
const styleName = computed(() => (recipe.value?.styleId ? `#${recipe.value.styleId}` : '—'))
const saveLabel = computed(() => {
  if (saveStatus.value === 'saving') return t('common.saving')
  if (saveStatus.value === 'saved') return t('common.saved')
  if (saveStatus.value === 'error') return t('common.saveError')
  return t('common.save')
})

async function loadBrew() {
  brew.value = await $fetch<BrewWithDetails>(`/api/brews/${id}`)
  headerForm.code = brew.value.code ?? ''
  headerForm.brewDate = brew.value.brewDate ?? ''
  headerForm.status = brew.value.status ?? 'planned'
}

async function loadRecipe() {
  recipe.value = brew.value?.recipeId
    ? await $fetch<RecipeWithIngredients>(`/api/recipes/${brew.value.recipeId}`)
    : null
}

async function loadPrintSettings() {
  brewerySettings.value = await $fetch<Record<string, string>>('/api/settings')
}

async function refreshAll() {
  await loadBrew()
  await loadRecipe()
}

async function saveBrew(patch: BrewPatch) {
  if (!brew.value) return
  await runSave(async () => {
    const next = { ...brew.value, ...patch }
    const {
      measurements: _measurements,
      yeastStarter: _yeastStarter,
      divisions: _divisions,
      mashSteps: _mashSteps,
      boilTime: _boilTime,
      checklist,
      ...data
    } = next
    await $fetch(`/api/brews/${id}`, {
      method: 'PUT',
      body: patch.checklist ? { ...data, checklist } : data,
    })
    await loadBrew()
  })
}

async function saveHeader() {
  await saveBrew({
    code: headerForm.code,
    brewDate: headerForm.brewDate,
    status: headerForm.status,
  })
}

async function addMeasurement(measurement: Partial<BrewMeasurement>) {
  await $fetch(`/api/brews/${id}/measurements`, { method: 'POST', body: measurement })
  await loadBrew()
}

async function copyToRecipe() {
  const res = await $fetch<{ id: number }>(`/api/brews/${id}/copy-to-recipe`, { method: 'POST' })
  await navigateTo(`/recipes/${res.id}`)
}

async function onDivided() {
  showDivideDialog.value = false
  await loadBrew()
}

function printBrew() {
  if (import.meta.client) window.open(`/api/brews/${id}/log.print`, '_blank')
}

onMounted(async () => {
  await Promise.all([loadBrew(), loadPrintSettings()])
  await loadRecipe()
})
</script>
