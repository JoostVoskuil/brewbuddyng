<template>
  <div>
    <InventoryPrintHeader
      :brewery-name="printBreweryName"
      :brewery-logo="printBreweryLogo"
      :title="$t('inventory.title')"
      :generated-at="generatedAt"
    />

    <div class="flex items-center justify-between mb-2 print:hidden">
      <h1 class="text-2xl font-bold">{{ $t('inventory.title') }}</h1>
      <div class="flex items-center gap-2">
        <button class="px-3 py-2 border rounded-md text-sm font-medium hover:bg-muted" @click="exportCurrentCsv">
          {{ $t('common.exportCsv') }}
        </button>
        <button class="px-3 py-2 border rounded-md text-sm font-medium hover:bg-muted" @click="printReport">
          {{ $t('common.print') }}
        </button>
      </div>
    </div>
    <p class="text-sm text-muted-foreground mb-6 print:hidden">{{ $t('inventory.subtitle') }}</p>

    <div v-if="pending" class="text-sm text-muted-foreground">{{ $t('common.loading') }}</div>

    <div v-else class="space-y-5">
      <div class="flex flex-wrap gap-2 border-b print:hidden">
        <button
          v-for="tab in tabs"
          :key="tab.kind"
          class="px-3 py-2 text-sm border-b-2 -mb-px"
          :class="activeKind === tab.kind ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground'"
          @click="activeKind = tab.kind"
        >
          {{ $t(tab.labelKey) }}
          <span class="text-xs text-muted-foreground">({{ rowsByKind[tab.kind].length }})</span>
        </button>
      </div>

      <InventoryFilters
        v-model:search="filters.search"
        v-model:type="filters.type"
        v-model:on-stock-only="filters.onStockOnly"
        v-model:low-stock-only="filters.lowStockOnly"
        :type-options="typeOptions"
      />

      <section class="break-after-page">
        <div class="flex items-baseline justify-between mb-2">
          <h2 class="font-semibold text-lg">{{ $t(activeTab.labelKey) }}</h2>
          <span class="text-sm text-muted-foreground">
            {{ filteredRows.length }} / {{ currentRows.length }} {{ $t('inventory.items') }}
          </span>
        </div>

        <div class="overflow-x-auto border rounded-lg">
          <table class="w-full text-sm min-w-[920px]">
            <thead class="bg-muted">
              <tr>
                <th class="text-left p-2">{{ $t('common.name') }}</th>
                <th class="text-left p-2">{{ $t('inventory.supplierOrigin') }}</th>
                <th class="text-left p-2">{{ $t('common.type') }}</th>
                <th class="text-right p-2">{{ $t('inventory.inStock') }}</th>
                <th class="text-center p-2">{{ $t('inventory.alwaysOnStock') }}</th>
                <th class="text-right p-2">{{ $t('inventory.lowStockThreshold') }}</th>
                <th class="text-left p-2">{{ $t('common.notes') }}</th>
                <th class="text-right p-2 print:hidden">{{ $t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredRows"
                :key="`${row.kind}-${row.id}`"
                class="border-t cursor-pointer hover:bg-muted/50 break-inside-avoid"
                :class="{ 'bg-destructive/5': isInventoryLow(row) }"
                @click="openDatabaseRow(row)"
              >
                <td class="p-2 font-medium">{{ row.name }}</td>
                <td class="p-2">{{ row.supplierOrigin || '—' }}</td>
                <td class="p-2">{{ row.type || '—' }}</td>
                <td class="p-2 text-right" @click.stop>
                  <div v-if="row.stockTracked" class="inline-flex items-center gap-2">
                    <input
                      v-model.number="row.inventory"
                      type="number"
                      step="0.1"
                      class="w-24 px-2 py-1 border rounded bg-background text-right print:hidden"
                    />
                    <span class="font-mono">{{ formatAmount(row) }}</span>
                  </div>
                  <span v-else>—</span>
                </td>
                <td class="p-2 text-center" @click.stop>
                  <input
                    v-if="row.stockTracked"
                    v-model="row.alwaysOnStock"
                    type="checkbox"
                    class="rounded print:hidden"
                  />
                  <span class="hidden print:inline">{{ row.alwaysOnStock ? $t('common.yes') : $t('common.no') }}</span>
                  <span v-if="!row.stockTracked">—</span>
                </td>
                <td class="p-2 text-right font-mono">
                  {{ row.lowStockThreshold == null ? '—' : `${row.lowStockThreshold} ${row.unit}` }}
                </td>
                <td class="p-2 max-w-xs truncate" :title="row.notes">{{ row.notes || '—' }}</td>
                <td class="p-2 text-right print:hidden" @click.stop>
                  <button
                    v-if="row.stockTracked"
                    class="px-3 py-1 border rounded-md text-xs"
                    :disabled="savingId === `${row.kind}-${row.id}`"
                    @click="save(row)"
                  >
                    {{ savingId === `${row.kind}-${row.id}` ? $t('common.saving') : $t('common.save') }}
                  </button>
                </td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td colspan="8" class="p-3 text-center text-muted-foreground">{{ $t('common.noResults') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="border-t pt-4 flex justify-end text-sm print:hidden">
        <span class="font-medium">{{ $t('inventory.totalValue') }}:&nbsp;</span>
        <span class="font-mono font-semibold">{{ totalValue.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInventoryFilter, type InventoryFilters, type InventoryKind, type InventoryRow } from '~/composables/useInventoryFilter'

type RawRow = Record<string, unknown>

interface TabConfig {
  kind: InventoryKind
  endpoint: string
  unit: string
  labelKey: string
  stockTracked: boolean
}

const { t, locale } = useI18n()
const router = useRouter()
const { exportCsv } = useCsvExport()
const { filterInventoryRows, inventoryCsvRows, isInventoryLow } = useInventoryFilter()
const pending = ref(true)
const savingId = ref<string | null>(null)
const activeKind = ref<InventoryKind>('fermentables')
const brewerySettings = ref<Record<string, string>>({})
const filters = reactive<InventoryFilters>({ search: '', type: '', onStockOnly: false, lowStockOnly: false })

const tabs: TabConfig[] = [
  { kind: 'fermentables', endpoint: '/api/fermentables', unit: 'kg', labelKey: 'inventory.fermentables', stockTracked: true },
  { kind: 'hops', endpoint: '/api/hops', unit: 'g', labelKey: 'inventory.hops', stockTracked: true },
  { kind: 'yeasts', endpoint: '/api/yeasts', unit: 'pkg', labelKey: 'inventory.yeasts', stockTracked: true },
  { kind: 'miscs', endpoint: '/api/miscs', unit: 'g', labelKey: 'inventory.miscs', stockTracked: true },
  { kind: 'waters', endpoint: '/api/waters', unit: '', labelKey: 'inventory.waters', stockTracked: false },
]

const rowsByKind = reactive<Record<InventoryKind, InventoryRow[]>>({
  fermentables: [],
  hops: [],
  yeasts: [],
  miscs: [],
  waters: [],
})

const activeTab = computed(() => tabs.find((tab) => tab.kind === activeKind.value) ?? tabs[0]!)
const currentRows = computed(() => rowsByKind[activeKind.value])
const typeOptions = computed(() => Array.from(new Set(currentRows.value.map((row) => row.type).filter(Boolean))).sort())
const filteredRows = computed(() => filterInventoryRows(currentRows.value, filters))
const printBreweryName = computed(() => brewerySettings.value.breweryName || t('settings.printHeader'))
const printBreweryLogo = computed(() => brewerySettings.value.breweryLogo || '')
const generatedAt = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))
const totalValue = computed(() =>
  tabs.reduce((sum, tab) => sum + rowsByKind[tab.kind].reduce((part, row) => part + (row.inventory ?? 0) * row.cost, 0), 0),
)

watch(activeKind, () => {
  filters.type = ''
})

function normalize(tab: TabConfig, rows: RawRow[]): InventoryRow[] {
  return rows.map((raw) => ({
    id: Number(raw.id),
    kind: tab.kind,
    name: String(raw.name ?? ''),
    supplierOrigin: supplierOrigin(tab.kind, raw),
    type: String(raw.type ?? (tab.kind === 'waters' ? t('inventory.water') : '')),
    inventory: tab.stockTracked ? Number(raw.inventory ?? 0) : null,
    unit: tab.unit,
    alwaysOnStock: tab.stockTracked ? Boolean(raw.alwaysOnStock) : false,
    lowStockThreshold: tab.stockTracked ? 0 : null,
    notes: String(raw.notes ?? ''),
    cost: Number(raw.cost ?? 0),
    stockTracked: tab.stockTracked,
    raw,
  }))
}

function supplierOrigin(kind: InventoryKind, row: RawRow): string {
  if (kind === 'hops') return String(row.origin ?? '')
  if (kind === 'yeasts') return String(row.laboratory ?? '')
  if (kind === 'fermentables') return String(row.supplier ?? '')
  return String(row.useFor ?? row.origin ?? '')
}

async function load() {
  pending.value = true
  const [settings, ...results] = await Promise.all([
    $fetch<Record<string, string>>('/api/settings'),
    ...tabs.map((tab) => $fetch<RawRow[]>(tab.endpoint)),
  ])
  brewerySettings.value = settings
  tabs.forEach((tab, index) => {
    rowsByKind[tab.kind] = normalize(tab, results[index] ?? [])
  })
  pending.value = false
}

function formatAmount(row: InventoryRow): string {
  if (row.inventory == null) return '—'
  return `${Number(row.inventory).toLocaleString(locale.value, { maximumFractionDigits: 2 })} ${row.unit}`.trim()
}

function exportCurrentCsv() {
  const rows: ReturnType<typeof inventoryCsvRows> = inventoryCsvRows(filteredRows.value)
  exportCsv<(typeof rows)[number]>(`inventory-${activeKind.value}`, rows, [
    { header: t('inventory.title'), value: (row) => t(`inventory.${row.category}`) },
    { header: t('common.name'), value: (row) => row.name },
    { header: t('inventory.supplierOrigin'), value: (row) => row.supplierOrigin },
    { header: t('common.type'), value: (row) => row.type },
    { header: t('inventory.inStock'), value: (row) => row.inventory },
    { header: t('inventory.unit'), value: (row) => row.unit },
    { header: t('inventory.alwaysOnStock'), value: (row) => row.alwaysOnStock },
    { header: t('inventory.lowStockThreshold'), value: (row) => row.lowStockThreshold },
    { header: t('common.notes'), value: (row) => row.notes },
  ])
}

function printReport() {
  if (import.meta.client) window.print()
}

function openDatabaseRow(row: InventoryRow) {
  router.push({ path: `/databases/${row.kind}`, query: { focus: String(row.id) } })
}

async function save(row: InventoryRow) {
  savingId.value = `${row.kind}-${row.id}`
  try {
    const tab = tabs.find((item) => item.kind === row.kind)!
    await $fetch(`${tab.endpoint}/${row.id}`, {
      method: 'PUT',
      body: {
        inventory: row.inventory,
        cost: row.cost,
        alwaysOnStock: row.alwaysOnStock,
      },
    })
  } finally {
    savingId.value = null
  }
}

onMounted(load)
</script>

<style scoped>
@media print {
  table {
    border-collapse: collapse;
  }

  th,
  td {
    border-color: #d1d5db;
  }
}
</style>
