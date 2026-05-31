<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div class="bg-background border rounded-lg shadow-xl w-full max-w-2xl p-4 space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold">{{ $t('brew.tabs.checklist.editTitle') }}</h3>
        <button class="text-sm" @click="$emit('close')">×</button>
      </div>
      <div class="space-y-2 max-h-[60vh] overflow-y-auto">
        <div v-for="(item, index) in rows" :key="index" class="grid grid-cols-[1fr_auto] gap-2">
          <input v-model="item.itemText" class="px-3 py-2 border rounded-md bg-background" />
          <button type="button" class="px-3 py-2 border rounded-md" @click="rows.splice(index, 1)">
            −
          </button>
        </div>
      </div>
      <div class="flex justify-between gap-2">
        <button type="button" class="px-3 py-2 border rounded-md text-sm" @click="add">
          {{ $t('common.add') }}
        </button>
        <button
          type="button"
          class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          @click="save"
        >
          {{ $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BrewChecklistItem } from '~/types'

const props = defineProps<{ items: BrewChecklistItem[]; brewId: number }>()
const emit = defineEmits<{ close: []; save: [items: BrewChecklistItem[]] }>()
const rows = ref(props.items.map((item) => ({ ...item })))

function add() {
  rows.value.push({
    id: 0,
    brewId: props.brewId,
    itemText: '',
    checked: false,
    sortOrder: rows.value.length,
  })
}
function save() {
  emit(
    'save',
    rows.value
      .filter((item) => item.itemText.trim())
      .map((item, index) => ({ ...item, sortOrder: index })),
  )
}
</script>
