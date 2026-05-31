<template>
  <section class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="border rounded-lg p-4 space-y-3">
        <h3 class="font-semibold">{{ $t('brew.packaging.title') }}</h3>
        <label class="text-sm block">{{ $t('brew.packaging.date') }}<input v-model="form.bottlingDate" type="datetime-local" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label>
        <label class="text-sm block">{{ $t('brew.packaging.vessel') }}<select v-model="vessel" class="w-full mt-1 px-3 py-2 border rounded-md bg-background"><option value="bottle">{{ $t('brew.packaging.bottle') }}</option><option value="keg">{{ $t('brew.packaging.keg') }}</option></select></label>
        <div class="grid grid-cols-2 gap-2"><label class="text-sm block">{{ $t('brew.packaging.bottleVolume') }}<input v-model.number="form.bottleVolume" type="number" step="0.1" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label><label class="text-sm block">{{ $t('brew.packaging.kegVolume') }}<input v-model.number="form.kegVolume" type="number" step="0.1" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label></div>
        <p class="text-sm text-muted-foreground">{{ $t('brew.packaging.totalPackaged') }}: <span class="font-mono">{{ totalPackaged.toFixed(1) }} L</span></p>
        <button type="button" class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm" @click="save">{{ $t('common.save') }}</button>
      </div>
      <div class="border rounded-lg p-4 space-y-3">
        <h3 class="font-semibold">{{ $t('brew.packaging.carbonation') }}</h3>
        <label class="text-sm block">{{ $t('brew.packaging.method') }}<select v-model="form.carbonationType" class="w-full mt-1 px-3 py-2 border rounded-md bg-background"><option value="priming">{{ $t('brew.packaging.priming') }}</option><option value="forced">{{ $t('brew.packaging.forced') }}</option></select></label>
        <div class="grid grid-cols-2 gap-2"><label class="text-sm block">{{ $t('brew.packaging.co2Volume') }}<input v-model.number="form.carbonationVolume" type="number" step="0.1" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label><label class="text-sm block">{{ $t('brew.packaging.beerTemp') }}<input v-model.number="form.forcedTemp" type="number" step="0.1" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label></div>
        <template v-if="form.carbonationType !== 'forced'"><label class="text-sm block">{{ $t('brew.packaging.primingSugarType') }}<select v-model="form.primingSugarType" class="w-full mt-1 px-3 py-2 border rounded-md bg-background"><option value="sucrose">Sucrose</option><option value="glucose">Glucose</option><option value="dme">DME</option><option value="honey">Honey</option><option value="molasses">Molasses</option></select></label><label class="text-sm block">{{ $t('brew.packaging.primingSugar') }}<input v-model.number="form.primingSugarAmount" type="number" step="0.1" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label><p class="text-sm text-muted-foreground">{{ $t('brew.packaging.calculatedSugar') }}: <span class="font-mono">{{ calculatedSugar.toFixed(1) }} g</span></p></template>
        <template v-else><p class="text-sm text-muted-foreground">{{ $t('brew.packaging.forcedPressure') }}: <span class="font-mono">{{ forcedBar.toFixed(2) }} bar / {{ forcedPsi.toFixed(1) }} PSI</span></p><div class="grid grid-cols-3 gap-2 text-xs"><div v-for="temp in pressureTable" :key="temp.temp" class="border rounded p-2"><div>{{ temp.temp }} °C</div><div class="font-mono">{{ temp.bar.toFixed(2) }} bar</div></div></div></template>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { Brew } from '~/types'
import { forcedCarbonationBar, forcedCarbonationPSI, primingSugarAmount, type PrimingSugar } from '~/server/utils/calculations/carbonation'
const props = defineProps<{ brew: Brew }>()
const emit = defineEmits<{ save: [patch: Partial<Brew>] }>()
const vessel = ref((props.brew.kegVolume ?? 0) > 0 ? 'keg' : 'bottle')
const form = reactive({ bottlingDate: toLocalInput(props.brew.bottlingDate), carbonationType: props.brew.carbonationType || 'priming', carbonationVolume: props.brew.carbonationVolume || 2.4, primingSugarType: props.brew.primingSugarType || 'sucrose', primingSugarAmount: props.brew.primingSugarAmount ?? undefined, bottleVolume: props.brew.bottleVolume ?? undefined, kegVolume: props.brew.kegVolume ?? undefined, forcedTemp: props.brew.forcedTemp || props.brew.fermentationTemp || 20 })
const totalPackaged = computed(() => (form.bottleVolume ?? 0) + (form.kegVolume ?? 0))
const calculatedSugar = computed(() => primingSugarAmount(form.carbonationVolume || 0, form.forcedTemp || 20, totalPackaged.value, form.primingSugarType as PrimingSugar))
const forcedPsi = computed(() => forcedCarbonationPSI(form.carbonationVolume || 0, form.forcedTemp || 20))
const forcedBar = computed(() => forcedCarbonationBar(form.carbonationVolume || 0, form.forcedTemp || 20))
const pressureTable = computed(() => [2,4,6,8,10,12,14,16,18].map((temp)=>({ temp, bar: forcedCarbonationBar(form.carbonationVolume || 0, temp) })))
function toLocalInput(value: string | null | undefined) { return value ? value.slice(0,16) : '' }
function save() { emit('save', { bottlingDate: form.bottlingDate ? new Date(form.bottlingDate).toISOString() : '', carbonationType: form.carbonationType, carbonationVolume: form.carbonationVolume, primingSugarType: form.primingSugarType, primingSugarAmount: form.carbonationType === 'forced' ? 0 : (form.primingSugarAmount || calculatedSugar.value), bottleVolume: form.bottleVolume, kegVolume: form.kegVolume, forcedTemp: form.forcedTemp, forcedCo2: form.carbonationVolume, forcedPressure: form.carbonationType === 'forced' ? forcedBar.value : 0, status: 'conditioning' }) }
</script>
