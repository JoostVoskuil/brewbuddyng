<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('databases.fermentables') }}</h1>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        @click="showAdd = true"
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

    <IngredientPropertyChart :items="items" :properties="chartProperties" stock-key="inventory" />

    <div class="border rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted">
          <tr>
            <th class="text-left p-3 font-medium">{{ $t('common.name') }}</th>
            <th class="text-left p-3 font-medium">{{ $t('common.type') }}</th>
            <th class="text-right p-3 font-medium">{{ $t('databases.yield') }}</th>
            <th class="text-right p-3 font-medium">{{ $t('databases.colorEBC') }}</th>
            <th class="text-left p-3 font-medium">{{ $t('databases.origin') }}</th>
            <th class="text-left p-3 font-medium">{{ $t('databases.supplier') }}</th>
            <th class="text-right p-3 font-medium">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.id" class="border-t hover:bg-muted/50">
            <td class="p-3 font-medium">
              <span class="inline-flex items-center gap-2">
                {{ item.name }}
                <span v-if="item.alwaysOnStock" :title="$t('inventory.alwaysOnStock')">∞</span>
              </span>
            </td>
            <td class="p-3">{{ item.type }}</td>
            <td class="p-3 text-right">{{ item.yield?.toFixed(1) }}%</td>
            <td class="p-3 text-right">
              <span class="inline-flex items-center gap-1">
                <span
                  class="w-3 h-3 rounded-full border"
                  :style="{ backgroundColor: ebcToRGB(item.color) }"
                ></span>
                {{ item.color?.toFixed(0) }}
              </span>
            </td>
            <td class="p-3">{{ item.origin }}</td>
            <td class="p-3">{{ item.supplier }}</td>
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
            <td colspan="7" class="p-6 text-center text-muted-foreground">
              {{ $t('common.noResults') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Dialog -->
    <div
      v-if="showAdd || editingItem"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDialog"
    >
      <div class="bg-card border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingItem ? $t('common.edit') : $t('common.add') }}
          {{ $t('databases.fermentables') }}
        </h2>
        <form class="space-y-3" @submit.prevent="saveItem">
          <div>
            <label class="text-sm font-medium">{{ $t('common.name') }}</label
            ><input
              v-model="form.name"
              required
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="form.alwaysOnStock" type="checkbox" class="rounded" />
            {{ $t('inventory.alwaysOnStock') }}
          </label>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">{{ $t('common.type') }}</label>
              <select
                v-model="form.type"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.grainType') }}</label>
              <select
                v-model="form.grainType"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option v-for="t in grainTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-sm font-medium">{{ $t('databases.yield') }} (%)</label
              ><input
                v-model.number="form.yield"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.colorEBC') }}</label
              ><input
                v-model.number="form.color"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.moisture') }} (%)</label
              ><input
                v-model.number="form.moisture"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">{{ $t('databases.origin') }}</label
              ><input
                v-model="form.origin"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.supplier') }}</label
              ><input
                v-model="form.supplier"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('common.substitutes') }}</label
            ><input
              v-model="form.substitutes"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('common.notes') }}</label
            ><textarea
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
import { ebcToRGB } from '~/server/utils/calculations/color'
import type { Fermentable } from '~/types'

const types = ['Grain', 'Sugar', 'Extract', 'Dry Extract', 'Adjunct']
const grainTypes = ['Base', 'Roast', 'Crystal', 'Kilned', 'Sour', 'Special', 'No malt']

function createEmptyForm(): Partial<Fermentable> {
  return {
    name: '',
    type: 'Grain',
    yield: 0,
    color: 0,
    origin: '',
    supplier: '',
    moisture: 0,
    grainType: 'Base',
    alwaysOnStock: false,
    substitutes: '',
    notes: '',
  }
}

const {
  search,
  showAdd,
  editingItem,
  form,
  filtered,
  items,
  editItem,
  closeDialog,
  saveItem,
  deleteItem,
} = useResourceCrud<Fermentable>('fermentables', createEmptyForm, ['name', 'origin', 'supplier'])

const i18n = useI18n()
const chartProperties = computed(() => [
  { key: 'yield', label: i18n.t('databases.yield') },
  { key: 'color', label: i18n.t('databases.colorEBC') },
  { key: 'moisture', label: i18n.t('databases.moisture') },
])
</script>
