<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('databases.waters') }}</h1>
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
    <IngredientPropertyChart :items="items" :properties="chartProperties" />
    <div class="border rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted">
          <tr>
            <th class="text-left p-3 font-medium">{{ $t('common.name') }}</th>
            <th class="text-center p-3 font-medium">{{ $t('databases.defaultWater') }}</th>
            <th class="text-right p-3 font-medium">Ca</th>
            <th class="text-right p-3 font-medium">Mg</th>
            <th class="text-right p-3 font-medium">Na</th>
            <th class="text-right p-3 font-medium">SO₄</th>
            <th class="text-right p-3 font-medium">Cl</th>
            <th class="text-right p-3 font-medium">HCO₃</th>
            <th class="text-right p-3 font-medium">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.id" class="border-t hover:bg-muted/50">
            <td class="p-3 font-medium">
              <span class="inline-flex items-center gap-2">
                {{ item.name }}
                <span
                  v-if="item.isDefault"
                  class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  ⭐ {{ $t('databases.waterDefaultBadge') }}
                </span>
              </span>
            </td>
            <td class="p-3 text-center">
              <input type="checkbox" class="rounded" :checked="Boolean(item.isDefault)" disabled />
            </td>
            <td class="p-3 text-right">{{ item.calcium }}</td>
            <td class="p-3 text-right">{{ item.magnesium }}</td>
            <td class="p-3 text-right">{{ item.sodium }}</td>
            <td class="p-3 text-right">{{ item.sulfate }}</td>
            <td class="p-3 text-right">{{ item.chloride }}</td>
            <td class="p-3 text-right">{{ item.bicarbonate }}</td>
            <td class="p-3 text-right">
              <button class="text-primary hover:underline mr-2" @click="editItem(item)">
                {{ $t('common.edit') }}
              </button>
              <button class="text-destructive hover:underline" @click="deleteItem(item.id)">
                {{ $t('common.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showAdd || editingItem"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDialog"
    >
      <div class="bg-card border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingItem ? $t('common.edit') : $t('common.add') }}
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
            <input v-model="form.isDefault" type="checkbox" class="rounded" />
            {{ $t('databases.defaultWater') }}
          </label>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-sm font-medium">Calcium (ppm)</label
              ><input
                v-model.number="form.calcium"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Magnesium (ppm)</label
              ><input
                v-model.number="form.magnesium"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Sodium (ppm)</label
              ><input
                v-model.number="form.sodium"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Sulfate (ppm)</label
              ><input
                v-model.number="form.sulfate"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Chloride (ppm)</label
              ><input
                v-model.number="form.chloride"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Bicarbonate (ppm)</label
              ><input
                v-model.number="form.bicarbonate"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">pH</label
              ><input
                v-model.number="form.ph"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
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
import type { Water } from '~/types'

function createEmptyForm(): Partial<Water> {
  return {
    name: '',
    calcium: 0,
    magnesium: 0,
    sodium: 0,
    sulfate: 0,
    chloride: 0,
    bicarbonate: 0,
    ph: 7.0,
    isDefault: false,
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
} = useResourceCrud<Water>('waters', createEmptyForm, ['name'])

const chartProperties = [
  { key: 'calcium', label: 'Ca' },
  { key: 'magnesium', label: 'Mg' },
  { key: 'sodium', label: 'Na' },
  { key: 'sulfate', label: 'SO₄' },
  { key: 'chloride', label: 'Cl' },
  { key: 'bicarbonate', label: 'HCO₃' },
]
</script>
