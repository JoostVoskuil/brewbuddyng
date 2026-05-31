<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('databases.hops') }}</h1>
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
            <th class="text-right p-3 font-medium">Alpha %</th>
            <th class="text-right p-3 font-medium">Beta %</th>
            <th class="text-left p-3 font-medium">{{ $t('common.type') }}</th>
            <th class="text-left p-3 font-medium">Form</th>
            <th class="text-left p-3 font-medium">{{ $t('databases.origin') }}</th>
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
            <td class="p-3 text-right">{{ item.alpha?.toFixed(1) }}</td>
            <td class="p-3 text-right">{{ item.beta?.toFixed(1) }}</td>
            <td class="p-3">{{ item.type }}</td>
            <td class="p-3">{{ item.form }}</td>
            <td class="p-3">{{ item.origin }}</td>
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
              <label class="text-sm font-medium">Alpha %</label
              ><input
                v-model.number="form.alpha"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Beta %</label
              ><input
                v-model.number="form.beta"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-sm font-medium">HSI</label
              ><input
                v-model.number="form.hsi"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.storageTemp') }}</label
              ><input
                v-model.number="form.storageTemp"
                type="number"
                step="0.1"
                placeholder="20"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.storageMethod') }}</label>
              <select
                v-model="form.storageMethod"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="">{{ $t('databases.useDefault') }}</option>
                <option v-for="method in storageMethods" :key="method" :value="method">
                  {{ $t(`hop.storageMethods.${method}`) }}
                </option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-sm font-medium">{{ $t('common.type') }}</label>
              <select
                v-model="form.type"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="Bittering">Bittering</option>
                <option value="Aroma">Aroma</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Form</label>
              <select
                v-model="form.form"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="Pellet">Pellet</option>
                <option value="Plug">Plug</option>
                <option value="Leaf">Leaf</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.origin') }}</label
              ><input
                v-model="form.origin"
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
import type { Hop } from '~/types'

const storageMethods = ['freezer', 'fridge', 'room', 'vacuum', 'foil'] as const

function createEmptyForm(): Partial<Hop> {
  return {
    name: '',
    alpha: 0,
    beta: 0,
    type: 'Both',
    form: 'Pellet',
    hsi: 0,
    storageTemp: 0,
    storageMethod: '',
    alwaysOnStock: false,
    origin: '',
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
} = useResourceCrud<Hop>('hops', createEmptyForm, ['name', 'origin'])

const chartProperties = [
  { key: 'alpha', label: 'Alpha %' },
  { key: 'beta', label: 'Beta %' },
  { key: 'hsi', label: 'HSI' },
]
</script>
