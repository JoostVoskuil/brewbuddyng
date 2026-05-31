<template>
  <div v-if="recipe" class="flex gap-6" data-recipe-editor>
    <!-- Main Editor -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between mb-4 gap-3">
        <div class="flex-1 flex items-center gap-3 min-w-0">
          <input
            v-model="recipe.code"
            :placeholder="$t('recipe.code')"
            class="text-base font-mono bg-transparent border rounded px-2 py-1 w-28 shrink-0"
          />
          <input
            v-model="recipe.name"
            class="text-2xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none w-full"
          />
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b mb-4">
        <nav class="flex gap-1">
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

      <!-- General tab -->
      <div v-if="activeTab === 'general'" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.type') }}</label>
            <select
              v-model="recipe.type"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="All Grain">{{ $t('recipe.types.allGrain') }}</option>
              <option value="Extract">{{ $t('recipe.types.extract') }}</option>
              <option value="Partial Mash">{{ $t('recipe.types.partialMash') }}</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.batchSize') }} (L)</label
            ><input
              v-model.number="recipe.batchSize"
              type="number"
              step="0.5"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.boilSize') }} (L)</label
            ><input
              v-model.number="recipe.boilSize"
              type="number"
              step="0.5"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.boilTime') }} (min)</label
            ><input
              v-model.number="recipe.boilTime"
              type="number"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.efficiency') }} (%)</label
            ><input
              v-model.number="recipe.efficiency"
              type="number"
              step="1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.style') }}</label>
            <select
              v-model.number="recipe.styleId"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option :value="null">—</option>
              <option v-for="s in styles" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.equipment') }}</label>
            <select
              v-model.number="recipe.equipmentId"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option :value="null">—</option>
              <option v-for="e in equipmentList" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('recipe.notes') }}</label
          ><textarea
            v-model="recipe.notes"
            rows="4"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          ></textarea>
        </div>
        <div class="flex items-end gap-2 flex-wrap border-t pt-4">
          <div>
            <label class="text-sm font-medium">{{ $t('recipe.scaleTo') }} (L)</label>
            <input
              v-model.number="scaleVolume"
              type="number"
              step="0.5"
              min="0"
              class="w-28 mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <button class="px-3 py-2 border rounded-md text-sm font-medium" @click="scaleRecipe">
            {{ $t('recipe.scaleRecipe') }}
          </button>
          <p class="text-xs text-muted-foreground basis-full">{{ $t('recipe.scaleHint') }}</p>
        </div>
      </div>

      <!-- Fermentables tab -->
      <div v-if="activeTab === 'fermentables'" class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-3 flex-wrap">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="percentMode" type="checkbox" />
              {{ $t('recipe.percentMode') }}
            </label>
            <div v-if="percentMode" class="flex items-center gap-2">
              <label class="text-sm">{{ $t('recipe.targetGrainBill') }} (kg)</label>
              <input
                v-model.number="targetGrainBillKg"
                type="number"
                step="0.01"
                min="0"
                class="w-24 px-2 py-1 border rounded bg-background text-right"
                @change="applyPercentAmounts"
              />
              <span
                class="text-sm tabular-nums"
                :class="percentSumIs100 ? 'text-muted-foreground' : 'text-red-600 font-medium'"
              >
                {{ $t('recipe.percentSum') }} {{ percentSum.toFixed(1) }}%
              </span>
            </div>
          </div>
          <button
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
            @click="addFermentable"
          >
            {{ $t('common.add') }}
          </button>
        </div>
        <p v-if="percentMode" class="text-xs text-muted-foreground">
          {{ $t('recipe.percentModeHint') }}
        </p>
        <table class="w-full text-sm border rounded-lg overflow-hidden">
          <thead class="bg-muted">
            <tr>
              <th class="text-left p-2">{{ $t('common.name') }}</th>
              <th class="text-right p-2">
                {{ percentMode ? $t('recipe.percentOfGrist') : 'Amount (kg)' }}
              </th>
              <th class="text-right p-2">Color (EBC)</th>
              <th class="text-right p-2">Yield %</th>
              <th class="text-right p-2">
                {{ percentMode ? 'Amount (kg)' : $t('recipe.percentOfGrist') }}
              </th>
              <th class="text-center p-2">{{ $t('recipe.lockTotal100') }}</th>
              <th v-if="showStockIndicator" class="text-right p-2">{{ $t('recipe.stock') }}</th>
              <th class="p-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(f, i) in recipe.fermentables"
              :key="fermentableKey(f, i)"
              class="border-t bg-amber-50/50 dark:bg-amber-950/20"
            >
              <td class="p-2">
                <input v-model="f.name" class="w-full px-2 py-1 border rounded bg-background" />
              </td>
              <td class="p-2 text-right">
                <input
                  v-if="percentMode"
                  :value="fermentablePercent(f, i)"
                  type="number"
                  step="0.1"
                  class="w-24 px-2 py-1 border rounded bg-background text-right"
                  @change="
                    setFermentablePercent(f, i, Number(($event.target as HTMLInputElement).value))
                  "
                />
                <input
                  v-else
                  v-model.number="f.amount"
                  type="number"
                  step="0.01"
                  class="w-24 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-2 text-right">
                <input
                  v-model.number="f.color"
                  type="number"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-2 text-right">
                <input
                  v-model.number="f.yield"
                  type="number"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-2 text-right tabular-nums text-muted-foreground">
                <span v-if="percentMode">{{ (f.amount || 0).toFixed(2) }}</span>
                <span v-else>{{ percentOfGrist(f.amount).toFixed(1) }}%</span>
              </td>
              <td class="p-2 text-center">
                <button
                  v-if="percentMode"
                  type="button"
                  class="px-2 py-1 border rounded text-xs"
                  :class="
                    lockedFermentableKey === fermentableKey(f, i)
                      ? 'bg-primary text-primary-foreground'
                      : ''
                  "
                  :title="$t('recipe.lockTotal100Hint')"
                  @click="toggleFermentableLock(f, i)"
                >
                  🔒 100%
                </button>
                <span v-else class="text-muted-foreground">—</span>
              </td>
              <td v-if="showStockIndicator" class="p-2 text-right tabular-nums">
                <span class="inline-flex items-center gap-2 justify-end">
                  <StockDot :state="stockStateFor('fermentable', f)" />
                  <span>{{ stockLabelFor('fermentable', f) }}</span>
                </span>
              </td>
              <td class="p-2 text-right">
                <button class="text-destructive" @click="removeFermentable(i)">✕</button>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="recipe.fermentables && recipe.fermentables.length">
            <tr class="border-t bg-muted/40 font-medium">
              <td class="p-2">{{ $t('common.total') }}</td>
              <td class="p-2 text-right tabular-nums">
                {{ percentMode ? `${percentSum.toFixed(1)}%` : grainTotalKg.toFixed(2) }}
              </td>
              <td class="p-2"></td>
              <td class="p-2"></td>
              <td class="p-2 text-right tabular-nums">
                {{ percentMode ? grainTotalKg.toFixed(2) : '100%' }}
              </td>
              <td class="p-2"></td>
              <td v-if="showStockIndicator" class="p-2"></td>
              <td class="p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Hops tab -->
      <div v-if="activeTab === 'hops'" class="space-y-4">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <div class="flex items-center gap-3 flex-wrap">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="ibuEntryMode" type="checkbox" />
              {{ $t('recipe.ibuEntryMode') }}
            </label>
            <div class="flex items-center gap-2 flex-wrap">
              <label class="text-sm">{{ $t('recipe.targetIbu') }}</label>
              <input
                v-model.number="targetIbu"
                type="number"
                step="1"
                min="0"
                class="w-24 px-2 py-1 border rounded bg-background text-right"
              />
              <button
                class="px-3 py-1.5 border rounded-md text-sm font-medium"
                @click="applyTargetIbu"
              >
                {{ $t('recipe.applyTargetIbu') }}
              </button>
              <span class="text-xs text-muted-foreground">{{ $t('recipe.targetIbuHint') }}</span>
            </div>
          </div>
          <button
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
            @click="addHop"
          >
            {{ $t('common.add') }}
          </button>
        </div>
        <p v-if="ibuEntryMode" class="text-xs text-muted-foreground">
          {{ $t('recipe.ibuEntryModeHint') }}
        </p>
        <table class="w-full text-sm border rounded-lg overflow-hidden">
          <thead class="bg-muted">
            <tr>
              <th class="text-left p-2">{{ $t('common.name') }}</th>
              <th class="text-right p-2">
                {{ ibuEntryMode ? $t('recipe.contributionIbu') : 'Amount (g)' }}
              </th>
              <th class="text-right p-2">Alpha %</th>
              <th class="text-right p-2">Time (min)</th>
              <th class="text-left p-2">Use</th>
              <th class="text-right p-2">IBU</th>
              <th v-if="showStockIndicator" class="text-right p-2">{{ $t('recipe.stock') }}</th>
              <th class="p-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(h, i) in recipe.hops"
              :key="hopKey(h, i)"
              class="border-t bg-green-50/50 dark:bg-green-950/20"
            >
              <td class="p-2">
                <input v-model="h.name" class="w-full px-2 py-1 border rounded bg-background" />
              </td>
              <td class="p-2 text-right">
                <input
                  v-if="ibuEntryMode"
                  :value="hopContributionIbu(h, i)"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-24 px-2 py-1 border rounded bg-background text-right"
                  @change="
                    setHopContributionIbu(h, i, Number(($event.target as HTMLInputElement).value))
                  "
                />
                <input
                  v-else
                  v-model.number="h.amount"
                  type="number"
                  step="1"
                  class="w-24 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-2 text-right">
                <input
                  v-model.number="h.alpha"
                  type="number"
                  step="0.1"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                  @change="refreshHopAmountFromIbu(h, i)"
                />
              </td>
              <td class="p-2 text-right">
                <input
                  v-model.number="h.time"
                  type="number"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                  @change="refreshHopAmountFromIbu(h, i)"
                />
              </td>
              <td class="p-2">
                <select
                  v-model="h.use"
                  class="px-2 py-1 border rounded bg-background text-sm"
                  @change="refreshHopAmountFromIbu(h, i)"
                >
                  <option value="Boil">Boil</option>
                  <option value="First Wort">First Wort</option>
                  <option value="Aroma">Aroma</option>
                  <option value="Whirlpool">Whirlpool</option>
                  <option value="Dry Hop">Dry Hop</option>
                </select>
              </td>
              <td class="p-2 text-right tabular-nums text-muted-foreground">
                {{ hopContributionIbu(h, i).toFixed(1) }}
              </td>
              <td v-if="showStockIndicator" class="p-2 text-right tabular-nums">
                <span class="inline-flex items-center gap-2 justify-end">
                  <StockDot :state="stockStateFor('hop', h)" />
                  <span>{{ stockLabelFor('hop', h) }}</span>
                </span>
              </td>
              <td class="p-2">
                <button class="text-destructive" @click="removeHop(i)">✕</button>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="recipe.hops && recipe.hops.length">
            <tr class="border-t bg-muted/40 font-medium">
              <td class="p-2">{{ $t('common.total') }}</td>
              <td class="p-2 text-right tabular-nums">{{ hopTotalGrams.toFixed(0) }} g</td>
              <td class="p-2"></td>
              <td class="p-2"></td>
              <td class="p-2"></td>
              <td class="p-2 text-right tabular-nums">{{ totalHopIbu.toFixed(1) }}</td>
              <td class="p-2"></td>
              <td class="p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Yeasts tab -->
      <div v-if="activeTab === 'yeasts'" class="space-y-4">
        <div class="flex justify-end">
          <button
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
            @click="addYeast"
          >
            {{ $t('common.add') }}
          </button>
        </div>
        <table class="w-full text-sm border rounded-lg overflow-hidden">
          <thead class="bg-muted">
            <tr>
              <th class="text-left p-2">{{ $t('common.name') }}</th>
              <th class="text-right p-2">Attenuation %</th>
              <th v-if="showStockIndicator" class="text-right p-2">{{ $t('recipe.stock') }}</th>
              <th class="p-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(y, i) in recipe.yeasts"
              :key="i"
              class="border-t bg-blue-50/50 dark:bg-blue-950/20"
            >
              <td class="p-2">
                <input v-model="y.name" class="w-full px-2 py-1 border rounded bg-background" />
              </td>
              <td class="p-2 text-right">
                <input
                  v-model.number="y.attenuation"
                  type="number"
                  class="w-24 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td v-if="showStockIndicator" class="p-2 text-right tabular-nums">
                <span class="inline-flex items-center gap-2 justify-end">
                  <StockDot :state="stockStateFor('yeast', y)" />
                  <span>{{ stockLabelFor('yeast', y) }}</span>
                </span>
              </td>
              <td class="p-2 text-right">
                <button class="text-destructive" @click="recipe.yeasts.splice(i, 1)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Miscs tab (BeerXML MISC: spices, finings, water agents, etc.) -->
      <div v-if="activeTab === 'miscs'" class="space-y-4">
        <div class="flex justify-end">
          <button
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
            @click="addMisc"
          >
            {{ $t('common.add') }}
          </button>
        </div>
        <table class="w-full text-sm border rounded-lg overflow-hidden">
          <thead class="bg-muted">
            <tr>
              <th class="text-left p-2">{{ $t('common.name') }}</th>
              <th class="text-left p-2">{{ $t('recipe.miscType') }}</th>
              <th class="text-left p-2">{{ $t('recipe.miscUse') }}</th>
              <th class="text-right p-2">{{ $t('recipe.miscAmount') }}</th>
              <th class="text-right p-2">{{ $t('recipe.miscTime') }} (min)</th>
              <th v-if="showStockIndicator" class="text-right p-2">{{ $t('recipe.stock') }}</th>
              <th class="p-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(m, i) in recipe.miscs"
              :key="i"
              class="border-t bg-purple-50/50 dark:bg-purple-950/20"
            >
              <td class="p-2">
                <input v-model="m.name" class="w-full px-2 py-1 border rounded bg-background" />
              </td>
              <td class="p-2">
                <select v-model="m.type" class="w-full px-2 py-1 border rounded bg-background">
                  <option v-for="opt in miscTypes" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </td>
              <td class="p-2">
                <select v-model="m.use" class="w-full px-2 py-1 border rounded bg-background">
                  <option v-for="opt in miscUses" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </td>
              <td class="p-2 text-right">
                <input
                  v-model.number="m.amount"
                  type="number"
                  step="0.001"
                  class="w-24 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-2 text-right">
                <input
                  v-model.number="m.time"
                  type="number"
                  step="1"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td v-if="showStockIndicator" class="p-2 text-right tabular-nums">
                <span class="inline-flex items-center gap-2 justify-end">
                  <StockDot :state="stockStateFor('misc', m)" />
                  <span>{{ stockLabelFor('misc', m) }}</span>
                </span>
              </td>
              <td class="p-2 text-right">
                <button class="text-destructive" @click="removeMisc(i)">✕</button>
              </td>
            </tr>
            <tr v-if="!recipe.miscs || !recipe.miscs.length">
              <td
                :colspan="showStockIndicator ? 7 : 6"
                class="p-3 text-center text-muted-foreground"
              >
                {{ $t('recipe.miscEmpty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Waters tab (BeerXML WATERS: brewing-water additions, ions in ppm) -->
      <div v-if="activeTab === 'waters'" class="space-y-4">
        <div class="flex justify-end">
          <button
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
            @click="addWater"
          >
            {{ $t('common.add') }}
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border rounded-lg overflow-hidden">
            <thead class="bg-muted">
              <tr>
                <th class="text-left p-2">{{ $t('common.name') }}</th>
                <th class="text-left p-2">{{ $t('recipe.waterProfile') }}</th>
                <th class="text-right p-2">{{ $t('recipe.waterAmount') }} (L)</th>
                <th class="text-right p-2">Ca²⁺</th>
                <th class="text-right p-2">HCO₃⁻</th>
                <th class="text-right p-2">SO₄²⁻</th>
                <th class="text-right p-2">Cl⁻</th>
                <th class="text-right p-2">Na⁺</th>
                <th class="text-right p-2">Mg²⁺</th>
                <th class="p-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(w, i) in recipe.waters"
                :key="i"
                class="border-t bg-cyan-50/50 dark:bg-cyan-950/20"
              >
                <td class="p-2">
                  <input v-model="w.name" class="w-32 px-2 py-1 border rounded bg-background" />
                </td>
                <td class="p-2">
                  <select
                    class="w-36 px-2 py-1 border rounded bg-background"
                    @change="
                      applyWaterProfile(
                        i,
                        Number(($event.target as HTMLSelectElement).value) || null,
                      )
                    "
                  >
                    <option value="">—</option>
                    <option v-for="p in waterProfiles" :key="p.id" :value="p.id">
                      {{ p.name }}
                    </option>
                  </select>
                </td>
                <td class="p-2 text-right">
                  <input
                    v-model.number="w.amount"
                    type="number"
                    step="0.1"
                    class="w-20 px-2 py-1 border rounded bg-background text-right"
                  />
                </td>
                <td class="p-2 text-right">
                  <input
                    v-model.number="w.calcium"
                    type="number"
                    step="1"
                    class="w-16 px-2 py-1 border rounded bg-background text-right"
                  />
                </td>
                <td class="p-2 text-right">
                  <input
                    v-model.number="w.bicarbonate"
                    type="number"
                    step="1"
                    class="w-16 px-2 py-1 border rounded bg-background text-right"
                  />
                </td>
                <td class="p-2 text-right">
                  <input
                    v-model.number="w.sulfate"
                    type="number"
                    step="1"
                    class="w-16 px-2 py-1 border rounded bg-background text-right"
                  />
                </td>
                <td class="p-2 text-right">
                  <input
                    v-model.number="w.chloride"
                    type="number"
                    step="1"
                    class="w-16 px-2 py-1 border rounded bg-background text-right"
                  />
                </td>
                <td class="p-2 text-right">
                  <input
                    v-model.number="w.sodium"
                    type="number"
                    step="1"
                    class="w-16 px-2 py-1 border rounded bg-background text-right"
                  />
                </td>
                <td class="p-2 text-right">
                  <input
                    v-model.number="w.magnesium"
                    type="number"
                    step="1"
                    class="w-16 px-2 py-1 border rounded bg-background text-right"
                  />
                </td>
                <td class="p-2 text-right">
                  <button class="text-destructive" @click="removeWater(i)">✕</button>
                </td>
              </tr>
              <tr v-if="!recipe.waters || !recipe.waters.length">
                <td colspan="10" class="p-3 text-center text-muted-foreground">
                  {{ $t('recipe.waterEmpty') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mash tab -->
      <div v-if="activeTab === 'mash'" class="space-y-4">
        <!-- Mash header (BeerXML MASH record) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="col-span-2 sm:col-span-1">
            <label class="text-sm font-medium">{{ $t('common.name') }}</label>
            <input
              v-model="recipe.mashName"
              type="text"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('databases.grainTemp') }} (°C)</label>
            <input
              v-model.number="recipe.grainTemp"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('databases.tunTemp') }} (°C)</label>
            <input
              v-model.number="recipe.tunTemp"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('databases.spargeTemp') }} (°C)</label>
            <input
              v-model.number="recipe.spargeTemp"
              type="number"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/20">
          <div v-for="item in mashWaterDisplay" :key="item.label" class="space-y-1">
            <div class="text-xs text-muted-foreground">{{ item.label }}</div>
            <div class="font-mono font-semibold">{{ item.value }}</div>
          </div>
        </div>

        <!-- Load steps from a reusable profile (template) -->
        <div class="flex items-end gap-3 flex-wrap">
          <div class="flex-1 min-w-[12rem]">
            <label class="text-sm font-medium">{{ $t('recipe.loadFromProfile') }}</label>
            <select
              v-model.number="loadProfileId"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option :value="null">{{ $t('recipe.selectMashProfile') }}</option>
              <option v-for="m in mashProfiles" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <button
            type="button"
            class="px-3 py-2 border rounded-md text-sm whitespace-nowrap disabled:opacity-50"
            :disabled="!loadProfileId"
            @click="loadStepsFromProfile"
          >
            {{ $t('recipe.applyProfile') }}
          </button>
        </div>

        <!-- Editable mash steps (BeerXML MASH_STEPS) -->
        <table class="w-full text-sm border rounded-lg overflow-hidden">
          <thead class="bg-muted">
            <tr>
              <th class="text-left p-2">{{ $t('common.name') }}</th>
              <th class="text-left p-2">{{ $t('databases.stepType') }}</th>
              <th class="text-right p-2">{{ $t('databases.stepTemp') }}</th>
              <th class="text-right p-2">{{ $t('databases.stepTime') }}</th>
              <th class="text-right p-2">{{ $t('databases.rampTime') }}</th>
              <th class="text-right p-2">{{ $t('databases.infuseAmount') }}</th>
              <th class="p-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(step, i) in recipe.mashSteps" :key="i" class="border-t">
              <td class="p-1">
                <input
                  v-model="step.name"
                  type="text"
                  class="w-full px-2 py-1 border rounded bg-background"
                />
              </td>
              <td class="p-1">
                <select v-model="step.type" class="w-full px-2 py-1 border rounded bg-background">
                  <option value="Infusion">Infusion</option>
                  <option value="Temperature">Temperature</option>
                  <option value="Decoction">Decoction</option>
                </select>
              </td>
              <td class="p-1">
                <input
                  v-model.number="step.stepTemp"
                  type="number"
                  step="0.1"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-1">
                <input
                  v-model.number="step.stepTime"
                  type="number"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-1">
                <input
                  v-model.number="step.rampTime"
                  type="number"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-1">
                <input
                  v-model.number="step.infuseAmount"
                  type="number"
                  step="0.1"
                  class="w-20 px-2 py-1 border rounded bg-background text-right"
                />
              </td>
              <td class="p-1 text-center">
                <button
                  type="button"
                  class="text-red-600 hover:underline"
                  @click="removeMashStep(i)"
                >
                  ✕
                </button>
              </td>
            </tr>
            <tr v-if="!recipe.mashSteps.length">
              <td colspan="7" class="p-4 text-center text-muted-foreground">
                {{ $t('recipe.noMashSteps') }}
              </td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="px-3 py-2 border rounded-md text-sm" @click="addMashStep">
          + {{ $t('recipe.addMashStep') }}
        </button>
      </div>

      <!-- Notes tab -->
      <div v-if="activeTab === 'notes'">
        <textarea
          v-model="recipe.notes"
          rows="12"
          class="w-full px-3 py-2 border rounded-md bg-background"
        ></textarea>
      </div>

      <div class="mt-6 flex gap-2 items-center">
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-60"
          :disabled="saveStatus === 'saving'"
          @click="saveRecipe"
        >
          {{ saveLabel }}
        </button>
        <button class="px-4 py-2 border rounded-md text-sm font-medium" @click="recalculateRecipe">
          {{ $t('recipe.recalculate') }}
        </button>
        <button class="px-4 py-2 border rounded-md text-sm font-medium" @click="exportRecipe">
          {{ $t('recipe.exportBeerXml') }}
        </button>
        <button class="px-4 py-2 border rounded-md text-sm font-medium" @click="copyForum">
          {{ $t('recipe.copyForum') }}
        </button>
        <button class="px-4 py-2 border rounded-md text-sm font-medium" @click="copyHtml">
          {{ $t('recipe.copyHtml') }}
        </button>
        <button class="px-4 py-2 border rounded-md text-sm font-medium" @click="printRecipeSheet">
          {{ $t('common.print') }}
        </button>
        <NuxtLink to="/recipes" class="px-4 py-2 border rounded-md text-sm">{{
          $t('common.back')
        }}</NuxtLink>
      </div>
      <p v-if="exportMessage" class="mt-2 text-sm text-muted-foreground">{{ exportMessage }}</p>

      <div
        class="sticky bottom-0 mt-6 border rounded-lg bg-background/95 p-4 shadow-sm backdrop-blur"
      >
        <h3 class="mb-3 font-semibold text-sm text-muted-foreground uppercase">
          {{ $t('recipe.styleRangeBars') }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <StyleRangeBar
            v-for="bar in styleRangeBars"
            :key="bar.label"
            :label="bar.label"
            :min="bar.min"
            :max="bar.max"
            :value="bar.value"
            :unit="bar.unit"
          />
        </div>
      </div>
    </div>

    <!-- Sidebar: Calculated Values -->
    <aside class="w-64 shrink-0">
      <div class="border rounded-lg p-4 sticky top-6 space-y-3">
        <h3 class="font-semibold text-sm text-muted-foreground uppercase">Stats</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm">OG</span
            ><span class="font-mono font-medium">{{ stats.og.toFixed(3) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm">FG</span
            ><span class="font-mono font-medium">{{ stats.fg.toFixed(3) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm">IBU</span
            ><span class="font-mono font-medium">{{ stats.ibu.toFixed(1) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm">ABV</span
            ><span class="font-mono font-medium">{{ stats.abv.toFixed(1) }}%</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm">{{ $t('recipe.color') }}</span>
            <span class="inline-flex items-center gap-1 font-mono font-medium">
              <span
                class="w-4 h-4 rounded border"
                :style="{ backgroundColor: ebcColor(stats.color) }"
              ></span>
              {{ stats.color.toFixed(0) }} EBC
            </span>
          </div>
        </div>
      </div>

      <!-- Style comparison -->
      <div v-if="selectedStyle" class="border rounded-lg p-4 mt-4 space-y-3">
        <h3 class="font-semibold text-sm text-muted-foreground uppercase">
          {{ $t('recipe.styleComparison') }}
        </h3>
        <p class="text-xs text-muted-foreground">{{ selectedStyle.name }}</p>
        <div class="space-y-2">
          <div
            v-for="row in styleComparison"
            :key="row.label"
            class="flex justify-between items-center"
          >
            <span class="text-sm">{{ row.label }}</span>
            <span class="flex items-center gap-2 font-mono text-xs">
              <span class="text-muted-foreground">{{ row.range }}</span>
              <span
                class="w-2 h-2 rounded-full"
                :class="row.inRange ? 'bg-green-500' : 'bg-red-500'"
                :title="row.inRange ? $t('recipe.inRange') : $t('recipe.outOfRange')"
              ></span>
            </span>
          </div>
        </div>
      </div>
    </aside>

    <RecipeToolbar
      @hop="activeWizard = 'hop'"
      @mout="activeWizard = 'mout'"
      @water="activeWizard = 'water'"
      @neural="showNeuralPrediction = !showNeuralPrediction"
    >
      <template #neural>
        <NeuralPredictionPanel
          v-if="showNeuralPrediction"
          :recipe-id="id"
          :feature-vector="neuralFeatureVector"
          @close="showNeuralPrediction = false"
        />
      </template>
    </RecipeToolbar>

    <WizardsHopWizard
      v-if="activeWizard === 'hop'"
      :target="stats.ibu || targetIbu"
      :batch-size="recipe.batchSize || 20"
      :boil-size="recipe.boilSize || 25"
      :og="stats.og || 1.05"
      @close="activeWizard = null"
      @apply="applyHopWizard"
    />
    <WizardsMoutWizard
      v-if="activeWizard === 'mout'"
      :target="stats.og || 1.05"
      :batch-size="recipe.batchSize || 20"
      :efficiency="recipe.efficiency || 75"
      @close="activeWizard = null"
      @apply="applyMoutWizard"
    />
    <WizardsWaterWizard
      v-if="activeWizard === 'water'"
      :water-profiles="waterProfiles"
      :batch-size="recipe.batchSize || 20"
      @close="activeWizard = null"
      @apply="applyWaterWizard"
    />
  </div>
  <div v-else class="text-center py-12 text-muted-foreground">{{ $t('common.loading') }}</div>
</template>

<script setup lang="ts">
import { ebcToRGB, srmToEBC, calculateColorEBC } from '~/server/utils/calculations/color'
import {
  calculateHopAmount,
  calculateHopIBU,
  calculateTotalIBU,
  type HopAddition,
  type HopUse,
  type HopForm,
} from '~/server/utils/calculations/ibu'
import { calculateOG, estimateFGSimple } from '~/server/utils/calculations/gravity'
import { calculateABV } from '~/server/utils/calculations/abv'
import { strikeTemp } from '~/server/utils/calculations/water'
import type {
  HopWizardAddition,
  MaltWizardFermentable,
  WaterWizardResult,
} from '~/server/utils/calculations/wizard'
import { volumeScaleFactor, scaleAmount, ibuScaleFactor } from '~/server/utils/calculations/scaling'
import type {
  RecipeWithIngredients,
  RecipeHop,
  RecipeWater,
  RecipeFermentable,
  RecipeYeast,
  RecipeMisc,
  BeerStyle,
  MashProfile,
  MashStep,
  Water,
  Equipment,
  StockState,
  Fermentable,
  Hop,
  Yeast,
  Misc,
} from '~/types'

const route = useRoute()
const id = route.params.id as string

const { t } = useI18n()
const recipe = ref<RecipeWithIngredients | null>(null)
const styles = ref<BeerStyle[]>([])
const waterProfiles = ref<Water[]>([])
const equipmentList = ref<Equipment[]>([])
const mashProfiles = ref<MashProfile[]>([])
const loadProfileId = ref<number | null>(null)
type StockKind = 'fermentable' | 'hop' | 'yeast' | 'misc'
type StockInfo = { inventory: number | null; alwaysOnStock: boolean }
const fermentableStockMap = ref<Record<string, StockInfo>>({})
const hopStockMap = ref<Record<string, StockInfo>>({})
const yeastStockMap = ref<Record<string, StockInfo>>({})
const miscStockMap = ref<Record<string, StockInfo>>({})
const showStockIndicator = ref(true)
const exportMessage = ref('')
const { downloadBeerXml, copyForumTable, copyHtmlTable, printRecipe } = useRecipeExport()
const { status: saveStatus, run: runSave } = useSaveState()
const saveLabel = computed(() => {
  if (saveStatus.value === 'saving') return t('common.saving')
  if (saveStatus.value === 'saved') return t('common.saved')
  if (saveStatus.value === 'error') return t('common.saveError')
  return t('common.save')
})
const activeTab = ref('general')
const activeWizard = ref<'hop' | 'mout' | 'water' | null>(null)
const showNeuralPrediction = ref(false)
const stepperObserver = ref<MutationObserver | null>(null)
const tabs = [
  { key: 'general', label: 'recipe.general' },
  { key: 'fermentables', label: 'recipe.fermentables' },
  { key: 'hops', label: 'recipe.hops' },
  { key: 'yeasts', label: 'recipe.yeasts' },
  { key: 'miscs', label: 'recipe.miscs' },
  { key: 'waters', label: 'recipe.waters' },
  { key: 'mash', label: 'recipe.mash' },
  { key: 'notes', label: 'recipe.notes' },
]

function ebcColor(ebc: number) {
  return ebcToRGB(ebc || 0)
}

const grainTotalKg = computed(() =>
  (recipe.value?.fermentables ?? []).reduce((sum, f) => sum + (f.amount || 0), 0),
)

function percentOfGrist(amountKg: number): number {
  const total = grainTotalKg.value
  if (total <= 0) return 0
  return ((amountKg || 0) / total) * 100
}

/**
 * Live recipe statistics computed from the current editor state (not the saved
 * database values), so OG/FG/IBU/colour/ABV update as soon as ingredients or
 * percentages change. Hop amounts in the editor are held in grams.
 */
const stats = computed(() => {
  const r = recipe.value
  if (!r) return { og: 0, fg: 0, ibu: 0, color: 0, abv: 0 }
  const batchSize = r.batchSize || 20
  const efficiency = r.efficiency || 75
  const og = calculateOG(
    (r.fermentables ?? []).map((f) => ({
      amount: f.amount || 0,
      yield: f.yield || 0,
      addAfterBoil: f.addAfterBoil || false,
    })),
    batchSize,
    efficiency,
  )
  const yeasts = r.yeasts ?? []
  const avgAttenuation =
    yeasts.length > 0
      ? yeasts.reduce((sum, y) => sum + (y.attenuation || 75), 0) / yeasts.length
      : 75
  const fg = estimateFGSimple(og, avgAttenuation)
  const hopAdditions: HopAddition[] = (r.hops ?? []).map((h) => ({
    amount: h.amount || 0, // editor holds grams
    alpha: h.alpha || 0,
    time: h.time || 0,
    use: (h.use || 'boil').toLowerCase().replace(' ', '_') as HopUse,
    form: (h.form || 'pellet').toLowerCase() as HopForm,
  }))
  const ibu = calculateTotalIBU(hopAdditions, {
    og,
    batchSize,
    boilSize: r.boilSize || 25,
  })
  const color = calculateColorEBC(
    (r.fermentables ?? []).map((f) => ({ amount: f.amount || 0, color: f.color || 0 })),
    batchSize,
  )
  const abv = calculateABV(og, fg)
  return { og, fg, ibu, color, abv }
})

// --- Percentage mode (BrouwHulp RecalcPercent / Adjust to 100) ---
const percentMode = ref(false)
const targetGrainBillKg = ref(0)
const fermentablePercents = ref<Record<string, number>>({})
const lockedFermentableKey = ref<string | null>(null)

function fermentableKey(f: RecipeWithIngredients['fermentables'][number], i: number): string {
  return f.id != null ? `id-${f.id}` : `new-${i}`
}

function syncFermentablePercentsFromAmounts() {
  const r = recipe.value
  if (!r) return
  targetGrainBillKg.value = Math.round(grainTotalKg.value * 1000) / 1000
  fermentablePercents.value = Object.fromEntries(
    r.fermentables.map((f, i) => [
      fermentableKey(f, i),
      Math.round(percentOfGrist(f.amount) * 10) / 10,
    ]),
  )
}

watch(percentMode, (on) => {
  if (on) syncFermentablePercentsFromAmounts()
})

function fermentablePercent(f: RecipeWithIngredients['fermentables'][number], i: number): number {
  const key = fermentableKey(f, i)
  return fermentablePercents.value[key] ?? Math.round(percentOfGrist(f.amount) * 10) / 10
}

const percentSum = computed(() =>
  (recipe.value?.fermentables ?? []).reduce((sum, f, i) => sum + fermentablePercent(f, i), 0),
)
const percentSumIs100 = computed(() => Math.abs(percentSum.value - 100) < 0.05)

/**
 * recipeFermentables.percent and lockTotal100 are not persisted yet. Keep this
 * BrouwHulp-style percentage entry state client-side, keyed by ingredient row id.
 */
function setFermentablePercent(
  f: RecipeWithIngredients['fermentables'][number],
  i: number,
  value: number,
) {
  const r = recipe.value
  if (!r) return
  const key = fermentableKey(f, i)
  const next = { ...fermentablePercents.value, [key]: Math.max(0, value || 0) }
  const lockedKey = lockedFermentableKey.value
  if (lockedKey && lockedKey !== key) {
    const fixed = (next[lockedKey] ?? 0) + (next[key] ?? 0)
    const remainingKeys = r.fermentables
      .map((row, index) => fermentableKey(row, index))
      .filter((rowKey) => rowKey !== lockedKey && rowKey !== key)
    const remainingTarget = Math.max(0, 100 - fixed)
    const currentRemaining = remainingKeys.reduce((sum, rowKey) => sum + (next[rowKey] ?? 0), 0)
    if (remainingKeys.length) {
      for (const rowKey of remainingKeys) {
        next[rowKey] =
          currentRemaining > 0
            ? ((next[rowKey] ?? 0) / currentRemaining) * remainingTarget
            : remainingTarget / remainingKeys.length
      }
    }
  }
  fermentablePercents.value = next
  applyPercentAmounts()
}

function applyPercentAmounts() {
  const r = recipe.value
  if (!r || !r.fermentables.length) return
  const total = targetGrainBillKg.value > 0 ? targetGrainBillKg.value : grainTotalKg.value
  r.fermentables.forEach((f, i) => {
    f.amount = Math.round((fermentablePercent(f, i) / 100) * total * 1000) / 1000
  })
}

function toggleFermentableLock(f: RecipeWithIngredients['fermentables'][number], i: number) {
  const key = fermentableKey(f, i)
  lockedFermentableKey.value = lockedFermentableKey.value === key ? null : key
}

// --- Scale recipe to a different batch volume (BrouwHulp cbScaleVolume) ---
const scaleVolume = ref<number>(0)

/**
 * Scale the whole recipe to a new batch volume. Grain, hop, misc and water
 * amounts scale linearly with the volume so OG/IBU/colour are preserved. Boil
 * size scales by the same factor. Mirrors BrouwHulp's cbScaleVolume.
 */
function scaleRecipe() {
  const r = recipe.value
  if (!r) return
  const target = scaleVolume.value
  if (!target || target <= 0) {
    exportMessage.value = t('recipe.scaleInvalid')
    return
  }
  const factor = volumeScaleFactor(r.batchSize || 20, target)
  if (factor === 1) {
    exportMessage.value = t('recipe.scaleUnchanged')
    return
  }
  r.fermentables.forEach((f) => {
    f.amount = scaleAmount(f.amount || 0, factor)
  })
  r.hops.forEach((h) => {
    // Editor holds hop amounts in grams; round to whole grams after scaling.
    h.amount = Math.round((h.amount || 0) * factor)
  })
  if (r.miscs) r.miscs.forEach((m) => (m.amount = scaleAmount(m.amount || 0, factor)))
  if (r.waters) r.waters.forEach((w) => (w.amount = scaleAmount(w.amount || 0, factor)))
  r.boilSize = scaleAmount(r.boilSize || 0, factor)
  r.batchSize = target
  void saveRecipe()
  exportMessage.value = t('recipe.scaleApplied', { volume: target })
}

// --- Adjust hops to a target bitterness (BrouwHulp AdjustBitterness) ---
const targetIbu = ref<number>(0)
const ibuEntryMode = ref(false)
const hopIbuContributions = ref<Record<string, number>>({})

function hopKey(h: RecipeHop, i: number): string {
  return h.id != null ? `id-${h.id}` : `new-${i}`
}

function syncHopIbuContributions() {
  const r = recipe.value
  if (!r) return
  hopIbuContributions.value = Object.fromEntries(
    r.hops.map((h, i) => [hopKey(h, i), Math.round(hopIBU(h) * 10) / 10]),
  )
}

watch(ibuEntryMode, (on) => {
  if (on) syncHopIbuContributions()
})

/** Scale all hop amounts proportionally so the recipe hits the target IBU. */
function applyTargetIbu() {
  const r = recipe.value
  if (!r) return
  const target = targetIbu.value
  if (!target || target <= 0) return
  const factor = ibuScaleFactor(stats.value.ibu, target)
  if (factor === 1) return
  r.hops.forEach((h) => {
    h.amount = Math.round((h.amount || 0) * factor)
  })
  if (ibuEntryMode.value) syncHopIbuContributions()
}

/** recipeHops.contributionIbu is not in the schema yet; this is client-only per row id. */
function hopContributionIbu(h: RecipeHop, i: number): number {
  return ibuEntryMode.value ? (hopIbuContributions.value[hopKey(h, i)] ?? hopIBU(h)) : hopIBU(h)
}

function setHopContributionIbu(h: RecipeHop, i: number, value: number) {
  hopIbuContributions.value = {
    ...hopIbuContributions.value,
    [hopKey(h, i)]: Math.max(0, value || 0),
  }
  refreshHopAmountFromIbu(h, i)
}

function refreshHopAmountFromIbu(h: RecipeHop, i: number) {
  if (!ibuEntryMode.value || !recipe.value) return
  const target = hopIbuContributions.value[hopKey(h, i)] ?? 0
  h.amount = Math.round(
    calculateHopAmount(
      target,
      h.alpha || 0,
      h.time || 0,
      (h.use || 'boil').toLowerCase().replace(' ', '_') as HopUse,
      (h.form || 'pellet').toLowerCase() as HopForm,
      {
        og: stats.value.og || 1.05,
        batchSize: recipe.value.batchSize || 20,
        boilSize: recipe.value.boilSize || 25,
      },
      'tinseth',
    ),
  )
}

const hopTotalGrams = computed(() =>
  (recipe.value?.hops ?? []).reduce((sum, h) => sum + (h.amount || 0), 0),
)
const neuralFeatureVector = computed(() => {
  const gristKg = grainTotalKg.value
  const hopsKg = hopTotalGrams.value / 1000
  const ingredientKg = gristKg + hopsKg
  const fermentablePct = ingredientKg > 0 ? (gristKg / ingredientKg) * 100 : 0
  const hopPct = gristKg > 0 ? (hopsKg / gristKg) * 100 : 0
  return [
    {
      key: 'og',
      label: 'OG',
      value: stats.value.og,
      aliases: ['originalgravity', 'begin sg', 'beginsg'],
    },
    { key: 'ibu', label: 'IBU', value: stats.value.ibu, aliases: ['bitterness'] },
    { key: 'ebc', label: 'EBC', value: stats.value.color, aliases: ['color', 'colour', 'srm'] },
    {
      key: 'fermentablePercent',
      label: 'Fermentable %',
      value: fermentablePct,
      aliases: ['fermentablepct', 'gristpercent', 'moutpercent'],
    },
    { key: 'hopPercent', label: 'Hop %', value: hopPct, aliases: ['hoppct', 'hoprate'] },
  ]
})
const totalHopIbu = computed(() =>
  (recipe.value?.hops ?? []).reduce((sum, h, i) => sum + hopContributionIbu(h, i), 0),
)

function normalizeName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase()
}

function buildStockMap<
  T extends { id: number; name: string; inventory: number | null; alwaysOnStock: boolean | null },
>(
  rows: T[],
  convertInventory: (value: number) => number = (value) => value,
): Record<string, StockInfo> {
  const entries: Record<string, StockInfo> = {}
  for (const row of rows) {
    const info = {
      inventory: row.inventory == null ? null : convertInventory(row.inventory),
      alwaysOnStock: row.alwaysOnStock === true,
    }
    entries[`id:${row.id}`] = info
    entries[`name:${normalizeName(row.name)}`] = info
  }
  return entries
}

function stockMap(kind: StockKind): Record<string, StockInfo> {
  if (kind === 'fermentable') return fermentableStockMap.value
  if (kind === 'hop') return hopStockMap.value
  if (kind === 'yeast') return yeastStockMap.value
  return miscStockMap.value
}

function stockId(
  row: RecipeFermentable | RecipeHop | RecipeYeast | RecipeMisc,
  kind: StockKind,
): number | null {
  if (kind === 'fermentable') return (row as RecipeFermentable).fermentableId ?? null
  if (kind === 'hop') return (row as RecipeHop).hopId ?? null
  if (kind === 'yeast') return (row as RecipeYeast).yeastId ?? null
  return (row as RecipeMisc).miscId ?? null
}

function stockInfoFor(
  kind: StockKind,
  row: RecipeFermentable | RecipeHop | RecipeYeast | RecipeMisc,
): StockInfo | null {
  const map = stockMap(kind)
  const id = stockId(row, kind)
  const idMatch = id == null ? undefined : map[`id:${id}`]
  if (idMatch) return idMatch
  return map[`name:${normalizeName(row.name)}`] ?? null
}

function stockStateFor(
  kind: StockKind,
  row: RecipeFermentable | RecipeHop | RecipeYeast | RecipeMisc,
): StockState {
  const info = stockInfoFor(kind, row)
  if (!info) return 'unknown'
  if (info.alwaysOnStock) return 'green'
  if (info.inventory == null) return 'unknown'
  const required = Number(row.amount ?? 0)
  if (info.inventory <= 0 && required > 0) return 'red'
  if (info.inventory < required) return 'yellow'
  return 'green'
}

function stockLabelFor(
  kind: StockKind,
  row: RecipeFermentable | RecipeHop | RecipeYeast | RecipeMisc,
): string {
  const info = stockInfoFor(kind, row)
  if (!info) return '—'
  if (info.alwaysOnStock) return '∞'
  if (info.inventory == null) return '—'
  if (kind === 'hop') return `${info.inventory.toFixed(0)} g`
  if (kind === 'fermentable') return `${info.inventory.toFixed(2)} kg`
  return `${info.inventory.toFixed(2)}`
}

/** Live estimated IBU contribution of a single hop addition (amount in grams). */
function hopIBU(h: RecipeHop): number {
  const r = recipe.value
  if (!r || !h.amount) return 0
  return calculateHopIBU(
    {
      amount: h.amount, // editor holds grams
      alpha: h.alpha || 0,
      time: h.time || 0,
      use: (h.use || 'boil').toLowerCase().replace(' ', '_') as HopUse,
      form: (h.form || 'pellet').toLowerCase() as HopForm,
    },
    {
      og: stats.value.og || 1.05,
      batchSize: r.batchSize || 20,
      boilSize: r.boilSize || 25,
    },
  )
}

const selectedStyle = computed(
  () => styles.value.find((s) => s.id === recipe.value?.styleId) ?? null,
)

const selectedEquipment = computed(
  () => equipmentList.value.find((e) => e.id === recipe.value?.equipmentId) ?? null,
)

function formatLiters(value: number): string {
  return `${Math.max(0, value).toFixed(1)} L`
}

const mashWaterDisplay = computed(() => {
  const r = recipe.value
  if (!r) return []
  const grainKg = grainTotalKg.value
  // TODO: Replace the BrouwHulp-style 3 L/kg default with a persisted mash-ratio setting.
  const mashRatio = 3
  const mashWater = grainKg * mashRatio
  const absorption = grainKg * 0.8
  const lauterDeadspace = selectedEquipment.value?.lauterDeadspace ?? 0
  const boilSize = r.boilSize || selectedEquipment.value?.boilSize || 0
  const firstStepTemp = r.mashSteps[0]?.stepTemp ?? 65
  const strike = strikeTemp(grainKg, r.grainTemp ?? 20, mashRatio, firstStepTemp)
  const fermenterWater =
    (r.batchSize || selectedEquipment.value?.batchSize || 0) -
    (selectedEquipment.value?.trubChillerLoss ?? 0) +
    (selectedEquipment.value?.topUpWater ?? 0)
  return [
    { label: t('recipe.mashWaterTotal'), value: formatLiters(mashWater) },
    {
      label: t('recipe.spargeWater'),
      value: formatLiters(boilSize - (mashWater - absorption - lauterDeadspace)),
    },
    { label: t('recipe.strikeTemp'), value: `${strike.toFixed(1)} °C` },
    { label: t('recipe.fermenterWater'), value: formatLiters(fermenterWater) },
  ]
})

const styleRangeBars = computed(() => {
  const s = selectedStyle.value
  const colorMinEbc = s?.colorMin != null ? srmToEBC(s.colorMin) : null
  const colorMaxEbc = s?.colorMax != null ? srmToEBC(s.colorMax) : null
  return [
    { label: 'OG', min: s?.ogMin, max: s?.ogMax, value: stats.value.og, unit: '' },
    { label: 'FG', min: s?.fgMin, max: s?.fgMax, value: stats.value.fg, unit: '' },
    { label: 'IBU', min: s?.ibuMin, max: s?.ibuMax, value: stats.value.ibu, unit: 'IBU' },
    { label: 'EBC', min: colorMinEbc, max: colorMaxEbc, value: stats.value.color, unit: 'EBC' },
    { label: 'ABV', min: s?.abvMin, max: s?.abvMax, value: stats.value.abv, unit: '%' },
    {
      label: 'CO₂',
      min: s?.carbMin,
      max: s?.carbMax,
      value: recipe.value?.carbonation ?? 0,
      unit: 'vol',
    },
  ]
})

/**
 * Copy the steps of a reusable mash profile (template) into this recipe's own
 * embedded mash steps. Recipes own their mash per the BeerXML MASH_STEPS model;
 * profiles merely act as starting points.
 */
async function loadStepsFromProfile() {
  const r = recipe.value
  if (!r || !loadProfileId.value) return
  const profile = await $fetch<MashProfile & { steps: MashStep[] }>(
    `/api/mashes/${loadProfileId.value}`,
  )
  r.mashName = profile.name
  r.grainTemp = profile.grainTemp ?? 20
  r.tunTemp = profile.tunTemp ?? 20
  r.spargeTemp = profile.spargeTemp ?? 78
  r.mashSteps = (profile.steps ?? []).map((s, i) => ({
    name: s.name,
    type: s.type ?? 'Infusion',
    stepTemp: s.stepTemp ?? 65,
    stepTime: s.stepTime ?? 60,
    rampTime: s.rampTime ?? 0,
    infuseAmount: s.infuseAmount ?? 0,
    sortOrder: i,
  })) as RecipeWithIngredients['mashSteps']
}

function addMashStep() {
  recipe.value!.mashSteps.push({
    name: '',
    type: 'Infusion',
    stepTemp: 65,
    stepTime: 60,
    rampTime: 0,
    infuseAmount: 0,
    sortOrder: recipe.value!.mashSteps.length,
  } as RecipeWithIngredients['mashSteps'][number])
}

function removeMashStep(i: number) {
  recipe.value!.mashSteps.splice(i, 1)
}

const styleComparison = computed(() => {
  const s = selectedStyle.value
  const r = recipe.value
  if (!s || !r) return []
  const live = stats.value
  const inRange = (val: number | null, min: number | null, max: number | null) =>
    val != null && min != null && max != null && val >= min && val <= max
  const colorMaxEbc = s.colorMax != null ? srmToEBC(s.colorMax) : null
  const colorMinEbc = s.colorMin != null ? srmToEBC(s.colorMin) : null
  return [
    {
      label: 'OG',
      range: `${s.ogMin?.toFixed(3)}–${s.ogMax?.toFixed(3)}`,
      inRange: inRange(live.og, s.ogMin, s.ogMax),
    },
    {
      label: 'FG',
      range: `${s.fgMin?.toFixed(3)}–${s.fgMax?.toFixed(3)}`,
      inRange: inRange(live.fg, s.fgMin, s.fgMax),
    },
    {
      label: 'IBU',
      range: `${s.ibuMin?.toFixed(0)}–${s.ibuMax?.toFixed(0)}`,
      inRange: inRange(live.ibu, s.ibuMin, s.ibuMax),
    },
    {
      label: t('recipe.color'),
      range: `${colorMinEbc?.toFixed(0)}–${colorMaxEbc?.toFixed(0)} EBC`,
      inRange: inRange(live.color, colorMinEbc, colorMaxEbc),
    },
    {
      label: 'ABV',
      range: `${s.abvMin?.toFixed(1)}–${s.abvMax?.toFixed(1)}%`,
      inRange: inRange(live.abv, s.abvMin, s.abvMax),
    },
  ]
})

async function exportRecipe() {
  if (!recipe.value) return
  await downloadBeerXml(recipe.value.id, recipe.value.name)
}

async function copyForum() {
  if (!recipe.value) return
  const hopsKg = toExportRecipe(recipe.value)
  const ok = await copyForumTable(hopsKg)
  exportMessage.value = ok ? t('recipe.copied') : t('recipe.copyFailed')
}

async function copyHtml() {
  if (!recipe.value) return
  const hopsKg = toExportRecipe(recipe.value)
  const ok = await copyHtmlTable(hopsKg)
  exportMessage.value = ok ? t('recipe.copied') : t('recipe.copyFailed')
}

function printRecipeSheet() {
  if (!recipe.value) return
  printRecipe(toExportRecipe(recipe.value))
}

/** Hop amounts are held in grams in the editor; convert back to kg for export. */
function toExportRecipe(r: RecipeWithIngredients): RecipeWithIngredients {
  return {
    ...r,
    hops: r.hops.map((h) => ({ ...h, amount: (h.amount || 0) / 1000 })),
  }
}
function addFermentable() {
  recipe.value!.fermentables.push({
    name: '',
    amount: 0,
    color: 0,
    yield: 80,
    type: 'Grain',
    grainType: 'Base',
    added: 'Mash',
    addAfterBoil: false,
  } as RecipeWithIngredients['fermentables'][number])
  if (percentMode.value) syncFermentablePercentsFromAmounts()
}
function removeFermentable(i: number) {
  recipe.value!.fermentables.splice(i, 1)
  if (percentMode.value) syncFermentablePercentsFromAmounts()
}
function addHop() {
  recipe.value!.hops.push({
    name: '',
    amount: 0,
    alpha: 5,
    time: 60,
    use: 'Boil',
    form: 'Pellet',
  } as RecipeWithIngredients['hops'][number])
  if (ibuEntryMode.value) syncHopIbuContributions()
}
function removeHop(i: number) {
  recipe.value!.hops.splice(i, 1)
  if (ibuEntryMode.value) syncHopIbuContributions()
}
function addYeast() {
  recipe.value!.yeasts.push({
    name: '',
    attenuation: 75,
  } as RecipeWithIngredients['yeasts'][number])
}

// BeerXML MISC type / use option lists (see beerxml.com).
const miscTypes = ['Spice', 'Fining', 'Water Agent', 'Herb', 'Flavor', 'Nutrient', 'Other']
const miscUses = ['Boil', 'Mash', 'Primary', 'Secondary', 'Bottling']

function addMisc() {
  recipe.value!.miscs.push({
    name: '',
    type: 'Other',
    amount: 0,
    time: 0,
    use: 'Boil',
  } as RecipeWithIngredients['miscs'][number])
}

function removeMisc(i: number) {
  recipe.value!.miscs.splice(i, 1)
}

// Brewing-water additions (BeerXML WATERS). Ion figures are in ppm (mg/L).
function addWater() {
  recipe.value!.waters.push({
    name: '',
    amount: 0,
    calcium: 0,
    bicarbonate: 0,
    sulfate: 0,
    chloride: 0,
    sodium: 0,
    magnesium: 0,
  } as RecipeWater)
}

function removeWater(i: number) {
  recipe.value!.waters.splice(i, 1)
}

/** Copy the ion profile from a saved water onto the selected recipe water row. */
function applyWaterProfile(i: number, profileId: number | null) {
  if (!profileId) return
  const p = waterProfiles.value.find((w) => w.id === profileId)
  if (!p) return
  const row = recipe.value!.waters[i]
  if (!row) return
  row.name = p.name
  row.calcium = p.calcium ?? 0
  row.bicarbonate = p.bicarbonate ?? 0
  row.sulfate = p.sulfate ?? 0
  row.chloride = p.chloride ?? 0
  row.sodium = p.sodium ?? 0
  row.magnesium = p.magnesium ?? 0
}

function applyHopWizard(mode: 'append' | 'replace', hops: HopWizardAddition[]) {
  const r = recipe.value
  if (!r) return
  const rows = hops.map((hop) => ({
    name: hop.name,
    amount: hop.amount,
    alpha: hop.alpha,
    time: hop.time,
    use: hop.use,
    form: hop.form,
  })) as RecipeWithIngredients['hops']
  r.hops = mode === 'replace' ? rows : [...r.hops, ...rows]
  if (ibuEntryMode.value) syncHopIbuContributions()
  activeWizard.value = null
}

function applyMoutWizard(mode: 'append' | 'replace', fermentables: MaltWizardFermentable[]) {
  const r = recipe.value
  if (!r) return
  const rows = fermentables.map((fermentable) => ({
    name: fermentable.name,
    amount: fermentable.amount,
    color: fermentable.color,
    yield: fermentable.yield,
    type: fermentable.type,
    grainType: fermentable.grainType,
    added: fermentable.added,
    addAfterBoil: fermentable.addAfterBoil,
  })) as RecipeWithIngredients['fermentables']
  r.fermentables = mode === 'replace' ? rows : [...r.fermentables, ...rows]
  if (percentMode.value) syncFermentablePercentsFromAmounts()
  activeWizard.value = null
}

function applyWaterWizard(result: WaterWizardResult) {
  const r = recipe.value
  if (!r) return
  r.waters = [
    ...r.waters,
    {
      name: t('wizard.water.adjustedProfile'),
      amount: r.batchSize || 20,
      calcium: Math.round(result.finalProfile.calcium),
      bicarbonate: Math.round(result.finalProfile.bicarbonate),
      sulfate: Math.round(result.finalProfile.sulfate),
      chloride: Math.round(result.finalProfile.chloride),
      sodium: Math.round(result.finalProfile.sodium),
      magnesium: Math.round(result.finalProfile.magnesium),
    } as RecipeWater,
  ]
  const salts = [
    ['CaCl2', result.additions.cacl2],
    ['CaSO4', result.additions.caso4],
    ['MgSO4', result.additions.mgso4],
    ['NaCl', result.additions.nacl],
    ['NaHCO3', result.additions.nahco3],
    ['CaCO3', result.additions.caco3],
  ] as const
  for (const [name, amount] of salts) {
    if (amount <= 0) continue
    r.miscs.push({ name, amount, type: 'Water Agent', use: 'Mash', time: 0 } as RecipeMisc)
  }
  activeWizard.value = null
}

async function loadRecipe() {
  recipe.value = (await $fetch(`/api/recipes/${id}`)) as unknown as RecipeWithIngredients
  recipe.value!.fermentables = recipe.value!.fermentables || []
  recipe.value!.hops = recipe.value!.hops || []
  recipe.value!.yeasts = recipe.value!.yeasts || []
  recipe.value!.miscs = recipe.value!.miscs || []
  recipe.value!.waters = recipe.value!.waters || []
  recipe.value!.mashSteps = recipe.value!.mashSteps || []
  // Pre-fill the scale-to field with the current batch size so the Scale
  // button has a sensible starting value to edit.
  scaleVolume.value = recipe.value!.batchSize || 0
}

async function saveRecipe() {
  await runSave(async () => {
    // Persist the live calculated stats alongside the recipe.
    calculateRecipe()
    // Convert hop amounts from grams to kg for storage
    const hopsForSave = recipe.value!.hops.map((h: RecipeHop) => ({
      ...h,
      amount: h.amount / 1000,
    }))
    // Keep the embedded mash steps in display order.
    const mashStepsForSave = recipe.value!.mashSteps.map((s, i) => ({ ...s, sortOrder: i }))
    await $fetch(`/api/recipes/${id}`, {
      method: 'PUT',
      body: { ...recipe.value, hops: hopsForSave, mashSteps: mashStepsForSave },
    })
  })
}

async function calculateRecipe() {
  // Compute from the live editor state (not the saved database values) so the
  // stored recipe stats reflect any unsaved ingredient or percentage changes.
  const r = recipe.value
  if (!r) return
  const s = stats.value
  r.og = s.og
  r.fg = s.fg
  r.ibu = s.ibu
  r.color = s.color
  r.abv = s.abv
}

/** Recalculate the stored recipe statistics and persist them. */
async function recalculateRecipe() {
  await saveRecipe()
  exportMessage.value = t('recipe.recalculated')
}

function stepForInput(input: HTMLInputElement): string {
  const label = `${input.name} ${input.id} ${input.getAttribute('aria-label') ?? ''}`.toLowerCase()
  const model = input.getAttribute('v-model') ?? ''
  const currentStep = input.getAttribute('step')
  if (currentStep && currentStep !== 'any') return currentStep
  if (label.includes('time')) return '1'
  if (label.includes('temp')) return '0.5'
  if (label.includes('percent') || label.includes('yield') || label.includes('alpha')) return '1'
  if (label.includes('gravity') || model.includes('og') || model.includes('fg')) return '0.001'
  return '0.05'
}

function changeNumericInput(input: HTMLInputElement, direction: 1 | -1) {
  const step = stepForInput(input)
  input.step = step
  if (direction > 0) input.stepUp()
  else input.stepDown()
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

function installInlineSteppers() {
  const root = document.querySelector('[data-recipe-editor]')
  if (!root) return
  root.querySelectorAll<HTMLInputElement>('input[type="number"]').forEach((input) => {
    if (input.closest('[data-inline-stepper]')) return
    const wrapper = document.createElement('span')
    wrapper.dataset.inlineStepper = 'true'
    wrapper.className = 'inline-flex w-full items-stretch rounded border border-input bg-background'
    input.parentNode?.insertBefore(wrapper, input)
    wrapper.appendChild(input)
    input.classList.add('min-w-0', 'flex-1', 'border-0')
    const minus = document.createElement('button')
    const plus = document.createElement('button')
    for (const [button, label, direction] of [
      [minus, '−', -1],
      [plus, '+', 1],
    ] as const) {
      button.type = 'button'
      button.textContent = label
      button.className =
        'px-2 text-sm font-semibold hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring'
      button.addEventListener('click', () => changeNumericInput(input, direction))
    }
    wrapper.insertBefore(minus, input)
    wrapper.appendChild(plus)
  })
}

onMounted(async () => {
  await loadRecipe()
  styles.value = await $fetch<BeerStyle[]>('/api/styles')
  waterProfiles.value = await $fetch<Water[]>('/api/waters')
  equipmentList.value = await $fetch<Equipment[]>('/api/equipment')
  mashProfiles.value = await $fetch<MashProfile[]>('/api/mashes')
  // Load ingredient stock levels for the recipe ingredient list. Hop inventory is stored in kg; the editor displays hop additions in grams.
  const [settings, fermDb, hopDb, yeastDb, miscDb] = await Promise.all([
    $fetch<Record<string, string>>('/api/settings'),
    $fetch<Fermentable[]>('/api/fermentables'),
    $fetch<Hop[]>('/api/hops'),
    $fetch<Yeast[]>('/api/yeasts'),
    $fetch<Misc[]>('/api/miscs'),
  ])
  showStockIndicator.value = settings.showStockIndicator !== 'false'
  fermentableStockMap.value = buildStockMap(fermDb)
  hopStockMap.value = buildStockMap(hopDb, (inventoryKg) => inventoryKg * 1000)
  yeastStockMap.value = buildStockMap(yeastDb)
  miscStockMap.value = buildStockMap(miscDb)
  // Convert hop amounts from kg to grams for display
  recipe.value!.hops = recipe.value!.hops.map((h: RecipeHop) => ({
    ...h,
    amount: (h.amount || 0) * 1000,
  }))
  await nextTick()
  installInlineSteppers()
  const root = document.querySelector('[data-recipe-editor]')
  if (root) {
    stepperObserver.value = new MutationObserver(() => installInlineSteppers())
    stepperObserver.value.observe(root, { childList: true, subtree: true })
  }
})

watch([activeTab, activeWizard], async () => {
  await nextTick()
  installInlineSteppers()
})

onBeforeUnmount(() => {
  stepperObserver.value?.disconnect()
})
</script>
