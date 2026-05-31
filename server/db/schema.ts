import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ============================================================
// Ingredient Databases
// ============================================================

export const fermentables = sqliteTable('fermentables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull().default('Grain'), // Grain, Sugar, Extract, Dry Extract, Adjunct
  yield: real('yield').notNull().default(0), // percentage
  color: real('color').notNull().default(0), // EBC
  addAfterBoil: integer('add_after_boil', { mode: 'boolean' }).default(false),
  origin: text('origin').default(''),
  supplier: text('supplier').default(''),
  coarseFineDiff: real('coarse_fine_diff').default(0),
  moisture: real('moisture').default(0),
  diastaticPower: real('diastatic_power').default(0),
  protein: real('protein').default(0),
  maxInBatch: real('max_in_batch').default(100),
  recommendMash: integer('recommend_mash', { mode: 'boolean' }).default(true),
  grainType: text('grain_type').default('Base'), // Base, Roast, Crystal, Kilned, Sour, Special, No malt
  added: text('added').default('Mash'), // Mash, Boil, Fermentation, Lagering, Bottle
  notes: text('notes').default(''),
  substitutes: text('substitutes').default(''),
  inventory: real('inventory').default(0),
  cost: real('cost').default(0),
  alwaysOnStock: integer('always_on_stock', { mode: 'boolean' }).default(false),
})

export const hops = sqliteTable('hops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  alpha: real('alpha').notNull().default(0), // percentage
  beta: real('beta').default(0),
  type: text('type').default('Both'), // Bittering, Aroma, Both
  form: text('form').default('Pellet'), // Pellet, Plug, Leaf
  use: text('use').default('Boil'), // Boil, Aroma, Dry Hop, First Wort, Whirlpool, Mash
  hsi: real('hsi').default(0), // Hop Stability Index
  origin: text('origin').default(''),
  substitutes: text('substitutes').default(''),
  cohumulone: real('cohumulone').default(0),
  myrcene: real('myrcene').default(0),
  humulene: real('humulene').default(0),
  caryophyllene: real('caryophyllene').default(0),
  totalOil: real('total_oil').default(0),
  notes: text('notes').default(''),
  inventory: real('inventory').default(0),
  cost: real('cost').default(0),
  alwaysOnStock: integer('always_on_stock', { mode: 'boolean' }).default(false),
  // BrouwHulp hop storage parameters used by the hop-aging calculation
  // (alpha-acid degradation depends on time since harvest, storage temperature
  // and packaging form). Per-record overrides; falls back to global settings
  // when zero/empty.
  storageTemp: real('storage_temp').default(0), // °C
  storageMethod: text('storage_method').default(''), // freezer, fridge, room, vacuum, foil
})

export const yeasts = sqliteTable('yeasts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').default('Ale'), // Ale, Lager, Wheat, Wine, Champagne
  form: text('form').default('Liquid'), // Liquid, Dry, Slant, Culture, Frozen, Bottle
  laboratory: text('laboratory').default(''),
  productId: text('product_id').default(''),
  attenuation: real('attenuation').default(75),
  minTemperature: real('min_temperature').default(15),
  maxTemperature: real('max_temperature').default(25),
  flocculation: text('flocculation').default('Medium'), // Low, Medium, High, Very High
  starterType: text('starter_type').default(''),
  notes: text('notes').default(''),
  substitutes: text('substitutes').default(''),
  inventory: real('inventory').default(0),
  cost: real('cost').default(0),
  alwaysOnStock: integer('always_on_stock', { mode: 'boolean' }).default(false),
})

export const miscs = sqliteTable('miscs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').default('Spice'), // Spice, Herb, Flavor, Fining, Water Agent, Nutrient, Other
  use: text('use').default('Boil'), // Starter, Mash, Boil, Primary, Secondary, Bottling
  useFor: text('use_for').default(''),
  notes: text('notes').default(''),
  inventory: real('inventory').default(0),
  cost: real('cost').default(0),
  alwaysOnStock: integer('always_on_stock', { mode: 'boolean' }).default(false),
})

export const waters = sqliteTable('waters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  calcium: real('calcium').default(0),
  bicarbonate: real('bicarbonate').default(0),
  sulfate: real('sulfate').default(0),
  chloride: real('chloride').default(0),
  sodium: real('sodium').default(0),
  magnesium: real('magnesium').default(0),
  ph: real('ph').default(7.0),
  totalAlkalinity: real('total_alkalinity').default(0),
  notes: text('notes').default(''),
  // BrouwHulp "Standaard water" flag. Auto-fills Bron 1 in the recipe water
  // treatment screen. Exactly one row should typically be flagged true; this
  // is enforced in the API/UI rather than at the schema level.
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
})

export const equipment = sqliteTable('equipment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  boilSize: real('boil_size').default(0),
  batchSize: real('batch_size').default(0),
  tunVolume: real('tun_volume').default(0),
  tunWeight: real('tun_weight').default(0),
  tunSpecificHeat: real('tun_specific_heat').default(0.12),
  topUpWater: real('top_up_water').default(0),
  topUpKettle: real('top_up_kettle').default(0),
  trubChillerLoss: real('trub_chiller_loss').default(0),
  evapRate: real('evap_rate').default(10), // percentage per hour
  boilTime: real('boil_time').default(60),
  lauterDeadspace: real('lauter_deadspace').default(0),
  kettleVolume: real('kettle_volume').default(0),
  efficiency: real('efficiency').default(75),
  hopUtilization: real('hop_utilization').default(100),
  notes: text('notes').default(''),
})

export const beerStyles = sqliteTable('beer_styles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').default(''),
  categoryNumber: text('category_number').default(''),
  styleLetter: text('style_letter').default(''),
  styleGuide: text('style_guide').default('BJCP'),
  type: text('type').default('Ale'), // Ale, Lager, Mixed, Wheat, Cider, Mead
  ogMin: real('og_min').default(1.0),
  ogMax: real('og_max').default(1.1),
  fgMin: real('fg_min').default(1.0),
  fgMax: real('fg_max').default(1.03),
  ibuMin: real('ibu_min').default(0),
  ibuMax: real('ibu_max').default(100),
  colorMin: real('color_min').default(0), // SRM
  colorMax: real('color_max').default(40),
  abvMin: real('abv_min').default(0),
  abvMax: real('abv_max').default(15),
  carbMin: real('carb_min').default(0),
  carbMax: real('carb_max').default(4),
  notes: text('notes').default(''),
  substitutes: text('substitutes').default(''),
})

export const mashProfiles = sqliteTable('mash_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  grainTemp: real('grain_temp').default(20),
  tunTemp: real('tun_temp').default(20),
  spargeTemp: real('sparge_temp').default(78),
  notes: text('notes').default(''),
})

export const mashSteps = sqliteTable('mash_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mashProfileId: integer('mash_profile_id')
    .notNull()
    .references(() => mashProfiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').default('Infusion'), // Infusion, Temperature, Decoction
  stepTemp: real('step_temp').notNull().default(65),
  stepTime: real('step_time').notNull().default(60), // minutes
  rampTime: real('ramp_time').default(0),
  infuseAmount: real('infuse_amount').default(0), // liters
  sortOrder: integer('sort_order').default(0),
})

// ============================================================
// Recipes
// ============================================================

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // BrouwHulp recipe "code" / volgnummer (e.g. "JV-042"). Optional, free-form.
  code: text('code').default(''),
  type: text('type').default('All Grain'), // All Grain, Extract, Partial Mash
  batchSize: real('batch_size').default(20),
  boilSize: real('boil_size').default(25),
  boilTime: real('boil_time').default(60),
  efficiency: real('efficiency').default(75),
  styleId: integer('style_id').references(() => beerStyles.id),
  equipmentId: integer('equipment_id').references(() => equipment.id),
  // Legacy reference to a shared mash profile. Recipes now embed their own mash
  // (mash header fields below + recipeMashSteps), matching the BeerXML MASH /
  // MASH_STEPS record sets. Kept for backward compatibility; no longer used by
  // the recipe editor.
  mashProfileId: integer('mash_profile_id').references(() => mashProfiles.id),
  // Embedded BeerXML MASH header. The MASH_STEPS live in `recipeMashSteps`.
  mashName: text('mash_name').default(''),
  grainTemp: real('grain_temp').default(20),
  tunTemp: real('tun_temp').default(20),
  spargeTemp: real('sparge_temp').default(78),
  mashPh: real('mash_ph').default(0),
  mashNotes: text('mash_notes').default(''),
  og: real('og').default(0),
  fg: real('fg').default(0),
  ibu: real('ibu').default(0),
  color: real('color').default(0), // EBC
  abv: real('abv').default(0),
  carbonation: real('carbonation').default(0),
  notes: text('notes').default(''),
  createdAt: text('created_at').default(''),
  updatedAt: text('updated_at').default(''),
})

export const recipeFermentables = sqliteTable('recipe_fermentables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  fermentableId: integer('fermentable_id').references(() => fermentables.id),
  name: text('name').notNull(),
  type: text('type').default('Grain'),
  amount: real('amount').notNull().default(0), // kg
  yield: real('yield').default(0),
  color: real('color').default(0), // EBC
  addAfterBoil: integer('add_after_boil', { mode: 'boolean' }).default(false),
  grainType: text('grain_type').default('Base'),
  added: text('added').default('Mash'),
})

export const recipeHops = sqliteTable('recipe_hops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  hopId: integer('hop_id').references(() => hops.id),
  name: text('name').notNull(),
  amount: real('amount').notNull().default(0), // kg
  alpha: real('alpha').default(0),
  time: real('time').default(60), // minutes
  use: text('use').default('Boil'),
  form: text('form').default('Pellet'),
})

export const recipeYeasts = sqliteTable('recipe_yeasts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  yeastId: integer('yeast_id').references(() => yeasts.id),
  name: text('name').notNull(),
  amount: real('amount').default(0),
  attenuation: real('attenuation').default(75),
  starterVolume: real('starter_volume').default(0),
  starterOg: real('starter_og').default(0),
})

export const recipeMiscs = sqliteTable('recipe_miscs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  miscId: integer('misc_id').references(() => miscs.id),
  name: text('name').notNull(),
  type: text('type').default('Other'), // Spice, Herb, Flavor, Fining, Water Agent, Nutrient, Other
  amount: real('amount').default(0),
  time: real('time').default(0),
  use: text('use').default('Boil'), // Boil, Mash, Primary, Secondary, Bottling
})

export const recipeWaters = sqliteTable('recipe_waters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  waterId: integer('water_id').references(() => waters.id),
  name: text('name').notNull(),
  amount: real('amount').default(0), // liters
  calcium: real('calcium').default(0),
  bicarbonate: real('bicarbonate').default(0),
  sulfate: real('sulfate').default(0),
  chloride: real('chloride').default(0),
  sodium: real('sodium').default(0),
  magnesium: real('magnesium').default(0),
})

// Embedded mash steps owned by a recipe (BeerXML MASH_STEPS). Mirrors the
// reusable `mashSteps` template table, but scoped to a single recipe.
export const recipeMashSteps = sqliteTable('recipe_mash_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').default('Infusion'), // Infusion, Temperature, Decoction
  stepTemp: real('step_temp').notNull().default(65),
  stepTime: real('step_time').notNull().default(60), // minutes
  rampTime: real('ramp_time').default(0),
  infuseAmount: real('infuse_amount').default(0), // liters
  sortOrder: integer('sort_order').default(0),
})

// ============================================================
// Brews
// ============================================================

export const brews = sqliteTable('brews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').references(() => recipes.id),
  name: text('name').notNull(),
  // BrouwHulp brew "code" / volgnummer (independent of the recipe code, e.g.
  // sequential brew number for the year). Optional, free-form.
  code: text('code').default(''),
  brewDate: text('brew_date').default(''),
  status: text('status').default('planned'), // planned, brewing, fermenting, conditioning, completed
  ogActual: real('og_actual').default(0),
  fgActual: real('fg_actual').default(0),
  efficiencyActual: real('efficiency_actual').default(0),
  notes: text('notes').default(''),
  brewer: text('brewer').default(''),
  assistantBrewer: text('assistant_brewer').default(''),
  tasteNotes: text('taste_notes').default(''),
  tasteRating: real('taste_rating').default(0),
  // Structured tasting evaluation (BrouwHulp proefnotities categories).
  tasteAppearance: text('taste_appearance').default(''),
  tasteAroma: text('taste_aroma').default(''),
  tasteFlavor: text('taste_flavor').default(''),
  tasteMouthfeel: text('taste_mouthfeel').default(''),
  tasteAftertaste: text('taste_aftertaste').default(''),
  tasteOverall: text('taste_overall').default(''),
  storageTemp: real('storage_temp').default(0),
  startTime: text('start_time').default(''),
  endTime: text('end_time').default(''),
  volumeFermenter: real('volume_fermenter').default(0),
  waterAddedFermenter: real('water_added_fermenter').default(0),
  bottleVolume: real('bottle_volume').default(0),
  kegVolume: real('keg_volume').default(0),
  kegCarbonationMethod: text('keg_carbonation_method').default(''), // priming, forced
  forcedCo2: real('forced_co2').default(0),
  forcedTemp: real('forced_temp').default(0),
  forcedPressure: real('forced_pressure').default(0),
  fermentationTemp: real('fermentation_temp').default(0),
  transferDate: text('transfer_date').default(''),
  lagerDate: text('lager_date').default(''),
  bottlingDate: text('bottling_date').default(''),
  carbonationType: text('carbonation_type').default(''), // forced, priming
  carbonationVolume: real('carbonation_volume').default(0),
  primingSugarType: text('priming_sugar_type').default(''),
  primingSugarAmount: real('priming_sugar_amount').default(0),
  createdAt: text('created_at').default(''),
})

export const brewMeasurements = sqliteTable('brew_measurements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brewId: integer('brew_id')
    .notNull()
    .references(() => brews.id, { onDelete: 'cascade' }),
  datetime: text('datetime').notNull(),
  sg: real('sg').default(0),
  tempS1: real('temp_s1').default(0),
  tempS2: real('temp_s2').default(0),
  co2: real('co2').default(0),
  setTemp: real('set_temp').default(0),
  coolingPower: real('cooling_power').default(0),
  coolingOn: integer('cooling_on', { mode: 'boolean' }).default(false),
  heatingOn: integer('heating_on', { mode: 'boolean' }).default(false),
  seriesTag: text('series_tag').default(''),
  notes: text('notes').default(''),
})

export const brewYeastStarter = sqliteTable('brew_yeast_starter', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brewId: integer('brew_id')
    .notNull()
    .references(() => brews.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull().default(1),
  sourceType: text('source_type').notNull().default('activator'), // activator, slurry, dregs, drypack
  sourceYeastId: integer('source_yeast_id').references(() => yeasts.id),
  sourceVitality: real('source_vitality').default(1.0),
  mode: text('mode').default('simple'), // simple, aerated, stirred
  wortVolume: real('wort_volume').default(0),
  wortSg: real('wort_sg').default(1.04),
  targetCells: real('target_cells').default(0),
  dmeGrams: real('dme_grams').default(0),
  notes: text('notes').default(''),
})

export const brewDivisions = sqliteTable('brew_divisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  parentBrewId: integer('parent_brew_id')
    .notNull()
    .references(() => brews.id, { onDelete: 'cascade' }),
  childBrewId: integer('child_brew_id').references(() => brews.id, { onDelete: 'set null' }),
  splitDate: text('split_date').default(''),
  volume: real('volume').default(0),
  containerType: text('container_type').default(''), // fermenter, secondary, bottle, keg, barrel
  notes: text('notes').default(''),
})

export const neuralNetworks = sqliteTable('neural_networks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  equipmentId: integer('equipment_id').references(() => equipment.id),
  inputParams: text('input_params').notNull().default('[]'),
  outputParams: text('output_params').notNull().default('[]'),
  hiddenLayers: text('hidden_layers').notNull().default('[8]'),
  weights: text('weights').default(''),
  trainedAt: text('trained_at').default(''),
  rounds: integer('rounds').default(0),
  finalError: real('final_error').default(0),
  notes: text('notes').default(''),
})

export const neuralNetworkSamples = sqliteTable('neural_network_samples', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  networkId: integer('network_id')
    .notNull()
    .references(() => neuralNetworks.id, { onDelete: 'cascade' }),
  brewId: integer('brew_id').references(() => brews.id, { onDelete: 'set null' }),
  inputs: text('inputs').notNull().default('[]'),
  outputs: text('outputs').notNull().default('[]'),
  useForTraining: integer('use_for_training', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(''),
})

export const brewChecklist = sqliteTable('brew_checklist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brewId: integer('brew_id')
    .notNull()
    .references(() => brews.id, { onDelete: 'cascade' }),
  itemText: text('item_text').notNull(),
  checked: integer('checked', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
})

// ============================================================
// Settings
// ============================================================

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
