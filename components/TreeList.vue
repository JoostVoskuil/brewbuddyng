<script setup lang="ts" generic="T extends Record<string, unknown>">
type GroupPath = string | string[]
type TreeEntry<T> =
  | { kind: 'group'; key: string; label: string; count: number; level: number }
  | { kind: 'item'; key: string; item: T }

interface GroupNode<T> {
  key: string
  label: string
  level: number
  items: T[]
  children: GroupNode<T>[]
  childByLabel: Map<string, GroupNode<T>>
}

const props = withDefaults(
  defineProps<{
    items: T[]
    groupBy: (item: T) => GroupPath
    keyField: keyof T
    storageKey: string
    colspan?: number
    forceExpand?: boolean
  }>(),
  { colspan: 1, forceExpand: false },
)

defineSlots<{
  header(props: { label: string; count: number; level: number }): unknown
  row(props: { item: T }): unknown
}>()

const expanded = ref<Record<string, boolean>>({})
const readyToPersist = ref(false)

const groups = computed(() => {
  const roots: GroupNode<T>[] = []
  const rootByLabel = new Map<string, GroupNode<T>>()

  for (const item of props.items) {
    const rawPath = props.groupBy(item)
    const labels = (Array.isArray(rawPath) ? rawPath : [rawPath]).filter(
      (label): label is string => label.length > 0,
    )
    if (labels.length === 0) continue

    let siblings = roots
    let siblingMap = rootByLabel
    let parentKey = ''
    for (const [level, label] of labels.entries()) {
      const key = parentKey ? `${parentKey}\u001F${label}` : label
      let node = siblingMap.get(label)
      if (!node) {
        node = { key, label, level, items: [], children: [], childByLabel: new Map() }
        siblingMap.set(label, node)
        siblings.push(node)
      }
      node.items.push(item)
      siblings = node.children
      siblingMap = node.childByLabel
      parentKey = key
    }
  }

  return roots
})

const visibleRows = computed<TreeEntry<T>[]>(() => {
  const rows: TreeEntry<T>[] = []
  const append = (nodes: GroupNode<T>[]) => {
    for (const node of nodes) {
      rows.push({
        kind: 'group',
        key: node.key,
        label: node.label,
        count: node.items.length,
        level: node.level,
      })
      if (!isExpanded(node.key)) continue
      if (node.children.length > 0) append(node.children)
      else {
        for (const item of node.items) {
          rows.push({ kind: 'item', key: String(item[props.keyField]), item })
        }
      }
    }
  }
  append(groups.value)
  return rows
})

function isExpanded(key: string): boolean {
  return props.forceExpand || expanded.value[key] !== false
}

function toggle(key: string) {
  expanded.value = { ...expanded.value, [key]: !isExpanded(key) }
}

onMounted(() => {
  const stored = localStorage.getItem(props.storageKey)
  if (stored) {
    try {
      expanded.value = JSON.parse(stored) as Record<string, boolean>
    } catch {
      expanded.value = {}
    }
  }
  readyToPersist.value = true
})

watch(
  expanded,
  (value) => {
    if (readyToPersist.value) localStorage.setItem(props.storageKey, JSON.stringify(value))
  },
  { deep: true },
)
</script>

<template>
  <tbody>
    <template v-for="entry in visibleRows" :key="`${entry.kind}:${entry.key}`">
      <tr v-if="entry.kind === 'group'" class="border-t bg-muted/40">
        <td :colspan="colspan" class="p-0">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left font-medium hover:bg-muted"
            :style="{ paddingLeft: `${0.75 + entry.level * 1.25}rem` }"
            @click="toggle(entry.key)"
          >
            <span class="w-4 text-muted-foreground" aria-hidden="true">
              {{ isExpanded(entry.key) ? '▾' : '▸' }}
            </span>
            <slot name="header" :label="entry.label" :count="entry.count" :level="entry.level">
              <span>{{ entry.label }}</span>
              <span class="text-sm text-muted-foreground">({{ entry.count }})</span>
            </slot>
          </button>
        </td>
      </tr>
      <slot v-else name="row" :item="entry.item" />
    </template>
  </tbody>
</template>
