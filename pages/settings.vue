<template>
  <div class="max-w-4xl">
    <h1 class="text-2xl font-bold mb-6">{{ $t('settings.title') }}</h1>

    <div v-if="loaded" class="space-y-6">
      <div class="border-b">
        <nav class="flex gap-1 flex-wrap">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ]"
            @click="activeTab = tab.key"
          >
            {{ $t(tab.label) }}
          </button>
        </nav>
      </div>

      <section v-if="activeTab === 'general'" class="border rounded-lg p-4 space-y-4">
        <h2 class="font-semibold">{{ $t('settings.tabs.general') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label class="text-sm font-medium">
            {{ $t('settings.temperatureUnit') }}
            <select
              v-model="form.temperatureUnit"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="celsius">°C</option>
              <option value="fahrenheit">°F</option>
            </select>
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.gravityUnit') }}
            <select
              v-model="form.gravityUnit"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="sg">SG</option>
              <option value="plato">°Plato</option>
            </select>
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.colorUnit') }}
            <select
              v-model="form.colorUnit"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="ebc">EBC</option>
              <option value="srm">SRM</option>
            </select>
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.defaultBatchSize') }}
            <input
              v-model="form.defaultBatchSize"
              type="number"
              step="0.5"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.defaultBoilTime') }}
            <input
              v-model="form.defaultBoilTime"
              type="number"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.defaultEfficiency') }}
            <input
              v-model="form.defaultEfficiency"
              type="number"
              step="1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
        </div>
      </section>

      <section v-if="activeTab === 'calculations'" class="border rounded-lg p-4 space-y-4">
        <h2 class="font-semibold">{{ $t('settings.tabs.calculations') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label class="text-sm font-medium">
            {{ $t('settings.ibuMethod') }}
            <select
              v-model="form.ibuMethod"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="tinseth">Tinseth</option>
              <option value="rager">Rager</option>
              <option value="garetz">Garetz</option>
              <option value="daniels">Daniels</option>
              <option value="mosher">Mosher</option>
              <option value="noonan">Noonan</option>
            </select>
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.colorMethod') }}
            <select
              v-model="form.colorMethod"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="morey">Morey</option>
              <option value="mosher">Mosher</option>
              <option value="daniels">Daniels</option>
            </select>
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.brixCorrection') }}
            <input
              v-model="form.brixCorrection"
              type="number"
              step="0.01"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.hopStorageTempDefault') }}
            <input
              v-model="form.hopStorageTempDefault"
              type="number"
              step="1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.hopStorageMethodDefault') }}
            <select
              v-model="form.hopStorageMethodDefault"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="freezer">{{ $t('settings.storageFreezer') }}</option>
              <option value="fridge">{{ $t('settings.storageFridge') }}</option>
              <option value="room">{{ $t('settings.storageRoom') }}</option>
              <option value="vacuum">{{ $t('settings.storageVacuum') }}</option>
              <option value="foil">{{ $t('settings.storageFoil') }}</option>
            </select>
          </label>
        </div>
      </section>

      <section v-if="activeTab === 'brewery'" class="border rounded-lg p-4 space-y-4">
        <h2 class="font-semibold">{{ $t('settings.tabs.brewery') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="text-sm font-medium">
            {{ $t('settings.brewerName') }}
            <input
              v-model="form.brewerName"
              type="text"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.breweryName') }}
            <input
              v-model="form.breweryName"
              type="text"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
        </div>
        <div class="space-y-3">
          <label class="text-sm font-medium block">
            {{ $t('settings.breweryLogo') }}
            <input type="file" accept="image/*" class="block mt-1 text-sm" @change="uploadLogo" />
          </label>
          <p class="text-xs text-muted-foreground">{{ $t('settings.logoHint') }}</p>
          <p v-if="logoError" class="text-sm text-destructive">{{ logoError }}</p>
          <div v-if="form.breweryLogo" class="flex items-center gap-4 border rounded-lg p-3 w-fit">
            <img
              :src="form.breweryLogo"
              :alt="$t('settings.breweryLogoPreview')"
              class="max-h-24 max-w-48 object-contain"
            />
            <button type="button" class="px-3 py-2 border rounded-md text-sm" @click="removeLogo">
              {{ $t('settings.removeLogo') }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'display'" class="border rounded-lg p-4 space-y-4">
        <h2 class="font-semibold">{{ $t('settings.tabs.display') }}</h2>
        <div class="space-y-3">
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="showStockIndicator" type="checkbox" class="rounded" />
            {{ $t('settings.showStockIndicator') }}
          </label>
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="showRecipeCode" type="checkbox" class="rounded" />
            {{ $t('settings.showRecipeCode') }}
          </label>
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="showBrewCode" type="checkbox" class="rounded" />
            {{ $t('settings.showBrewCode') }}
          </label>
        </div>
      </section>

      <!-- Theme settings: temporary minimal block for Phase 10 until the settings redesign absorbs it. -->
      <section class="border rounded-lg p-4 space-y-4">
        <h2 class="font-semibold">{{ $t('settings.theme.title') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="text-sm font-medium">
            {{ $t('settings.theme.fontFamily') }}
            <input
              v-model="form.themeFontFamily"
              type="text"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.theme.fontSize') }}
            <input
              v-model="form.themeFontSize"
              type="number"
              min="10"
              max="24"
              step="1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.theme.accentColor') }}
            <input
              v-model="form.themeAccentColor"
              type="color"
              class="w-full mt-1 h-10 border rounded-md bg-background"
            />
          </label>
          <label class="text-sm font-medium">
            {{ $t('settings.theme.mode') }}
            <select
              v-model="form.themeMode"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="system">{{ $t('settings.theme.modeSystem') }}</option>
              <option value="light">{{ $t('settings.theme.modeLight') }}</option>
              <option value="dark">{{ $t('settings.theme.modeDark') }}</option>
            </select>
          </label>
        </div>
      </section>

      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-60"
        :disabled="saving"
        @click="saveSettings"
      >
        {{ saving ? $t('common.saving') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const form = ref<Record<string, string>>({})
const loaded = ref(false)
const saving = ref(false)
const activeTab = ref('general')
const logoError = ref('')

const tabs = [
  { key: 'general', label: 'settings.tabs.general' },
  { key: 'calculations', label: 'settings.tabs.calculations' },
  { key: 'brewery', label: 'settings.tabs.brewery' },
  { key: 'display', label: 'settings.tabs.display' },
]

const DEFAULTS: Record<string, string> = {
  ibuMethod: 'tinseth',
  colorMethod: 'morey',
  temperatureUnit: 'celsius',
  gravityUnit: 'sg',
  colorUnit: 'ebc',
  defaultBatchSize: '20',
  defaultBoilTime: '60',
  defaultEfficiency: '75',
  brixCorrection: '1.03',
  hopStorageTempDefault: '20',
  hopStorageMethodDefault: 'foil',
  brewerName: '',
  breweryName: '',
  breweryLogo: '',
  showStockIndicator: 'true',
  showRecipeCode: 'true',
  showBrewCode: 'true',
  themeFontFamily: 'Inter',
  themeFontSize: '14',
  themeAccentColor: '#16a34a',
  themeMode: 'system',
}

function booleanSetting(key: string) {
  return computed({
    get: () => form.value[key] === 'true',
    set: (v: boolean) => {
      form.value[key] = v ? 'true' : 'false'
    },
  })
}

const showStockIndicator = booleanSetting('showStockIndicator')
const showRecipeCode = booleanSetting('showRecipeCode')
const showBrewCode = booleanSetting('showBrewCode')

onMounted(async () => {
  const loadedForm = await $fetch<Record<string, string>>('/api/settings' as string)
  form.value = { ...DEFAULTS, ...loadedForm }
  loaded.value = true
})

async function saveSettings() {
  saving.value = true
  try {
    await Promise.all(
      Object.entries(form.value).map(([key, value]) => {
        const path = `/api/settings/${encodeURIComponent(key)}` as string
        return $fetch(path, { method: 'PUT', body: { value } })
      }),
    )
    if (import.meta.client) window.dispatchEvent(new CustomEvent('brewbuddy:settings-changed'))
  } finally {
    saving.value = false
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  logoError.value = ''
  if (!file) return
  if (file.size > 200 * 1024) {
    logoError.value = t('settings.logoTooLarge')
    input.value = ''
    return
  }
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    logoError.value = t('settings.logoInvalidType')
    input.value = ''
    return
  }
  form.value.breweryLogo = await readFileAsDataUrl(file)
  await $fetch('/api/settings/breweryLogo', {
    method: 'PUT',
    body: { value: form.value.breweryLogo },
  })
  input.value = ''
}

async function removeLogo() {
  form.value.breweryLogo = ''
  await $fetch('/api/settings/breweryLogo', { method: 'PUT', body: { value: '' } })
}
</script>
