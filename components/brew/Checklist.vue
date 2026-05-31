<template>
  <section class="space-y-4">
    <div class="flex flex-wrap gap-2 justify-between items-center print:hidden">
      <h3 class="font-semibold">{{ $t('brew.tabs.checklist.title') }}</h3>
      <div class="flex gap-2">
        <button class="px-3 py-2 border rounded-md text-sm" @click="showDialog = true">
          {{ $t('brew.tabs.checklist.edit') }}
        </button>
        <button class="px-3 py-2 border rounded-md text-sm" @click="printChecklist">
          {{ $t('brew.tabs.checklist.print') }}
        </button>
      </div>
    </div>
    <div class="border rounded-lg p-4 space-y-2 print:border-0">
      <div
        v-for="item in checklist"
        :key="item.sortOrder ?? item.itemText"
        class="flex items-center justify-between border-t first:border-t-0 py-2"
      >
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            :checked="item.checked ?? false"
            @change="toggle(item, ($event.target as HTMLInputElement).checked)"
          />
          <span :class="item.checked ? 'line-through text-muted-foreground' : ''">{{
            item.itemText
          }}</span>
        </label>
      </div>
      <p v-if="!checklist.length" class="text-sm text-muted-foreground">
        {{ $t('brew.tabs.checklist.empty') }}
      </p>
    </div>
    <BrewDialogsChecklistDialog
      v-if="showDialog"
      :items="checklist"
      :brew-id="brew.id"
      @close="showDialog = false"
      @save="saveItems"
    />
  </section>
</template>

<script setup lang="ts">
import type { Brew, BrewChecklistItem, RecipeWithIngredients } from '~/types'

const props = defineProps<{
  brew: Brew & { checklist: BrewChecklistItem[] }
  recipe: RecipeWithIngredients | null
}>()
const emit = defineEmits<{ save: [patch: Partial<Brew> & { checklist?: BrewChecklistItem[] }] }>()
const showDialog = ref(false)

const defaults = computed(() => {
  const base = [
    'Sanitise fermenter and transfer lines',
    'Weigh grain bill',
    'Mill grain',
    'Prepare brewing water and salts',
    'Prepare yeast / starter',
    'Check thermometer and hydrometer',
    'Clean kettle, mash tun and chiller',
  ]
  if ((props.recipe?.hops.length ?? 0) > 0) base.push('Weigh hop additions')
  if ((props.recipe?.yeasts.length ?? 0) > 0) base.push('Temper yeast to pitching temperature')
  return base
})

const checklist = computed(() => {
  const saved = props.brew.checklist.filter((item) => !item.itemText.startsWith('HOP|'))
  if (saved.length) return [...saved].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  return defaults.value.map((text, index) => ({
    id: 0,
    brewId: props.brew.id,
    itemText: text,
    checked: false,
    sortOrder: index,
  }))
})

function toggle(item: BrewChecklistItem, checked: boolean) {
  const next = checklist.value.map((row) =>
    row.itemText === item.itemText ? { ...row, checked } : { ...row },
  )
  emit('save', {
    checklist: [...props.brew.checklist.filter((row) => row.itemText.startsWith('HOP|')), ...next],
  })
}
function saveItems(items: BrewChecklistItem[]) {
  showDialog.value = false
  emit('save', {
    checklist: [...props.brew.checklist.filter((row) => row.itemText.startsWith('HOP|')), ...items],
  })
}
function printChecklist() {
  if (import.meta.client) window.print()
}
</script>
