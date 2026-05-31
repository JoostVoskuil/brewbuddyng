<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('databases.styles') }}</h1>
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
    <div class="border rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted">
          <tr>
            <th class="text-left p-3 font-medium">{{ $t('common.name') }}</th>
            <th class="text-left p-3 font-medium">Guide</th>
            <th class="text-right p-3 font-medium">OG</th>
            <th class="text-right p-3 font-medium">IBU</th>
            <th class="text-right p-3 font-medium">ABV %</th>
            <th class="text-right p-3 font-medium">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.id" class="border-t hover:bg-muted/50">
            <td class="p-3 font-medium">{{ item.name }}</td>
            <td class="p-3">{{ item.styleGuide }}</td>
            <td class="p-3 text-right">
              {{ item.ogMin?.toFixed(3) }}–{{ item.ogMax?.toFixed(3) }}
            </td>
            <td class="p-3 text-right">{{ item.ibuMin }}–{{ item.ibuMax }}</td>
            <td class="p-3 text-right">{{ item.abvMin }}–{{ item.abvMax }}</td>
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
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">{{ $t('databases.styleGuide') }}</label
              ><input
                v-model="form.styleGuide"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.category') }}</label
              ><input
                v-model="form.category"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.categoryNumber') }}</label
              ><input
                v-model="form.categoryNumber"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.styleLetter') }}</label
              ><input
                v-model="form.styleLetter"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.styleType') }}</label>
              <select
                v-model="form.type"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option v-for="t in styleTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">OG min</label
              ><input
                v-model.number="form.ogMin"
                type="number"
                step="0.001"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">OG max</label
              ><input
                v-model.number="form.ogMax"
                type="number"
                step="0.001"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">FG min</label
              ><input
                v-model.number="form.fgMin"
                type="number"
                step="0.001"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">FG max</label
              ><input
                v-model.number="form.fgMax"
                type="number"
                step="0.001"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">IBU min</label
              ><input
                v-model.number="form.ibuMin"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">IBU max</label
              ><input
                v-model.number="form.ibuMax"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Color min (SRM)</label
              ><input
                v-model.number="form.colorMin"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Color max (SRM)</label
              ><input
                v-model.number="form.colorMax"
                type="number"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">ABV min (%)</label
              ><input
                v-model.number="form.abvMin"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">ABV max (%)</label
              ><input
                v-model.number="form.abvMax"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.carbMin') }}</label
              ><input
                v-model.number="form.carbMin"
                type="number"
                step="0.1"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label class="text-sm font-medium">{{ $t('databases.carbMax') }}</label
              ><input
                v-model.number="form.carbMax"
                type="number"
                step="0.1"
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
import type { BeerStyle } from '~/types'

const styleTypes = ['Ale', 'Lager', 'Mixed', 'Wheat', 'Cider', 'Mead'] as const

function createEmptyForm(): Partial<BeerStyle> {
  return {
    name: '',
    styleGuide: 'Custom',
    category: '',
    categoryNumber: '',
    styleLetter: '',
    type: 'Ale',
    ogMin: 1.04,
    ogMax: 1.06,
    fgMin: 1.008,
    fgMax: 1.016,
    ibuMin: 10,
    ibuMax: 40,
    colorMin: 4,
    colorMax: 20,
    abvMin: 4,
    abvMax: 6,
    carbMin: 0,
    carbMax: 4,
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
  editItem,
  closeDialog,
  saveItem,
  deleteItem,
} = useResourceCrud<BeerStyle>('styles', createEmptyForm, ['name', 'styleGuide'])
</script>
