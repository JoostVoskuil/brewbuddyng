<template>
  <section class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="border rounded-lg p-4 space-y-3">
        <h3 class="font-semibold">{{ $t('brew.brewday.boilStart') }}</h3>
        <input v-model="boilStart" type="datetime-local" class="w-full px-3 py-2 border rounded-md bg-background" />
        <div class="flex gap-2">
          <button type="button" class="px-3 py-2 border rounded-md text-sm" @click="boilStart = nowLocal()">{{ $t('brew.brewday.startBoilNow') }}</button>
          <button type="button" class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm" @click="$emit('save', { endTime: toIso(boilStart), status: 'brewing' })">{{ $t('common.save') }}</button>
        </div>
      </div>
      <div class="border rounded-lg p-4 space-y-3">
        <h3 class="font-semibold">{{ $t('brew.boekaf.title') }}</h3>
        <p class="text-sm text-muted-foreground">{{ $t('brew.boekaf.description') }}</p>
        <button type="button" class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50" :disabled="deducting" @click="boekAf">{{ deducting ? $t('common.loading') : $t('brew.boekaf.button') }}</button>
        <p v-if="boekAfMessage" class="text-sm" :class="boekAfError ? 'text-destructive' : 'text-green-700'">{{ boekAfMessage }}</p>
      </div>
      <div class="border rounded-lg p-4 space-y-3">
        <h3 class="font-semibold">TControl</h3>
        <input type="file" accept=".lvm,.csv,.txt" class="text-sm" @change="importTControl" />
        <p class="text-sm text-muted-foreground">{{ $t('brew.brewday.tcontrolHelp') }}</p>
      </div>
    </div>

    <div class="border rounded-lg p-4 space-y-3">
      <h3 class="font-semibold">{{ $t('brew.brewday.waterActuals') }}</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <div>{{ $t('recipe.mashWaterTotal') }}: <span class="font-mono">{{ targetMashWater.toFixed(1) }} L</span></div>
        <div>{{ $t('recipe.spargeWater') }}: <span class="font-mono">{{ targetSpargeWater.toFixed(1) }} L</span></div>
        <label>{{ $t('brew.brewday.actualMashWater') }}<input v-model.number="waterForm.mash" type="number" step="0.1" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label>
        <label>{{ $t('brew.brewday.actualSpargeWater') }}<input v-model.number="waterForm.sparge" type="number" step="0.1" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label>
      </div>
      <button type="button" class="px-3 py-2 border rounded-md text-sm" @click="saveWaterNotes">{{ $t('common.save') }}</button>
    </div>

    <div class="border rounded-lg p-4 space-y-2">
      <h3 class="font-semibold">{{ $t('brew.brewday.hopChecklist') }}</h3>
      <div v-for="item in hopChecklist" :key="item.key" class="grid grid-cols-1 md:grid-cols-[1fr_10rem_10rem] gap-2 items-center border-t py-2 first:border-t-0">
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="item.checked" @change="toggleHop(item, ($event.target as HTMLInputElement).checked)" /><span>{{ item.label }}</span></label>
        <span class="text-sm font-mono">{{ countdown(item) }}</span>
        <span class="text-xs text-muted-foreground">{{ item.doneAt ? formatDate(item.doneAt) : '—' }}</span>
      </div>
      <p v-if="!hopChecklist.length" class="text-sm text-muted-foreground">{{ $t('recipe.noHops') }}</p>
    </div>

    <div class="border rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between"><h3 class="font-semibold">{{ $t('brew.brewday.measurements') }}</h3><button type="button" class="px-3 py-2 border rounded-md text-sm" @click="addMeasurement">{{ $t('common.add') }}</button></div>
      <div class="grid grid-cols-2 md:grid-cols-7 gap-2">
        <input v-model="newMeasurement.datetime" type="datetime-local" class="px-3 py-2 border rounded-md bg-background" />
        <input v-model.number="newMeasurement.sg" type="number" step="0.001" placeholder="SG" class="px-3 py-2 border rounded-md bg-background" />
        <input v-model.number="newMeasurement.tempS1" type="number" step="0.1" :placeholder="$t('brew.tempS1')" class="px-3 py-2 border rounded-md bg-background" />
        <input v-model.number="newMeasurement.tempS2" type="number" step="0.1" :placeholder="$t('brew.tempS2')" class="px-3 py-2 border rounded-md bg-background" />
        <input v-model.number="notePh" type="number" step="0.01" placeholder="pH" class="px-3 py-2 border rounded-md bg-background" />
        <input v-model.number="noteCells" type="number" step="1" :placeholder="$t('brew.tabs.metingen.cells')" class="px-3 py-2 border rounded-md bg-background" />
        <input v-model="newMeasurement.notes" type="text" :placeholder="$t('common.notes')" class="px-3 py-2 border rounded-md bg-background" />
      </div>
      <p class="text-sm text-muted-foreground">{{ $t('brew.brewday.liveOg') }}: <span class="font-mono">{{ liveOg }}</span></p>
      <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted text-muted-foreground"><tr><th class="text-left p-2">{{ $t('common.date') }}</th><th class="text-right p-2">SG</th><th class="text-right p-2">{{ $t('brew.tempS1') }}</th><th class="text-right p-2">{{ $t('brew.tempS2') }}</th><th class="text-left p-2">{{ $t('common.notes') }}</th></tr></thead><tbody><tr v-for="row in measurements" :key="row.id" class="border-t"><td class="p-2">{{ formatDate(row.datetime) }}</td><td class="p-2 text-right font-mono">{{ row.sg || '—' }}</td><td class="p-2 text-right font-mono">{{ row.tempS1 || '—' }}</td><td class="p-2 text-right font-mono">{{ row.tempS2 || '—' }}</td><td class="p-2">{{ row.notes }}</td></tr><tr v-if="!measurements.length"><td colspan="5" class="p-4 text-muted-foreground">{{ $t('brew.brewday.noMeasurements') }}</td></tr></tbody></table></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Brew, BrewChecklistItem, BrewMeasurement, RecipeWithIngredients } from '~/types'
interface BoekAfResult { deductions: unknown[]; negative: unknown[] }
const props = defineProps<{ brew: Brew & { checklist: BrewChecklistItem[]; measurements: BrewMeasurement[]; boilTime: number }; recipe: RecipeWithIngredients | null }>()
const emit = defineEmits<{ save: [patch: Partial<Brew> & { checklist?: BrewChecklistItem[] }]; addMeasurement: [measurement: Partial<BrewMeasurement>]; refresh: [] }>()
const boilStart = ref(toLocalInput(props.brew.endTime)); const deducting = ref(false); const boekAfMessage = ref(''); const boekAfError = ref(false); const { t } = useI18n()
const newMeasurement = reactive<Partial<BrewMeasurement>>({ datetime: nowLocal() }); const notePh = ref<number>(); const noteCells = ref<number>()
const waterForm = reactive({ mash: parseNoteNumber('actualMashWater'), sparge: parseNoteNumber('actualSpargeWater') })
watch(() => props.brew.endTime, (value) => { boilStart.value = toLocalInput(value) })
const measurements = computed(() => [...props.brew.measurements].sort((a,b)=>(a.datetime??'').localeCompare(b.datetime??'')))
const liveOg = computed(() => { const sg = measurements.value.map((m)=>m.sg ?? 0).filter((v)=>v>1); return sg.length ? Math.max(...sg).toFixed(3) : (props.brew.ogActual ? props.brew.ogActual.toFixed(3) : '—') })
const targetMashWater = computed(() => props.recipe?.mashSteps.reduce((s, step) => s + (step.infuseAmount ?? 0), 0) ?? 0)
const targetSpargeWater = computed(() => Math.max(0, (props.recipe?.boilSize ?? 0) - targetMashWater.value))
const hopChecklist = computed(() => (props.recipe?.hops ?? []).map((hop) => { const key = `HOP|${hop.id}|${hop.use}|${hop.time}`; const saved = props.brew.checklist.find((item) => item.itemText.startsWith(key)); const [, , , , doneAt=''] = saved?.itemText.split('|') ?? []; return { key, label: `${hop.name} · ${((hop.amount ?? 0) * 1000).toFixed(0)} g · ${hop.use} · ${hop.time} min`, minutes: hop.time ?? 0, checked: saved?.checked ?? false, doneAt } }).sort((a,b)=>b.minutes-a.minutes))
function toLocalInput(value: string | null | undefined) { return value ? value.slice(0,16) : '' }
function nowLocal() { const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16) }
function toIso(value: string) { return value ? new Date(value).toISOString() : '' }
function formatDate(value: string | null | undefined) { return value ? new Date(value).toLocaleString() : '—' }
function countdown(item: { minutes: number }) { if (!boilStart.value || !props.brew.boilTime) return `${item.minutes} min`; const target = new Date(boilStart.value).getTime() + Math.max(0, (props.brew.boilTime - item.minutes)) * 60000; const diff = target - Date.now(); return diff > 0 ? `${Math.ceil(diff/60000)} min` : t('brew.brewday.done') }
function parseNoteNumber(key: string) { const m=(props.brew.notes ?? '').match(new RegExp(`${key}=([0-9.]+)`)); return m ? Number(m[1]) : undefined }
function saveWaterNotes() { const cleaned=(props.brew.notes ?? '').replace(/\n?actualMashWater=[0-9.]+/g,'').replace(/\n?actualSpargeWater=[0-9.]+/g,''); emit('save', { notes: `${cleaned}\nactualMashWater=${waterForm.mash ?? 0}\nactualSpargeWater=${waterForm.sparge ?? 0}`.trim() }) }
function toggleHop(item: { key: string }, checked: boolean) { const rest=props.brew.checklist.filter((row)=>!row.itemText.startsWith(item.key)); const row={ id:0, brewId:props.brew.id, itemText: `${item.key}|${checked ? new Date().toISOString() : ''}`, checked, sortOrder: rest.length }; emit('save', { checklist: [...rest, row] }) }
function addMeasurement() { const notes = [newMeasurement.notes, notePh.value ? `pH=${notePh.value}` : '', noteCells.value ? `cells=${noteCells.value}` : ''].filter(Boolean).join(' '); emit('addMeasurement', { ...newMeasurement, notes, datetime: newMeasurement.datetime ? new Date(newMeasurement.datetime).toISOString() : new Date().toISOString() }); Object.assign(newMeasurement,{ datetime: nowLocal(), sg: undefined, tempS1: undefined, tempS2: undefined, notes: '' }); notePh.value=undefined; noteCells.value=undefined }
async function importTControl(event: Event) { const input=event.target as HTMLInputElement; const file=input.files?.[0]; if(!file)return; const text=await file.text(); await $fetch(`/api/brews/${props.brew.id}/import-tcontrol`,{method:'POST',body:text,headers:{'Content-Type':'text/plain'}}); emit('refresh'); input.value='' }
async function boekAf() { deducting.value=true; boekAfError.value=false; boekAfMessage.value=''; try { const result=await $fetch<BoekAfResult>(`/api/brews/${props.brew.id}/boek-af`,{method:'POST'}); boekAfMessage.value=result.negative.length?t('brew.boekaf.successWithNegative',{count:result.deductions.length,negative:result.negative.length}):t('brew.boekaf.success',{count:result.deductions.length}); emit('refresh') } catch(error) { boekAfError.value=true; boekAfMessage.value=error instanceof Error ? error.message : t('brew.boekaf.error') } finally { deducting.value=false } }
</script>
