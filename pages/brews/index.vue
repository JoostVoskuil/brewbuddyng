<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ $t('brew.title') }}</h1>
      <div class="flex items-center gap-2">
        <button
          class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          @click="exportCsvFile"
        >
          {{ $t('common.exportCsv') }}
        </button>
        <NuxtLink
          to="/brews/new"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {{ $t('brew.new') }}
        </NuxtLink>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div
        class="flex rounded-md border"
        role="tablist"
        :aria-label="$t('styleAnalysis.tabs.label')"
      >
        <button
          v-for="tab in viewTabs"
          :key="tab.value"
          type="button"
          :class="[
            'px-3 py-2 text-sm first:rounded-l-md last:rounded-r-md',
            activeTab === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          ]"
          @click="activeTab = tab.value"
        >
          {{ $t(tab.label) }}
        </button>
      </div>
      <input
        ref="filterInput"
        v-model="search"
        :placeholder="$t('brews.filter.placeholder')"
        class="w-full max-w-sm rounded-md border bg-background px-3 py-2"
      />
      <div
        v-if="activeTab === 'list'"
        class="flex overflow-hidden rounded-md border"
        role="group"
        :aria-label="$t('brew.groupBy.label')"
      >
        <button
          v-for="option in groupByOptions"
          :key="option.value"
          type="button"
          :class="[
            'border-l px-3 py-2 text-sm first:border-l-0',
            groupBy === option.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          ]"
          @click="groupBy = option.value"
        >
          {{ $t(option.label) }}
        </button>
      </div>
      <label v-if="activeTab === 'list'" class="flex items-center gap-2 text-sm">
        {{ $t('brew.sortBy') }}
        <select v-model="sortKey" class="rounded-md border bg-background px-2 py-2">
          <option value="brewDate">{{ $t('brew.date') }}</option>
          <option value="name">{{ $t('common.name') }}</option>
          <option value="style">{{ $t('recipe.style') }}</option>
          <option value="status">{{ $t('brew.status') }}</option>
          <option value="brewer">{{ $t('brew.brewer') }}</option>
        </select>
      </label>
      <span class="text-xs text-muted-foreground">{{ $t('brews.filter.shortcut') }}</span>
    </div>

    <RecipeStyleAnalysis
      v-if="activeTab === 'style'"
      :items="styleAnalysisItems"
      :styles="styles"
      item-path="/brews"
    />

    <div v-else class="overflow-hidden rounded-lg border">
      <table class="w-full text-sm">
        <thead class="bg-muted">
          <tr>
            <th class="w-6 p-3 text-left font-medium"></th>
            <th class="p-3 text-left font-medium">{{ $t('brew.code') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('common.name') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('recipe.style') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('brew.date') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('brew.status') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('brew.brewer') }}</th>
            <th class="p-3 text-right font-medium">OG</th>
            <th class="p-3 text-right font-medium">FG</th>
            <th class="p-3 text-right font-medium">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody v-if="groupBy === 'flat'">
          <tr
            v-for="brew in filtered"
            :key="brew.id"
            class="cursor-pointer border-t hover:bg-muted/50"
            @click="navigateTo(`/brews/${brew.id}`)"
            @contextmenu.prevent="openBrewMenu(brew, $event)"
            @pointerdown="startLongPress(brew, $event)"
            @pointerup="cancelLongPress"
            @pointercancel="cancelLongPress"
            @pointermove="cancelLongPress"
          >
            <td class="p-3"><StockDot :state="brew.stockState" /></td>
            <td class="p-3 tabular-nums text-muted-foreground">
              <HighlightedText :parts="highlightParts(brew.code || '—')" />
            </td>
            <td class="p-3 font-medium"><HighlightedText :parts="highlightParts(brew.name)" /></td>
            <td class="p-3">
              <HighlightedText :parts="highlightParts(styleNameForBrew(brew) || '—')" />
            </td>
            <td class="p-3">{{ brew.brewDate || '—' }}</td>
            <td class="p-3"><HighlightedText :parts="highlightParts(brew.status || '—')" /></td>
            <td class="p-3"><HighlightedText :parts="highlightParts(brew.brewer || '—')" /></td>
            <td class="p-3 text-right">{{ brew.ogActual?.toFixed(3) || '—' }}</td>
            <td class="p-3 text-right">{{ brew.fgActual?.toFixed(3) || '—' }}</td>
            <td class="p-3 text-right">
              <button class="text-primary hover:underline" @click.stop="openBrewMenu(brew, $event)">
                {{ $t('common.actions') }}
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="10" class="p-6 text-center text-muted-foreground">
              {{ $t('common.noResults') }}
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="filtered.length === 0">
          <tr>
            <td colspan="10" class="p-6 text-center text-muted-foreground">
              {{ $t('common.noResults') }}
            </td>
          </tr>
        </tbody>
        <TreeList
          v-else
          :items="filtered"
          :group-by="brewGroupPath"
          key-field="id"
          storage-key="brews:tree:expanded"
          :colspan="10"
          :force-expand="!!debouncedSearch"
        >
          <template #header="{ label, count }"
            ><span><HighlightedText :parts="highlightParts(label)" /></span
            ><span class="text-sm text-muted-foreground">({{ count }})</span></template
          >
          <template #row="{ item: brew }">
            <tr
              class="cursor-pointer border-t hover:bg-muted/50"
              @click="navigateTo(`/brews/${brew.id}`)"
              @contextmenu.prevent="openBrewMenu(brew, $event)"
              @pointerdown="startLongPress(brew, $event)"
              @pointerup="cancelLongPress"
              @pointercancel="cancelLongPress"
              @pointermove="cancelLongPress"
            >
              <td class="p-3"><StockDot :state="brew.stockState" /></td>
              <td class="p-3 tabular-nums text-muted-foreground">
                <HighlightedText :parts="highlightParts(brew.code || '—')" />
              </td>
              <td class="p-3 font-medium">
                <HighlightedText :parts="highlightParts(brew.name)" />
              </td>
              <td class="p-3">
                <HighlightedText :parts="highlightParts(styleNameForBrew(brew) || '—')" />
              </td>
              <td class="p-3">{{ brew.brewDate || '—' }}</td>
              <td class="p-3"><HighlightedText :parts="highlightParts(brew.status || '—')" /></td>
              <td class="p-3"><HighlightedText :parts="highlightParts(brew.brewer || '—')" /></td>
              <td class="p-3 text-right">{{ brew.ogActual?.toFixed(3) || '—' }}</td>
              <td class="p-3 text-right">{{ brew.fgActual?.toFixed(3) || '—' }}</td>
              <td class="p-3 text-right">
                <button
                  class="text-primary hover:underline"
                  @click.stop="openBrewMenu(brew, $event)"
                >
                  {{ $t('common.actions') }}
                </button>
              </td>
            </tr>
          </template>
        </TreeList>
      </table>
    </div>

    <ContextMenu
      v-model="menu.open"
      :x="menu.x"
      :y="menu.y"
      :items="brewMenuItems"
      @select="handleBrewAction"
    />
  </div>
</template>

<script setup lang="ts">
import { useRecipeBrewClipboard } from '~/composables/useRecipeBrewClipboard'
import type { BeerStyle, BrewListItem, RecipeListItem } from '~/types'

const HighlightedText = defineComponent({
  props: {
    parts: { type: Array as PropType<Array<{ text: string; match: boolean }>>, required: true },
  },
  setup(props) {
    return () =>
      props.parts.map((part, index) =>
        h(
          'span',
          { key: index, class: part.match ? 'rounded bg-yellow-200 px-0.5 text-yellow-950' : '' },
          part.text,
        ),
      )
  },
})

const { t } = useI18n()
const brews = ref<BrewListItem[]>([])
const recipes = ref<RecipeListItem[]>([])
const styles = ref<BeerStyle[]>([])
type BrewGroupBy = 'flat' | 'style' | 'yearMonth'
type ActiveTab = 'list' | 'style'

const search = ref('')
const debouncedSearch = ref('')
const sortKey = ref<'brewDate' | 'name' | 'style' | 'status' | 'brewer'>('brewDate')
const groupBy = ref<BrewGroupBy>('flat')
const activeTab = ref<ActiveTab>('list')
const filterInput = ref<HTMLInputElement | null>(null)
const menu = ref({ open: false, x: 0, y: 0, brew: null as BrewListItem | null })
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let longPressTimer: ReturnType<typeof setTimeout> | undefined
const { exportCsv } = useCsvExport()
const { copyBrewToRecipe, duplicateBrew } = useRecipeBrewClipboard()

const viewTabs: { value: ActiveTab; label: string }[] = [
  { value: 'list', label: 'styleAnalysis.tabs.list' },
  { value: 'style', label: 'styleAnalysis.tabs.styleAnalysis' },
]
const brewGroupValues: BrewGroupBy[] = ['flat', 'style', 'yearMonth']
const groupByOptions: { value: BrewGroupBy; label: string }[] = [
  { value: 'flat', label: 'brew.groupBy.flat' },
  { value: 'style', label: 'brew.groupBy.style' },
  { value: 'yearMonth', label: 'brew.groupBy.yearMonth' },
]
const brewMenuItems = computed(() => [
  { key: 'copy-to-recipe', label: t('brews.contextMenu.copyToRecipe') },
  { key: 'duplicate', label: t('brews.contextMenu.duplicate') },
  { key: 'delete', label: t('brews.contextMenu.delete'), destructive: true },
])

const recipeById = computed<Record<number, RecipeListItem>>(() =>
  Object.fromEntries(recipes.value.map((recipe) => [recipe.id, recipe])),
)
const styleNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(styles.value.map((s) => [s.id, s.name])),
)
function recipeForBrew(brew: BrewListItem) {
  return brew.recipeId == null ? undefined : recipeById.value[brew.recipeId]
}
function styleNameForBrew(brew: BrewListItem): string {
  const recipe = recipeForBrew(brew)
  return recipe?.styleId == null ? '' : (styleNameById.value[recipe.styleId] ?? '')
}
function styleIdForBrew(brew: BrewListItem): number | null {
  return recipeForBrew(brew)?.styleId ?? null
}
function yearMonth(date: string | null | undefined): string {
  return date?.slice(0, 7) || '—'
}
function brewGroupPath(brew: BrewListItem): string {
  if (groupBy.value === 'style') return styleNameForBrew(brew) || '—'
  return yearMonth(brew.brewDate)
}
function searchable(brew: BrewListItem): string {
  return [
    brew.searchText,
    brew.name,
    brew.code,
    brew.notes,
    brew.brewer,
    brew.status,
    styleNameForBrew(brew),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const filtered = computed(() => {
  let list = brews.value
  if (debouncedSearch.value) {
    const s = debouncedSearch.value.toLowerCase()
    list = list.filter((brew) => searchable(brew).includes(s))
  }
  const key = sortKey.value
  return [...list].sort((a, b) => {
    if (key === 'style') return styleNameForBrew(a).localeCompare(styleNameForBrew(b))
    return (a[key] ?? '').localeCompare(b[key] ?? '')
  })
})

const styleAnalysisItems = computed(() =>
  filtered.value.map((brew) => {
    const recipe = recipeForBrew(brew)
    return {
      id: brew.id,
      name: brew.name,
      code: brew.code,
      styleId: styleIdForBrew(brew),
      styleName: styleNameForBrew(brew),
      og: brew.ogActual || recipe?.og,
      fg: brew.fgActual || recipe?.fg,
      abv: recipe?.abv,
      ibu: recipe?.ibu,
      color: recipe?.color,
    }
  }),
)

function highlightParts(value: string | number | null | undefined) {
  const text = String(value ?? '')
  const needle = debouncedSearch.value.trim()
  if (!needle) return [{ text, match: false }]
  const lower = text.toLowerCase()
  const query = needle.toLowerCase()
  const parts: Array<{ text: string; match: boolean }> = []
  let start = 0
  let index = lower.indexOf(query)
  while (index !== -1) {
    if (index > start) parts.push({ text: text.slice(start, index), match: false })
    parts.push({ text: text.slice(index, index + query.length), match: true })
    start = index + query.length
    index = lower.indexOf(query, start)
  }
  if (start < text.length) parts.push({ text: text.slice(start), match: false })
  return parts.length ? parts : [{ text, match: false }]
}

async function loadBrews() {
  brews.value = await $fetch<BrewListItem[]>('/api/brews')
}
async function deleteBrew(id: number) {
  if (confirm(t('common.confirm') + '?')) {
    await $fetch(`/api/brews/${id}`, { method: 'DELETE' })
    await loadBrews()
  }
}
function exportCsvFile() {
  exportCsv('brews', filtered.value, [
    { header: t('common.name'), value: (b) => b.name },
    { header: t('brew.date'), value: (b) => b.brewDate ?? '' },
    { header: t('brew.status'), value: (b) => b.status ?? '' },
    { header: t('brew.brewer'), value: (b) => b.brewer ?? '' },
    { header: 'OG', value: (b) => (b.ogActual ?? 0).toFixed(3) },
    { header: 'FG', value: (b) => (b.fgActual ?? 0).toFixed(3) },
  ])
}

function openBrewMenu(brew: BrewListItem, event: MouseEvent | PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  menu.value = { open: true, x: event.clientX, y: event.clientY, brew }
}
function startLongPress(brew: BrewListItem, event: PointerEvent) {
  if (event.pointerType === 'mouse') return
  cancelLongPress()
  longPressTimer = setTimeout(() => openBrewMenu(brew, event), 550)
}
function cancelLongPress() {
  if (longPressTimer) clearTimeout(longPressTimer)
}
async function handleBrewAction(action: string) {
  const brew = menu.value.brew
  if (!brew) return
  if (action === 'copy-to-recipe') {
    const created = await copyBrewToRecipe(brew)
    await navigateTo(`/recipes/${created.id}`)
  } else if (action === 'duplicate') {
    const created = await duplicateBrew(brew)
    await loadBrews()
    await navigateTo(`/brews/${created.id}`)
  } else if (action === 'delete') {
    await deleteBrew(brew.id)
  }
}
function onShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const editing = target?.matches('input, textarea, select, [contenteditable="true"]')
  if (event.key === '/' && !editing) {
    event.preventDefault()
    filterInput.value?.focus()
  }
}

onMounted(async () => {
  const storedGroupBy = localStorage.getItem('brews:tree:groupBy') as BrewGroupBy | null
  if (storedGroupBy && brewGroupValues.includes(storedGroupBy)) groupBy.value = storedGroupBy
  window.addEventListener('keydown', onShortcut)
  const [brewRows, recipeRows, styleRows] = await Promise.all([
    $fetch<BrewListItem[]>('/api/brews'),
    $fetch<RecipeListItem[]>('/api/recipes'),
    $fetch<BeerStyle[]>('/api/styles'),
  ])
  brews.value = brewRows
  recipes.value = recipeRows
  styles.value = styleRows
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onShortcut)
  if (debounceTimer) clearTimeout(debounceTimer)
  cancelLongPress()
})
watch(search, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = value.trim()
  }, 250)
})
watch(groupBy, (value) => {
  if (import.meta.client) localStorage.setItem('brews:tree:groupBy', value)
})
</script>
