<template>
  <div class="grid gap-3 md:grid-cols-4 print:hidden">
    <label class="flex flex-col text-sm md:col-span-2">
      <span class="mb-1 text-muted-foreground">{{ $t('common.search') }}</span>
      <input
        :value="search"
        type="search"
        class="border rounded-md px-3 py-2 bg-background"
        :placeholder="$t('inventory.searchPlaceholder')"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <label class="flex flex-col text-sm">
      <span class="mb-1 text-muted-foreground">{{ $t('common.type') }}</span>
      <select
        :value="type"
        class="border rounded-md px-3 py-2 bg-background"
        @change="$emit('update:type', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ $t('common.all') }}</option>
        <option v-for="option in typeOptions" :key="option" :value="option">{{ option }}</option>
      </select>
    </label>
    <div class="flex flex-col justify-end gap-2 text-sm">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="onStockOnly"
          @change="$emit('update:onStockOnly', ($event.target as HTMLInputElement).checked)"
        />
        {{ $t('inventory.onStockOnly') }}
      </label>
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="lowStockOnly"
          @change="$emit('update:lowStockOnly', ($event.target as HTMLInputElement).checked)"
        />
        {{ $t('inventory.lowStockOnly') }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  search: string
  type: string
  typeOptions: string[]
  onStockOnly: boolean
  lowStockOnly: boolean
}>()

defineEmits<{
  'update:search': [value: string]
  'update:type': [value: string]
  'update:onStockOnly': [value: boolean]
  'update:lowStockOnly': [value: boolean]
}>()
</script>
