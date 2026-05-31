<template>
  <div class="water-treatment-print max-w-6xl space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">{{ $t('water.treatment.title') }}</h1>
        <p class="text-sm text-muted-foreground">{{ $t('water.treatment.subtitle') }}</p>
      </div>
      <div class="flex gap-2 print:hidden">
        <button type="button" class="px-3 py-2 border rounded-md text-sm" @click="printSheet">
          {{ $t('common.print') }}
        </button>
        <NuxtLink class="text-sm underline" :to="`/recipes/${recipeId}`">{{
          $t('common.back')
        }}</NuxtLink>
      </div>
    </div>

    <div v-if="pending" class="text-sm text-muted-foreground">{{ $t('common.loading') }}</div>
    <div v-else class="space-y-6">
      <section class="grid gap-4 md:grid-cols-2">
        <div class="rounded-lg border p-4 space-y-4">
          <h2 class="font-semibold">{{ $t('water.treatment.sourceWater') }}</h2>
          <select
            v-model.number="form.sourceWaterId"
            class="w-full px-3 py-2 border rounded-md bg-background"
            @change="copySelectedWater('source')"
          >
            <option :value="null">{{ $t('water.treatment.custom') }}</option>
            <option v-for="water in waters" :key="water.id" :value="water.id">
              {{ water.name }}{{ water.isDefault ? ` (${$t('water.treatment.default')})` : '' }}
            </option>
          </select>
          <WaterProfileInputs v-model="form.sourceProfile" />
        </div>

        <div class="rounded-lg border p-4 space-y-4">
          <h2 class="font-semibold">{{ $t('water.treatment.targetProfile') }}</h2>
          <select
            v-model.number="form.targetWaterId"
            class="w-full px-3 py-2 border rounded-md bg-background"
            @change="copySelectedWater('target')"
          >
            <option :value="null">{{ $t('water.treatment.custom') }}</option>
            <option v-for="water in waters" :key="water.id" :value="water.id">
              {{ water.name }}
            </option>
          </select>
          <WaterProfileInputs v-model="form.targetProfile" />
          <div class="flex flex-wrap gap-2">
            <button
              class="px-3 py-2 border rounded-md text-sm"
              :disabled="suggesting || !form.sourceWaterId || !form.targetWaterId"
              @click="suggestForTargetProfile"
            >
              {{ $t('water.treatment.suggestTargetProfile') }}
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-lg border p-4 space-y-4">
        <div class="flex flex-wrap gap-3">
          <label class="text-sm font-medium"
            >{{ $t('water.treatment.mashVolume') }} (L)
            <input
              v-model.number="form.mashVolumeL"
              type="number"
              min="0"
              step="0.1"
              class="block w-32 mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium"
            >{{ $t('water.treatment.spargeVolume') }} (L)
            <input
              v-model.number="form.spargeVolumeL"
              type="number"
              min="0"
              step="0.1"
              class="block w-32 mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <SaltGrid v-model="form.mashAdditions" :title="$t('water.treatment.mashSalts')" />
          <SaltGrid v-model="form.spargeAdditions" :title="$t('water.treatment.spargeSalts')" />
        </div>
        <div class="flex flex-wrap items-end gap-2 border-t pt-4">
          <label class="text-sm font-medium"
            >{{ $t('water.treatment.styleProfile') }}
            <select
              v-model.number="selectedStyleId"
              class="block min-w-56 mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option :value="null">{{ $t('water.treatment.custom') }}</option>
              <option v-for="style in styles" :key="style.id" :value="style.id">
                {{ style.name }}
              </option>
            </select>
          </label>
          <button
            class="px-3 py-2 border rounded-md text-sm"
            :disabled="suggesting || !form.sourceWaterId || !selectedStyleId"
            @click="suggestForStyle"
          >
            {{ $t('water.treatment.suggestStyleProfile') }}
          </button>
          <span v-if="suggestionError" class="text-sm text-red-700">{{ suggestionError }}</span>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-lg border p-4 space-y-3 lg:col-span-1">
          <h2 class="font-semibold">{{ $t('water.treatment.acids') }}</h2>
          <label v-for="acid in acidInputs" :key="acid.key" class="block text-sm font-medium">
            {{ acid.label }}
            <input
              v-model.number="form.acids[acid.key]"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="block text-sm font-medium"
            >{{ $t('water.treatment.targetMashPh') }}
            <input
              v-model.number="form.acids.targetMashPh"
              type="number"
              min="3.5"
              max="7"
              step="0.01"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <p class="text-sm font-semibold">
            {{ $t('water.treatment.lacticNeeded') }}: {{ lacticNeeded.toFixed(2) }} mL
          </p>
          <p class="text-sm font-semibold">
            {{ $t('water.treatment.phosphoricNeeded') }}: {{ phosphoricNeeded.toFixed(2) }} mL
          </p>
          <div class="border-t pt-3 space-y-2">
            <h3 class="font-medium">{{ $t('water.treatment.spargeAcid') }}</h3>
            <label class="block text-sm font-medium"
              >{{ $t('water.treatment.spargeAcidType') }}
              <select
                v-model="spargeAcidType"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="lactic88">{{ $t('water.treatment.lactic88') }}</option>
                <option value="phosphoric75">{{ $t('water.treatment.phosphoric75') }}</option>
                <option value="acidMalt">{{ $t('water.treatment.acidMaltGrams') }}</option>
              </select>
            </label>
            <label class="block text-sm font-medium"
              >{{ $t('water.treatment.targetSpargePh') }}
              <input
                v-model.number="spargeTargetPh"
                type="number"
                min="4"
                max="7"
                step="0.01"
                class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              />
            </label>
            <p class="text-sm font-semibold">
              {{ $t('water.treatment.spargeAcidNeeded') }}: {{ spargeAcidDisplay }}
            </p>
          </div>
        </div>

        <div class="rounded-lg border p-4 space-y-4 lg:col-span-2">
          <h2 class="font-semibold">{{ $t('water.treatment.result') }}</h2>
          <div class="grid gap-3 md:grid-cols-3">
            <ProfileCard :title="$t('water.treatment.mashResult')" :profile="mashProfile" />
            <ProfileCard :title="$t('water.treatment.spargeResult')" :profile="spargeProfile" />
            <ProfileCard :title="$t('water.treatment.blendedResult')" :profile="blendedProfile" />
          </div>
          <div class="grid gap-3 text-sm md:grid-cols-3">
            <p>{{ $t('water.treatment.alkalinity') }}: {{ alkalinity.toFixed(0) }} mg/L CaCO₃</p>
            <p>
              {{ $t('water.treatment.residualAlkalinity') }}:
              {{ residualAlkalinity.toFixed(1) }} mEq/L
            </p>
            <p :class="ionBalanceClass">
              {{ $t('water.treatment.ionBalance') }}: {{ ionBalance.toFixed(1) }}%
            </p>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="rounded-md bg-muted/30 p-3">
              <p class="text-lg font-semibold" :class="mashPhClass">
                {{ $t('water.treatment.predictedMashPh') }}: {{ predictedMashPh.toFixed(2) }}
              </p>
              <p class="text-sm">{{ $t('water.treatment.mashPhTargetBand') }}</p>
            </div>
            <div class="rounded-md bg-muted/30 p-3">
              <p class="text-lg font-semibold">
                {{ $t('water.treatment.clSo4Ratio') }}: {{ clSo4Display }}
              </p>
              <p class="text-sm">{{ clSo4Label }}</p>
            </div>
          </div>
          <ul v-if="warnings.length" class="text-sm text-amber-700 list-disc pl-5">
            <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </section>

      <div class="flex items-center gap-3">
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
        <span v-if="saved" class="text-sm text-green-700">{{ $t('water.treatment.saved') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface WaterRow extends WaterProfile {
  id: number
  name: string
  isDefault?: boolean
}
interface StyleRow {
  id: number
  name: string
}
interface WaterProfile {
  calcium: number
  magnesium: number
  sodium: number
  chloride: number
  sulfate: number
  bicarbonate: number
  ph: number
}
type SaltKey = 'cacl2' | 'caso4' | 'mgso4' | 'nacl' | 'nahco3' | 'caco3'
type AcidKey = 'lactic88Ml' | 'phosphoric75Ml' | 'acidMaltPercent'
type SpargeAcidType = 'lactic88' | 'phosphoric75' | 'acidMalt'
type Additions = Record<SaltKey, number>
interface GristItem {
  amountKg: number
  colorEbc: number
  grainType?: string
  added?: string
}
interface SuggestionResponse {
  salts: {
    CaCl2: number
    CaSO4: number
    MgSO4: number
    NaCl: number
    NaHCO3: number
    CaCO3: number
  }
  acid: { type: string; mL: number }
  predictedMashPh: number
  predictedClSo4: number
  targetProfile?: WaterProfile
}

const props = defineProps<{ recipeId: number | string }>()
const recipeId = computed(() => Number(props.recipeId))
const { t } = useI18n()

function printSheet() {
  if (import.meta.client) window.print()
}

const emptyProfile = (): WaterProfile => ({
  calcium: 0,
  magnesium: 0,
  sodium: 0,
  chloride: 0,
  sulfate: 0,
  bicarbonate: 0,
  ph: 7,
})
const emptyAdditions = (): Additions => ({
  cacl2: 0,
  caso4: 0,
  mgso4: 0,
  nacl: 0,
  nahco3: 0,
  caco3: 0,
})

const { data: watersData } = await useFetch<WaterRow[]>('/api/waters')
const { data: stylesData } = await useFetch<StyleRow[]>('/api/styles')
const { data, pending } = await useFetch<{
  treatment: null | Partial<typeof form.value>
  defaults: { sourceWaterId: number | null; mashVolumeL: number; spargeVolumeL: number }
  recipeStyleId: number | null
  grist: GristItem[]
}>(() => `/api/recipes/${recipeId.value}/water-treatment`)

const waters = computed(() => watersData.value ?? [])
const styles = computed(() => stylesData.value ?? [])
const grist = computed(() => data.value?.grist ?? [])
const selectedStyleId = ref<number | null>(null)
const form = ref({
  sourceWaterId: null as number | null,
  targetWaterId: null as number | null,
  sourceProfile: emptyProfile(),
  targetProfile: emptyProfile(),
  mashVolumeL: 20,
  spargeVolumeL: 10,
  mashAdditions: emptyAdditions(),
  spargeAdditions: emptyAdditions(),
  acids: { lactic88Ml: 0, phosphoric75Ml: 0, acidMaltPercent: 0, targetMashPh: 5.4 },
})

const initialised = ref(false)
watch(
  [data, waters],
  ([value]) => {
    if (initialised.value || !value?.defaults) return
    const defaults = value.defaults
    const treatment = value.treatment
    if ((defaults.sourceWaterId || treatment?.targetWaterId) && waters.value.length === 0) return
    if (!selectedStyleId.value) selectedStyleId.value = value.recipeStyleId ?? null
    form.value = {
      ...form.value,
      ...treatment,
      sourceWaterId: treatment?.sourceWaterId ?? defaults.sourceWaterId,
      mashVolumeL: treatment?.mashVolumeL ?? defaults.mashVolumeL,
      spargeVolumeL: treatment?.spargeVolumeL ?? defaults.spargeVolumeL,
      sourceProfile: treatment?.sourceProfile ?? form.value.sourceProfile,
      targetProfile: treatment?.targetProfile ?? form.value.targetProfile,
      mashAdditions: { ...emptyAdditions(), ...(treatment?.mashAdditions ?? {}) },
      spargeAdditions: { ...emptyAdditions(), ...(treatment?.spargeAdditions ?? {}) },
      acids: { ...form.value.acids, ...(treatment?.acids ?? {}) },
    }
    if (!treatment?.sourceProfile) copySelectedWater('source')
    if (!treatment?.targetProfile) copySelectedWater('target')
    initialised.value = true
  },
  { immediate: true },
)

const salts: { key: SaltKey; label: string }[] = [
  { key: 'cacl2', label: 'CaCl₂' },
  { key: 'caso4', label: 'CaSO₄' },
  { key: 'mgso4', label: 'MgSO₄' },
  { key: 'nacl', label: 'NaCl' },
  { key: 'nahco3', label: 'NaHCO₃' },
  { key: 'caco3', label: 'CaCO₃' },
]
const ions: { key: keyof WaterProfile; label: string }[] = [
  { key: 'calcium', label: 'Ca' },
  { key: 'magnesium', label: 'Mg' },
  { key: 'sodium', label: 'Na' },
  { key: 'sulfate', label: 'SO₄' },
  { key: 'chloride', label: 'Cl' },
  { key: 'bicarbonate', label: 'HCO₃' },
  { key: 'ph', label: 'pH' },
]
const acidInputs: { key: AcidKey; label: string }[] = [
  { key: 'lactic88Ml', label: t('water.treatment.lactic88') },
  { key: 'phosphoric75Ml', label: t('water.treatment.phosphoric75') },
  { key: 'acidMaltPercent', label: t('water.treatment.acidMalt') },
]

function copySelectedWater(kind: 'source' | 'target') {
  const id = kind === 'source' ? form.value.sourceWaterId : form.value.targetWaterId
  const water = waters.value.find((item) => item.id === id)
  if (!water) return
  const profile = toProfile(water)
  if (kind === 'source') form.value.sourceProfile = profile
  else form.value.targetProfile = profile
}

const mashProfile = computed(() =>
  applyAdditions(form.value.sourceProfile, form.value.mashAdditions, form.value.mashVolumeL),
)
const spargeProfile = computed(() =>
  applyAdditions(form.value.sourceProfile, form.value.spargeAdditions, form.value.spargeVolumeL),
)
const blendedProfile = computed(() =>
  blendProfiles(
    mashProfile.value,
    form.value.mashVolumeL,
    spargeProfile.value,
    form.value.spargeVolumeL,
  ),
)
const alkalinity = computed(() => blendedProfile.value.bicarbonate / 1.22)
const residualAlkalinity = computed(() => zra(mashProfile.value, form.value.acids.targetMashPh))
const ionBalance = computed(() => balance(blendedProfile.value))
const ionBalanceClass = computed(() =>
  Math.abs(ionBalance.value) > 10 ? 'text-amber-700 font-semibold' : '',
)
const predictedMashPh = computed(() =>
  solvePh(mashProfile.value, form.value.mashVolumeL, grist.value, form.value.acids),
)
const mashPhClass = computed(() =>
  mashPhBand(predictedMashPh.value) === 'target' ? 'text-green-700' : 'text-amber-700',
)
const clSo4Ratio = computed(() => chlorideToSulfateRatio(blendedProfile.value))
const clSo4Display = computed(() =>
  Number.isFinite(clSo4Ratio.value) ? clSo4Ratio.value.toFixed(2) : '∞',
)
const clSo4Label = computed(() => t(`water.treatment.${clSo4LabelKey(clSo4Ratio.value)}`))
const spargeAcidType = ref<SpargeAcidType>('lactic88')
const spargeTargetPh = ref(5.6)
const spargeAcid = computed(() =>
  acidForSpargeWater(
    spargeProfile.value,
    form.value.spargeVolumeL,
    spargeTargetPh.value,
    spargeAcidType.value,
  ),
)
const spargeAcidDisplay = computed(() =>
  spargeAcidType.value === 'acidMalt'
    ? `${spargeAcid.value.amountGrams.toFixed(1)} g`
    : `${spargeAcid.value.amountMl.toFixed(2)} mL`,
)
const lacticNeeded = computed(() =>
  acidNeeded(
    'lactic',
    mashProfile.value,
    form.value.mashVolumeL,
    grist.value,
    form.value.acids.targetMashPh,
  ),
)
const phosphoricNeeded = computed(() =>
  acidNeeded(
    'phosphoric',
    mashProfile.value,
    form.value.mashVolumeL,
    grist.value,
    form.value.acids.targetMashPh,
  ),
)
const warnings = computed(() => {
  const list: string[] = []
  if (Math.abs(ionBalance.value) > 10) list.push(t('water.treatment.warningIonBalance'))
  if (predictedMashPh.value < 5.2 || predictedMashPh.value > 5.6)
    list.push(t('water.treatment.warningMashPh'))
  if (blendedProfile.value.calcium < 40 || blendedProfile.value.calcium > 200)
    list.push(t('water.treatment.warningCalcium'))
  if (blendedProfile.value.chloride > 200 || blendedProfile.value.sulfate > 600)
    list.push(t('water.treatment.warningFlavorIons'))
  return list
})

const saving = ref(false)
const saved = ref(false)
const suggesting = ref(false)
const suggestionError = ref('')

async function suggestForTargetProfile() {
  if (!form.value.sourceWaterId || !form.value.targetWaterId) return
  await requestSuggestion('/api/water-suggestions/match-profile', {
    sourceWaterId: form.value.sourceWaterId,
    targetProfileId: form.value.targetWaterId,
    mashVolumeL: form.value.mashVolumeL,
    spargeVolumeL: form.value.spargeVolumeL,
    gristEbcDistribution: grist.value,
  })
}

async function suggestForStyle() {
  if (!form.value.sourceWaterId || !selectedStyleId.value) return
  await requestSuggestion('/api/water-suggestions/match-style', {
    sourceWaterId: form.value.sourceWaterId,
    styleId: selectedStyleId.value,
    mashVolumeL: form.value.mashVolumeL,
    spargeVolumeL: form.value.spargeVolumeL,
    gristEbcDistribution: grist.value,
  })
}

async function requestSuggestion(url: string, body: Record<string, unknown>) {
  suggesting.value = true
  suggestionError.value = ''
  try {
    const suggestion = await $fetch<SuggestionResponse>(url, { method: 'POST', body })
    applySuggestion(suggestion)
  } catch {
    suggestionError.value = t('water.treatment.suggestionFailed')
  } finally {
    suggesting.value = false
  }
}

function applySuggestion(suggestion: SuggestionResponse) {
  form.value.mashAdditions = {
    cacl2: suggestion.salts.CaCl2,
    caso4: suggestion.salts.CaSO4,
    mgso4: suggestion.salts.MgSO4,
    nacl: suggestion.salts.NaCl,
    nahco3: suggestion.salts.NaHCO3,
    caco3: suggestion.salts.CaCO3,
  }
  form.value.spargeAdditions = emptyAdditions()
  if (suggestion.acid.type === 'lactic88') form.value.acids.lactic88Ml = suggestion.acid.mL
  if (suggestion.targetProfile) form.value.targetProfile = suggestion.targetProfile
}

async function save() {
  saving.value = true
  saved.value = false
  try {
    await $fetch(`/api/recipes/${recipeId.value}/water-treatment`, {
      method: 'PUT',
      body: form.value,
    })
    saved.value = true
  } finally {
    saving.value = false
  }
}

function toProfile(water: WaterRow): WaterProfile {
  return {
    calcium: water.calcium ?? 0,
    magnesium: water.magnesium ?? 0,
    sodium: water.sodium ?? 0,
    chloride: water.chloride ?? 0,
    sulfate: water.sulfate ?? 0,
    bicarbonate: water.bicarbonate ?? 0,
    ph: water.ph ?? 7,
  }
}

function applyAdditions(source: WaterProfile, additions: Additions, volumeL: number): WaterProfile {
  if (volumeL <= 0) return { ...source }
  const ppm = (grams: number, fraction: number) =>
    (Math.max(0, grams || 0) * fraction * 1000) / volumeL
  return {
    ...source,
    calcium:
      source.calcium +
      ppm(additions.cacl2, 40.078 / 110.98) +
      ppm(additions.caso4, 40.078 / 136.14) +
      ppm(additions.caco3, 40.078 / 100.09),
    magnesium: source.magnesium + ppm(additions.mgso4, 24.305 / 120.37),
    sodium:
      source.sodium + ppm(additions.nacl, 22.99 / 58.44) + ppm(additions.nahco3, 22.99 / 84.01),
    sulfate:
      source.sulfate + ppm(additions.caso4, 96.06 / 136.14) + ppm(additions.mgso4, 96.06 / 120.37),
    chloride:
      source.chloride + ppm(additions.cacl2, 70.9 / 110.98) + ppm(additions.nacl, 35.45 / 58.44),
    bicarbonate:
      source.bicarbonate +
      ppm(additions.nahco3, 61.02 / 84.01) +
      ppm(additions.caco3 / 3, 61.02 / 100.09),
  }
}

function blendProfiles(a: WaterProfile, aL: number, b: WaterProfile, bL: number): WaterProfile {
  const total = Math.max(0, aL) + Math.max(0, bL)
  if (total <= 0) return { ...a }
  const mix = (key: keyof WaterProfile) =>
    (a[key] * Math.max(0, aL) + b[key] * Math.max(0, bL)) / total
  return {
    calcium: mix('calcium'),
    magnesium: mix('magnesium'),
    sodium: mix('sodium'),
    chloride: mix('chloride'),
    sulfate: mix('sulfate'),
    bicarbonate: mix('bicarbonate'),
    ph: mix('ph'),
  }
}

function balance(water: WaterProfile) {
  const cations = water.calcium / 20.04 + water.magnesium / 12.15 + water.sodium / 22.99
  const anions = water.chloride / 35.45 + water.sulfate / 48.03 + water.bicarbonate / 61.02
  return cations + anions === 0 ? 0 : ((cations - anions) / (cations + anions)) * 100
}
function chlorideToSulfateRatio(water: WaterProfile) {
  if (water.chloride <= 0) return water.sulfate > 0 ? Number.POSITIVE_INFINITY : 0
  return water.sulfate / water.chloride
}
function clSo4LabelKey(ratio: number) {
  if (ratio < 0.4) return 'clSo4VeryBitter'
  if (ratio < 0.8) return 'clSo4Bitter'
  if (ratio <= 1.5) return 'clSo4Balanced'
  if (ratio <= 2.5) return 'clSo4Malty'
  return 'clSo4VeryMalty'
}
function mashPhBand(ph: number) {
  if (ph < 5.2) return 'low'
  if (ph > 5.6) return 'high'
  return 'target'
}
function acidForSpargeWater(
  water: WaterProfile,
  volumeL: number,
  targetPH: number,
  acidType: SpargeAcidType,
) {
  const residual =
    ((water.bicarbonate / 61) * 50 - water.calcium / 1.4 - water.magnesium / 1.7) / 50
  const carbonateMeq = spargeCarbonateAcidMeq(water.bicarbonate, volumeL, targetPH)
  const hardnessCredit =
    Math.max(0, volumeL) * (water.calcium / 20.04 / 3.5 + water.magnesium / 12.15 / 7)
  const acidMeq = Math.max(0, carbonateMeq - hardnessCredit, residual * Math.max(0, volumeL) * 0.25)
  const meqPerMl = acidType === 'phosphoric75' ? 12.09 : 11.78
  return {
    amountMl: acidType === 'acidMalt' ? 0 : acidMeq / meqPerMl,
    amountGrams: acidType === 'acidMalt' ? acidMeq / 0.333 : 0,
  }
}
function spargeCarbonateAcidMeq(bicarbonate: number, volumeL: number, targetPH: number) {
  const ct = Math.max(0, bicarbonate) / 61
  const [, f1, f2] = calcFrac(targetPH, 6.38, 10.38, 14)
  return Math.max(0, ct - ct * ((f1 ?? 0) + 2 * (f2 ?? 0))) * Math.max(0, volumeL)
}
function calcFrac(ph: number, pk1: number, pk2: number, pk3: number) {
  const h = 10 ** -ph
  const k1 = 10 ** -pk1
  const k2 = 10 ** -pk2
  const k3 = 10 ** -pk3
  const denominator = h * h * h + h * h * k1 + h * k1 * k2 + k1 * k2 * k3
  return [
    (h * h * h) / denominator,
    (h * h * k1) / denominator,
    (h * k1 * k2) / denominator,
    (k1 * k2 * k3) / denominator,
  ]
}

const ka1 = 0.0000004445
const ka2 = 0.0000000000468
function charge(ph: number) {
  const h = 10 ** -ph
  const co3 = (100 * ka1 * ka2) / (h * h + h * ka1 + ka1 * ka2)
  const hco3 = (100 * ka1 * h) / (h * h + h * ka1 + ka1 * ka2)
  return -2 * co3 - hco3
}
function zra(water: WaterProfile, ph: number) {
  const ct = water.bicarbonate / 1.22 / 50 / (-charge(4.3) + charge(water.ph || 7))
  return (
    ct * (-charge(ph) + charge(water.ph || 7)) -
    water.calcium / 20.039 / 3.5 -
    water.magnesium / 12.1525 / 7
  )
}
function solvePh(
  water: WaterProfile,
  volumeL: number,
  bill: GristItem[],
  acids: typeof form.value.acids,
) {
  let ph = 5.4
  for (let i = 0; i < 1000; i += 1) {
    const pd = protonDeficitAt(water, volumeL, bill, ph) - acidMeq(acids, ph, bill)
    if (Math.abs(pd) <= 0.1) break
    ph += pd > 0 ? 0.001 : -0.001
  }
  return ph
}
function protonDeficitAt(water: WaterProfile, volumeL: number, bill: GristItem[], ph: number) {
  return (
    zra(water, ph) * Math.max(0, volumeL) +
    bill
      .filter((g) => (g.added ?? 'Mash') === 'Mash')
      .reduce((sum, g) => sum + buffer(g) * (ph - diPh(g)) * Math.max(0, g.amountKg), 0)
  )
}
function buffer(g: GristItem) {
  const ebc = Math.max(0, g.colorEbc || 0)
  const type = (g.grainType ?? '').toLowerCase()
  if (type.includes('crystal') || type.includes('cara')) return -0.0597 * ebc - 32.457
  if (type.includes('roast')) return 0.0107 * ebc - 54.768
  if (type.includes('sour') || type.includes('acid')) return -149
  return 0.014 * ebc - 34.192
}
function diPh(g: GristItem) {
  const ebc = Math.max(0, g.colorEbc || 0)
  const type = (g.grainType ?? '').toLowerCase()
  if (type.includes('crystal') || type.includes('cara')) return Math.max(4.65, 5.55 - ebc * 0.0015)
  if (type.includes('roast')) return Math.max(4.25, 5.05 - ebc * 0.00035)
  if (type.includes('sour') || type.includes('acid')) return 3.5
  return Math.max(5.55, 5.72 - ebc * 0.0006)
}
function acidMeq(acids: typeof form.value.acids, ph: number, bill: GristItem[]) {
  const kg = bill.reduce((sum, g) => sum + Math.max(0, g.amountKg), 0)
  return (
    acids.lactic88Ml * ((1.214 * 0.88 * 1000) / 90.08) * acidFraction(ph, 3.08, 20, 20) +
    acids.phosphoric75Ml * ((1.58 * 0.75 * 1000) / 98) * acidFraction(ph, 2.12, 7.2, 12.44) +
    acids.acidMaltPercent * kg * 6
  )
}
function acidFraction(ph: number, pk1: number, pk2: number, pk3: number) {
  const r1 = 10 ** (ph - pk1)
  const r2 = 10 ** (ph - pk2)
  const r3 = 10 ** (ph - pk3)
  const d = 1 / (1 + r1 + r1 * r2 + r1 * r2 * r3)
  return r1 * d + 2 * r1 * r2 * d + 3 * r1 * r2 * r3 * d
}
function acidNeeded(
  acid: 'lactic' | 'phosphoric',
  water: WaterProfile,
  volumeL: number,
  bill: GristItem[],
  target: number,
) {
  const required = Math.max(0, protonDeficitAt(water, volumeL, bill, target))
  const perMl =
    acid === 'lactic'
      ? ((1.214 * 0.88 * 1000) / 90.08) * acidFraction(target, 3.08, 20, 20)
      : ((1.58 * 0.75 * 1000) / 98) * acidFraction(target, 2.12, 7.2, 12.44)
  return required / Math.max(0.0001, perMl)
}

const WaterProfileInputs = defineComponent({
  props: { modelValue: { type: Object as PropType<WaterProfile>, required: true } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const update = (key: keyof WaterProfile, value: number) =>
      emit('update:modelValue', { ...props.modelValue, [key]: Number(value) || 0 })
    return () =>
      h(
        'div',
        { class: 'grid grid-cols-2 md:grid-cols-4 gap-3' },
        ions.map((ion) =>
          h('label', { class: 'text-sm font-medium' }, [
            ion.label,
            h('input', {
              value: props.modelValue[ion.key],
              type: 'number',
              step: ion.key === 'ph' ? '0.1' : '1',
              class: 'w-full mt-1 px-3 py-2 border rounded-md bg-background',
              onInput: (event: Event) =>
                update(ion.key, Number((event.target as HTMLInputElement).value)),
            }),
          ]),
        ),
      )
  },
})

const SaltGrid = defineComponent({
  props: {
    modelValue: { type: Object as PropType<Additions>, required: true },
    title: { type: String, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const update = (key: SaltKey, value: number) =>
      emit('update:modelValue', { ...props.modelValue, [key]: Number(value) || 0 })
    return () =>
      h('div', { class: 'space-y-2' }, [
        h('h3', { class: 'font-medium' }, props.title),
        h(
          'div',
          { class: 'grid grid-cols-2 md:grid-cols-3 gap-3' },
          salts.map((salt) =>
            h('label', { class: 'text-sm font-medium' }, [
              salt.label,
              h('input', {
                value: props.modelValue[salt.key],
                type: 'number',
                min: '0',
                step: '0.1',
                class: 'w-full mt-1 px-3 py-2 border rounded-md bg-background',
                onInput: (event: Event) =>
                  update(salt.key, Number((event.target as HTMLInputElement).value)),
              }),
            ]),
          ),
        ),
      ])
  },
})

const ProfileCard = defineComponent({
  props: {
    title: { type: String, required: true },
    profile: { type: Object as PropType<WaterProfile>, required: true },
  },
  setup(props) {
    const keys: (keyof WaterProfile)[] = [
      'calcium',
      'magnesium',
      'sodium',
      'sulfate',
      'chloride',
      'bicarbonate',
    ]
    return () =>
      h('div', { class: 'rounded-md bg-muted/30 p-3' }, [
        h('h3', { class: 'font-medium mb-2' }, props.title),
        ...keys.map((key) =>
          h('p', { class: 'text-sm font-mono' }, `${key}: ${props.profile[key].toFixed(0)}`),
        ),
      ])
  },
})
</script>
