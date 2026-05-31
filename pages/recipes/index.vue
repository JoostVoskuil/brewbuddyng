<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ $t('recipe.title') }}</h1>
      <div class="flex items-center gap-2">
        <input ref="fileInput" type="file" accept=".xml,.txt,.rec,.pml" class="hidden" @change="onImportFile" />
        <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="fileInput?.click()">
          {{ $t('recipe.importRecipe') }}
        </button>
        <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="exportCsvFile">
          {{ $t('common.exportCsv') }}
        </button>
        <NuxtLink to="/recipes/new" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          {{ $t('recipe.new') }}
        </NuxtLink>
      </div>
    </div>

    <p v-if="importMessage" class="mb-4 text-sm text-muted-foreground">{{ importMessage }}</p>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="flex rounded-md border" role="tablist" :aria-label="$t('styleAnalysis.tabs.label')">
        <button
          v-for="tab in viewTabs"
          :key="tab.value"
          type="button"
          :class="['px-3 py-2 text-sm first:rounded-l-md last:rounded-r-md', activeTab === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted']"
          @click="activeTab = tab.value"
        >
          {{ $t(tab.label) }}
        </button>
      </div>
      <input
        ref="filterInput"
        v-model="search"
        :placeholder="$t('recipes.filter.placeholder')"
        class="w-full max-w-sm rounded-md border bg-background px-3 py-2"
      />
      <div v-if="activeTab === 'list'" class="flex overflow-hidden rounded-md border" role="group" :aria-label="$t('recipe.groupBy.label')">
        <button
          v-for="option in groupByOptions"
          :key="option.value"
          type="button"
          :class="['border-l px-3 py-2 text-sm first:border-l-0', groupBy === option.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted']"
          @click="groupBy = option.value"
        >
          {{ $t(option.label) }}
        </button>
      </div>
      <label v-if="activeTab === 'list'" class="flex items-center gap-2 text-sm">
        {{ $t('recipe.sortBy') }}
        <select v-model="sortKey" class="rounded-md border bg-background px-2 py-2">
          <option value="name">{{ $t('common.name') }}</option>
          <option value="type">{{ $t('recipe.type') }}</option>
          <option value="style">{{ $t('recipe.style') }}</option>
          <option value="og">OG</option>
          <option value="ibu">IBU</option>
          <option value="abv">ABV</option>
        </select>
      </label>
      <span class="text-xs text-muted-foreground">{{ $t('recipes.filter.shortcut') }}</span>
    </div>

    <RecipeStyleAnalysis v-if="activeTab === 'style'" :items="styleAnalysisItems" :styles="styles" item-path="/recipes" />

    <div v-else class="overflow-hidden rounded-lg border">
      <table class="w-full text-sm">
        <thead class="bg-muted">
          <tr>
            <th class="w-6 p-3 text-left font-medium"></th>
            <th class="p-3 text-left font-medium">{{ $t('recipe.code') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('common.name') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('recipe.type') }}</th>
            <th class="p-3 text-left font-medium">{{ $t('recipe.style') }}</th>
            <th class="p-3 text-right font-medium">OG</th>
            <th class="p-3 text-right font-medium">IBU</th>
            <th class="p-3 text-right font-medium">{{ $t('recipe.color') }}</th>
            <th class="p-3 text-right font-medium">ABV %</th>
            <th class="p-3 text-right font-medium">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody v-if="groupBy === 'flat'">
          <tr
            v-for="recipe in filtered"
            :key="recipe.id"
            class="cursor-pointer border-t hover:bg-muted/50"
            @click="navigateTo(`/recipes/${recipe.id}`)"
            @contextmenu.prevent="openRecipeMenu(recipe, $event)"
            @pointerdown="startLongPress(recipe, $event)"
            @pointerup="cancelLongPress"
            @pointercancel="cancelLongPress"
            @pointermove="cancelLongPress"
          >
            <td class="p-3"><StockDot :state="recipe.stockState" /></td>
            <td class="p-3 tabular-nums text-muted-foreground"><HighlightedText :parts="highlightParts(recipe.code || '—')" /></td>
            <td class="p-3 font-medium"><HighlightedText :parts="highlightParts(recipe.name)" /></td>
            <td class="p-3"><HighlightedText :parts="highlightParts(recipe.type)" /></td>
            <td class="p-3"><HighlightedText :parts="highlightParts(styleName(recipe.styleId) || '—')" /></td>
            <td class="p-3 text-right">{{ recipe.og?.toFixed(3) || '—' }}</td>
            <td class="p-3 text-right">{{ recipe.ibu?.toFixed(0) || '—' }}</td>
            <td class="p-3 text-right"><ColorCell :color="recipe.color" /></td>
            <td class="p-3 text-right">{{ recipe.abv?.toFixed(1) || '—' }}%</td>
            <td class="p-3 text-right"><button class="text-primary hover:underline" @click.stop="openRecipeMenu(recipe, $event)">{{ $t('common.actions') }}</button></td>
          </tr>
          <tr v-if="filtered.length === 0"><td colspan="10" class="p-6 text-center text-muted-foreground">{{ $t('common.noResults') }}</td></tr>
        </tbody>
        <tbody v-else-if="filtered.length === 0"><tr><td colspan="10" class="p-6 text-center text-muted-foreground">{{ $t('common.noResults') }}</td></tr></tbody>
        <TreeList v-else :items="filtered" :group-by="recipeGroupPath" key-field="id" storage-key="recipes:tree:expanded" :colspan="10" :force-expand="!!debouncedSearch">
          <template #header="{ label, count }"><span><HighlightedText :parts="highlightParts(label)" /></span><span class="text-sm text-muted-foreground">({{ count }})</span></template>
          <template #row="{ item: recipe }">
            <tr
              class="cursor-pointer border-t hover:bg-muted/50"
              @click="navigateTo(`/recipes/${recipe.id}`)"
              @contextmenu.prevent="openRecipeMenu(recipe, $event)"
              @pointerdown="startLongPress(recipe, $event)"
              @pointerup="cancelLongPress"
              @pointercancel="cancelLongPress"
              @pointermove="cancelLongPress"
            >
              <td class="p-3"><StockDot :state="recipe.stockState" /></td>
              <td class="p-3 tabular-nums text-muted-foreground"><HighlightedText :parts="highlightParts(recipe.code || '—')" /></td>
              <td class="p-3 font-medium"><HighlightedText :parts="highlightParts(recipe.name)" /></td>
              <td class="p-3"><HighlightedText :parts="highlightParts(recipe.type)" /></td>
              <td class="p-3"><HighlightedText :parts="highlightParts(styleName(recipe.styleId) || '—')" /></td>
              <td class="p-3 text-right">{{ recipe.og?.toFixed(3) || '—' }}</td>
              <td class="p-3 text-right">{{ recipe.ibu?.toFixed(0) || '—' }}</td>
              <td class="p-3 text-right"><ColorCell :color="recipe.color" /></td>
              <td class="p-3 text-right">{{ recipe.abv?.toFixed(1) || '—' }}%</td>
              <td class="p-3 text-right"><button class="text-primary hover:underline" @click.stop="openRecipeMenu(recipe, $event)">{{ $t('common.actions') }}</button></td>
            </tr>
          </template>
        </TreeList>
      </table>
    </div>

    <ContextMenu v-model="menu.open" :x="menu.x" :y="menu.y" :items="recipeMenuItems" @select="handleRecipeAction" />
  </div>
</template>

<script setup lang="ts">
import { useRecipeBrewClipboard } from '~/composables/useRecipeBrewClipboard'
import { ebcToRGB } from '~/server/utils/calculations/color'
import type { BeerStyle, RecipeListItem } from '~/types'

const HighlightedText = defineComponent({
  props: { parts: { type: Array as PropType<Array<{ text: string; match: boolean }>>, required: true } },
  setup(props) {
    return () => props.parts.map((part, index) => h('span', { key: index, class: part.match ? 'rounded bg-yellow-200 px-0.5 text-yellow-950' : '' }, part.text))
  },
})

const ColorCell = defineComponent({
  props: { color: { type: Number as PropType<number | null | undefined>, default: null } },
  setup(props) {
    return () => h('span', { class: 'inline-flex items-center gap-1' }, [
      h('span', { class: 'h-3 w-3 rounded-full border', style: { backgroundColor: ebcToRGB(props.color ?? 0) } }),
      `${props.color?.toFixed(0) || '—'} EBC`,
    ])
  },
})

const { t } = useI18n()
const recipes = ref<RecipeListItem[]>([])
const styles = ref<BeerStyle[]>([])
type RecipeGroupBy = 'flat' | 'style' | 'code'
type ActiveTab = 'list' | 'style'

const search = ref('')
const debouncedSearch = ref('')
const sortKey = ref<'name' | 'type' | 'style' | 'og' | 'ibu' | 'abv'>('name')
const groupBy = ref<RecipeGroupBy>('flat')
const activeTab = ref<ActiveTab>('list')
const fileInput = ref<HTMLInputElement | null>(null)
const filterInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const menu = ref({ open: false, x: 0, y: 0, recipe: null as RecipeListItem | null })
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let longPressTimer: ReturnType<typeof setTimeout> | undefined
const { downloadBeerXml } = useRecipeExport()
const { exportCsv } = useCsvExport()
const { copyRecipeToBrew, duplicateRecipe } = useRecipeBrewClipboard()

const viewTabs: { value: ActiveTab; label: string }[] = [
  { value: 'list', label: 'styleAnalysis.tabs.list' },
  { value: 'style', label: 'styleAnalysis.tabs.styleAnalysis' },
]
const recipeGroupValues: RecipeGroupBy[] = ['flat', 'style', 'code']
const groupByOptions: { value: RecipeGroupBy; label: string }[] = [
  { value: 'flat', label: 'recipe.groupBy.flat' },
  { value: 'style', label: 'recipe.groupBy.style' },
  { value: 'code', label: 'recipe.groupBy.code' },
]

const recipeMenuItems = computed(() => [
  { key: 'copy-to-brew', label: t('recipes.contextMenu.copyToBrew') },
  { key: 'duplicate', label: t('recipes.contextMenu.duplicate') },
  { key: 'export', label: t('recipes.contextMenu.exportBeerXml') },
  { key: 'delete', label: t('recipes.contextMenu.delete'), destructive: true },
])

const styleNameById = computed<Record<number, string>>(() => Object.fromEntries(styles.value.map((s) => [s.id, s.name])))
function styleName(styleId: number | null | undefined): string {
  if (styleId == null) return ''
  return styleNameById.value[styleId] ?? ''
}

function codePrefix(code: string | null | undefined): string {
  const match = code?.trim().match(/^[^\d-]+/)
  return match?.[0].trim() || '—'
}

function recipeGroupPath(recipe: RecipeListItem): string {
  if (groupBy.value === 'style') return styleName(recipe.styleId) || '—'
  return codePrefix(recipe.code)
}

function searchable(recipe: RecipeListItem): string {
  return [recipe.searchText, recipe.name, recipe.code, recipe.type, recipe.notes, styleName(recipe.styleId)].filter(Boolean).join(' ').toLowerCase()
}

const filtered = computed(() => {
  let list = recipes.value
  if (debouncedSearch.value) {
    const s = debouncedSearch.value.toLowerCase()
    list = list.filter((r) => searchable(r).includes(s))
  }
  const key = sortKey.value
  return [...list].sort((a, b) => {
    if (key === 'style') return styleName(a.styleId).localeCompare(styleName(b.styleId))
    if (key === 'name' || key === 'type') return (a[key] ?? '').localeCompare(b[key] ?? '')
    return (a[key] ?? 0) - (b[key] ?? 0)
  })
})

const styleAnalysisItems = computed(() => filtered.value.map((recipe) => ({ ...recipe, styleName: styleName(recipe.styleId) })))

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

async function loadRecipes() {
  recipes.value = await $fetch<RecipeListItem[]>('/api/recipes')
}
async function deleteRecipe(id: number) {
  if (confirm(t('common.confirm') + '?')) {
    await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    await loadRecipes()
  }
}

async function exportRecipe(recipe: RecipeListItem) {
  await downloadBeerXml(recipe.id, recipe.name)
}

function exportCsvFile() {
  exportCsv('recipes', filtered.value, [
    { header: t('common.name'), value: (r) => r.name },
    { header: t('recipe.type'), value: (r) => r.type ?? '' },
    { header: t('recipe.style'), value: (r) => styleName(r.styleId) },
    { header: 'OG', value: (r) => (r.og ?? 0).toFixed(3) },
    { header: 'FG', value: (r) => (r.fg ?? 0).toFixed(3) },
    { header: 'IBU', value: (r) => (r.ibu ?? 0).toFixed(0) },
    { header: 'EBC', value: (r) => (r.color ?? 0).toFixed(0) },
    { header: 'ABV', value: (r) => (r.abv ?? 0).toFixed(1) },
  ])
}

function openRecipeMenu(recipe: RecipeListItem, event: MouseEvent | PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  menu.value = { open: true, x: event.clientX, y: event.clientY, recipe }
}

function startLongPress(recipe: RecipeListItem, event: PointerEvent) {
  if (event.pointerType === 'mouse') return
  cancelLongPress()
  longPressTimer = setTimeout(() => openRecipeMenu(recipe, event), 550)
}

function cancelLongPress() {
  if (longPressTimer) clearTimeout(longPressTimer)
}

async function handleRecipeAction(action: string) {
  const recipe = menu.value.recipe
  if (!recipe) return
  if (action === 'copy-to-brew') {
    const created = await copyRecipeToBrew(recipe)
    await navigateTo(`/brews/${created.id}`)
  } else if (action === 'duplicate') {
    const created = await duplicateRecipe(recipe)
    await loadRecipes()
    await navigateTo(`/recipes/${created.id}`)
  } else if (action === 'export') {
    await exportRecipe(recipe)
  } else if (action === 'delete') {
    await deleteRecipe(recipe.id)
  }
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const res = await $fetch<{ imported: number }>('/api/recipes/import', { method: 'POST', body: text, headers: { 'Content-Type': 'text/plain' } })
    importMessage.value = t('recipe.imported', { count: res.imported })
    await loadRecipes()
  } catch {
    importMessage.value = t('recipe.importFailed')
  } finally {
    input.value = ''
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
  const storedGroupBy = localStorage.getItem('recipes:tree:groupBy') as RecipeGroupBy | null
  if (storedGroupBy && recipeGroupValues.includes(storedGroupBy)) groupBy.value = storedGroupBy
  window.addEventListener('keydown', onShortcut)
  await loadRecipes()
  styles.value = await $fetch<BeerStyle[]>('/api/styles')
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
  if (import.meta.client) localStorage.setItem('recipes:tree:groupBy', value)
})
</script>
