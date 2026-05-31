<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.waterWizard') }}</h1>
    <div class="space-y-6">
      <div>
        <label class="text-sm font-medium">Batch Volume (L)</label
        ><input
          v-model.number="form.volumeL"
          type="number"
          step="0.5"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>

      <div>
        <h2 class="font-semibold mb-2">Source Water (mg/L)</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="ion in ions" :key="ion.key">
            <label class="text-sm font-medium">{{ ion.label }}</label
            ><input
              v-model.number="form.source[ion.key]"
              type="number"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 class="font-semibold mb-2">Salt Additions (g)</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="salt in salts" :key="salt.key">
            <label class="text-sm font-medium">{{ salt.label }}</label
            ><input
              v-model.number="form.additions[salt.key]"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
      </div>

      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        Calculate
      </button>

      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-2">
        <h3 class="font-semibold">Resulting Profile (mg/L)</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-mono">
          <p>Ca: {{ result.profile.calcium.toFixed(0) }}</p>
          <p>Mg: {{ result.profile.magnesium.toFixed(0) }}</p>
          <p>Na: {{ result.profile.sodium.toFixed(0) }}</p>
          <p>Cl: {{ result.profile.chloride.toFixed(0) }}</p>
          <p>SO₄: {{ result.profile.sulfate.toFixed(0) }}</p>
          <p>HCO₃: {{ result.profile.bicarbonate.toFixed(0) }}</p>
        </div>
        <div class="text-sm space-y-1 pt-2">
          <p>Residual Alkalinity: {{ result.residualAlkalinity }}</p>
          <p>SO₄ : Cl Ratio: {{ result.sulfateChlorideRatio }}</p>
          <p>Ion Balance: {{ result.ionBalance }}%</p>
        </div>
      </div>

      <div class="border-t pt-6">
        <h2 class="font-semibold mb-2">{{ $t('tools.spargeAcidification') }}</h2>
        <p class="text-sm text-muted-foreground mb-3">{{ $t('tools.spargeAcidInfo') }}</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label class="text-sm font-medium">{{ $t('tools.spargeVolume') }} (L)</label
            ><input
              v-model.number="sparge.volumeL"
              type="number"
              step="0.5"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">HCO₃ (mg/L)</label
            ><input
              v-model.number="sparge.bicarbonate"
              type="number"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('tools.targetPh') }}</label
            ><input
              v-model.number="sparge.targetPH"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('tools.acidType') }}</label>
            <select
              v-model="sparge.acid"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="lactic88">{{ $t('tools.acidLactic') }}</option>
              <option value="phosphoric85">{{ $t('tools.acidPhosphoric85') }}</option>
              <option value="phosphoric10">{{ $t('tools.acidPhosphoric10') }}</option>
            </select>
          </div>
        </div>
        <button
          class="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          @click="calculateSparge"
        >
          {{ $t('common.calculate') }}
        </button>
        <div v-if="spargeResult" class="border rounded-lg p-4 bg-muted/30 space-y-1 mt-3 text-sm">
          <p>{{ $t('tools.alkalinity') }}: {{ spargeResult.alkalinity }} mg/L CaCO₃</p>
          <p class="font-semibold">{{ $t('tools.acidNeeded') }}: {{ spargeResult.acidMl }} mL</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type IonKey = 'calcium' | 'magnesium' | 'sodium' | 'chloride' | 'sulfate' | 'bicarbonate'
type SaltKey = 'caso4' | 'cacl2' | 'mgso4' | 'nacl' | 'nahco3' | 'caco3'

const ions: { key: IonKey; label: string }[] = [
  { key: 'calcium', label: 'Calcium (Ca²⁺)' },
  { key: 'magnesium', label: 'Magnesium (Mg²⁺)' },
  { key: 'sodium', label: 'Sodium (Na⁺)' },
  { key: 'chloride', label: 'Chloride (Cl⁻)' },
  { key: 'sulfate', label: 'Sulfate (SO₄²⁻)' },
  { key: 'bicarbonate', label: 'Bicarbonate (HCO₃⁻)' },
]

const salts: { key: SaltKey; label: string }[] = [
  { key: 'caso4', label: 'Gypsum (CaSO₄)' },
  { key: 'cacl2', label: 'Calcium Chloride (CaCl₂)' },
  { key: 'mgso4', label: 'Epsom Salt (MgSO₄)' },
  { key: 'nacl', label: 'Table Salt (NaCl)' },
  { key: 'nahco3', label: 'Baking Soda (NaHCO₃)' },
  { key: 'caco3', label: 'Chalk (CaCO₃)' },
]

const form = ref({
  volumeL: 20,
  source: {
    calcium: 0,
    magnesium: 0,
    sodium: 0,
    chloride: 0,
    sulfate: 0,
    bicarbonate: 0,
  } as Record<IonKey, number>,
  additions: {
    caso4: 0,
    cacl2: 0,
    mgso4: 0,
    nacl: 0,
    nahco3: 0,
    caco3: 0,
    hcl: 0,
    h3po4: 0,
    lacticAcid: 0,
  },
})

interface WaterResult {
  profile: {
    calcium: number
    magnesium: number
    sodium: number
    chloride: number
    sulfate: number
    bicarbonate: number
  }
  residualAlkalinity: number
  ionBalance: number
  sulfateChlorideRatio: number
}

const result = ref<WaterResult | null>(null)

async function calculate() {
  const url: string = '/api/calculations/water-adjustment'
  result.value = await $fetch<WaterResult>(url, {
    method: 'POST',
    body: form.value,
  })
}

const sparge = ref({
  volumeL: 12,
  bicarbonate: 0,
  targetPH: 5.8,
  acid: 'lactic88' as 'lactic88' | 'phosphoric85' | 'phosphoric10',
})

interface SpargeResult {
  alkalinity: number
  targetPH: number
  acidMeq: number
  acidMl: number
}

const spargeResult = ref<SpargeResult | null>(null)

async function calculateSparge() {
  spargeResult.value = await $fetch<SpargeResult>('/api/calculations/sparge-acid', {
    method: 'POST',
    body: sparge.value,
  })
}
</script>
