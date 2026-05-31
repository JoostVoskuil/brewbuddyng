<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('databases.equipment') }}</h1>
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
            <th class="text-right p-3 font-medium">Batch (L)</th>
            <th class="text-right p-3 font-medium">Boil (L)</th>
            <th class="text-right p-3 font-medium">Boil time</th>
            <th class="text-right p-3 font-medium">Efficiency %</th>
            <th class="text-right p-3 font-medium">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.id" class="border-t hover:bg-muted/50">
            <td class="p-3 font-medium">{{ item.name }}</td>
            <td class="p-3 text-right">{{ item.batchSize }}</td>
            <td class="p-3 text-right">{{ item.boilSize }}</td>
            <td class="p-3 text-right">{{ item.boilTime }}</td>
            <td class="p-3 text-right">{{ item.efficiency }}</td>
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
      <div class="bg-card border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingItem ? $t('common.edit') : $t('common.add') }}
        </h2>
        <form class="space-y-4" @submit.prevent="saveItem">
          <!-- General -->
          <fieldset class="border rounded-md p-4">
            <legend class="px-1 text-sm font-semibold">{{ $t('databases.equip.general') }}</legend>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium">{{ $t('common.name') }}</label
                ><input
                  v-model="form.name"
                  required
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
            </div>
          </fieldset>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Mash -->
            <fieldset class="border rounded-md p-4">
              <legend class="px-1 text-sm font-semibold">{{ $t('databases.equip.mash') }}</legend>
              <div class="space-y-3">
                <div v-for="f in mashFields" :key="f.key">
                  <label class="text-sm font-medium"
                    >{{ $t(`databases.equip.${f.key}`) }} ({{ f.unit }})</label
                  ><input
                    v-model.number="form[f.key]"
                    type="number"
                    :step="f.step"
                    class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              </div>
            </fieldset>

            <!-- Lauter -->
            <fieldset class="border rounded-md p-4">
              <legend class="px-1 text-sm font-semibold">{{ $t('databases.equip.lauter') }}</legend>
              <div class="space-y-3">
                <div v-for="f in lauterFields" :key="f.key">
                  <label class="text-sm font-medium"
                    >{{ $t(`databases.equip.${f.key}`) }} ({{ f.unit }})</label
                  ><input
                    v-model.number="form[f.key]"
                    type="number"
                    :step="f.step"
                    class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              </div>
            </fieldset>

            <!-- Boil -->
            <fieldset class="border rounded-md p-4">
              <legend class="px-1 text-sm font-semibold">{{ $t('databases.equip.boil') }}</legend>
              <div class="space-y-3">
                <div v-for="f in boilFields" :key="f.key">
                  <label class="text-sm font-medium"
                    >{{ $t(`databases.equip.${f.key}`) }} ({{ f.unit }})</label
                  ><input
                    v-model.number="form[f.key]"
                    type="number"
                    :step="f.step"
                    class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              </div>
            </fieldset>

            <!-- Chilling -->
            <fieldset class="border rounded-md p-4">
              <legend class="px-1 text-sm font-semibold">
                {{ $t('databases.equip.chilling') }}
              </legend>
              <div class="space-y-3">
                <div v-for="f in chillingFields" :key="f.key">
                  <label class="text-sm font-medium"
                    >{{ $t(`databases.equip.${f.key}`) }} ({{ f.unit }})</label
                  ><input
                    v-model.number="form[f.key]"
                    type="number"
                    :step="f.step"
                    class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              </div>
            </fieldset>
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
import type { Equipment } from '~/types'

type NumKey = keyof Pick<
  Equipment,
  | 'tunVolume'
  | 'tunWeight'
  | 'tunSpecificHeat'
  | 'lauterDeadspace'
  | 'efficiency'
  | 'kettleVolume'
  | 'boilSize'
  | 'evapRate'
  | 'boilTime'
  | 'topUpKettle'
  | 'hopUtilization'
  | 'batchSize'
  | 'trubChillerLoss'
  | 'topUpWater'
>

interface FieldDef {
  key: NumKey
  unit: string
  step: number
}

const mashFields: FieldDef[] = [
  { key: 'tunVolume', unit: 'L', step: 0.5 },
  { key: 'tunWeight', unit: 'kg', step: 0.1 },
  { key: 'tunSpecificHeat', unit: 'cal/g·°C', step: 0.01 },
]
const lauterFields: FieldDef[] = [
  { key: 'lauterDeadspace', unit: 'L', step: 0.1 },
  { key: 'efficiency', unit: '%', step: 1 },
]
const boilFields: FieldDef[] = [
  { key: 'kettleVolume', unit: 'L', step: 0.5 },
  { key: 'boilSize', unit: 'L', step: 0.5 },
  { key: 'evapRate', unit: '%/h', step: 0.5 },
  { key: 'boilTime', unit: 'min', step: 1 },
  { key: 'topUpKettle', unit: 'L', step: 0.5 },
  { key: 'hopUtilization', unit: '%', step: 1 },
  { key: 'batchSize', unit: 'L', step: 0.5 },
]
const chillingFields: FieldDef[] = [
  { key: 'trubChillerLoss', unit: 'L', step: 0.5 },
  { key: 'topUpWater', unit: 'L', step: 0.5 },
]

function createEmptyForm(): Partial<Equipment> {
  return {
    name: '',
    batchSize: 20,
    boilSize: 25,
    boilTime: 60,
    tunVolume: 0,
    tunWeight: 0,
    tunSpecificHeat: 0.12,
    lauterDeadspace: 0,
    kettleVolume: 0,
    evapRate: 10,
    topUpKettle: 0,
    hopUtilization: 100,
    trubChillerLoss: 0,
    topUpWater: 0,
    efficiency: 75,
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
} = useResourceCrud<Equipment>('equipment', createEmptyForm, ['name'])
</script>
