import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import * as schema from '../db/schema'
import { seedStandardData } from '../db/seed'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const dbPath = config.databasePath as string

  // Ensure data directory exists
  const dir = dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  // Create tables if database doesn't exist or is empty
  if (!existsSync(dbPath)) {
    console.log('📦 Creating database at', dbPath)
    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS fermentables (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'Grain',
        yield REAL NOT NULL DEFAULT 0, color REAL NOT NULL DEFAULT 0, add_after_boil INTEGER DEFAULT 0,
        origin TEXT DEFAULT '', supplier TEXT DEFAULT '', coarse_fine_diff REAL DEFAULT 0,
        moisture REAL DEFAULT 0, diastatic_power REAL DEFAULT 0, protein REAL DEFAULT 0,
        max_in_batch REAL DEFAULT 100, recommend_mash INTEGER DEFAULT 1, grain_type TEXT DEFAULT 'Base',
        added TEXT DEFAULT 'Mash', notes TEXT DEFAULT '', substitutes TEXT DEFAULT '', inventory REAL DEFAULT 0,
        cost REAL DEFAULT 0, always_on_stock INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS hops (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, alpha REAL NOT NULL DEFAULT 0,
        beta REAL DEFAULT 0, type TEXT DEFAULT 'Both', form TEXT DEFAULT 'Pellet',
        use TEXT DEFAULT 'Boil', hsi REAL DEFAULT 0, origin TEXT DEFAULT '',
        substitutes TEXT DEFAULT '', cohumulone REAL DEFAULT 0, myrcene REAL DEFAULT 0,
        humulene REAL DEFAULT 0, caryophyllene REAL DEFAULT 0, total_oil REAL DEFAULT 0,
        notes TEXT DEFAULT '', inventory REAL DEFAULT 0, cost REAL DEFAULT 0, always_on_stock INTEGER DEFAULT 0,
        storage_temp REAL DEFAULT 0, storage_method TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS yeasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT DEFAULT 'Ale',
        form TEXT DEFAULT 'Liquid', laboratory TEXT DEFAULT '', product_id TEXT DEFAULT '',
        attenuation REAL DEFAULT 75, min_temperature REAL DEFAULT 15, max_temperature REAL DEFAULT 25,
        flocculation TEXT DEFAULT 'Medium', starter_type TEXT DEFAULT '', notes TEXT DEFAULT '',
        substitutes TEXT DEFAULT '',
        inventory REAL DEFAULT 0, cost REAL DEFAULT 0, always_on_stock INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS miscs (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT DEFAULT 'Spice',
        use TEXT DEFAULT 'Boil', use_for TEXT DEFAULT '', notes TEXT DEFAULT '',
        inventory REAL DEFAULT 0, cost REAL DEFAULT 0, always_on_stock INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS waters (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, calcium REAL DEFAULT 0,
        bicarbonate REAL DEFAULT 0, sulfate REAL DEFAULT 0, chloride REAL DEFAULT 0,
        sodium REAL DEFAULT 0, magnesium REAL DEFAULT 0, ph REAL DEFAULT 7.0,
        total_alkalinity REAL DEFAULT 0, notes TEXT DEFAULT '', is_default INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, boil_size REAL DEFAULT 0,
        batch_size REAL DEFAULT 0, tun_volume REAL DEFAULT 0, tun_weight REAL DEFAULT 0,
        tun_specific_heat REAL DEFAULT 0.12, top_up_water REAL DEFAULT 0, top_up_kettle REAL DEFAULT 0, trub_chiller_loss REAL DEFAULT 0,
        evap_rate REAL DEFAULT 10, boil_time REAL DEFAULT 60, lauter_deadspace REAL DEFAULT 0,
        kettle_volume REAL DEFAULT 0, efficiency REAL DEFAULT 75, hop_utilization REAL DEFAULT 100, notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS beer_styles (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT '',
        category_number TEXT DEFAULT '', style_letter TEXT DEFAULT '', style_guide TEXT DEFAULT 'BJCP',
        type TEXT DEFAULT 'Ale', og_min REAL DEFAULT 1.0, og_max REAL DEFAULT 1.1,
        fg_min REAL DEFAULT 1.0, fg_max REAL DEFAULT 1.03, ibu_min REAL DEFAULT 0,
        ibu_max REAL DEFAULT 100, color_min REAL DEFAULT 0, color_max REAL DEFAULT 40,
        abv_min REAL DEFAULT 0, abv_max REAL DEFAULT 15, carb_min REAL DEFAULT 0, carb_max REAL DEFAULT 4, notes TEXT DEFAULT '', substitutes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS mash_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, grain_temp REAL DEFAULT 20,
        tun_temp REAL DEFAULT 20, sparge_temp REAL DEFAULT 78, notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS mash_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT, mash_profile_id INTEGER NOT NULL REFERENCES mash_profiles(id) ON DELETE CASCADE,
        name TEXT NOT NULL, type TEXT DEFAULT 'Infusion', step_temp REAL NOT NULL DEFAULT 65,
        step_time REAL NOT NULL DEFAULT 60, ramp_time REAL DEFAULT 0, infuse_amount REAL DEFAULT 0, sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT DEFAULT '', type TEXT DEFAULT 'All Grain',
        batch_size REAL DEFAULT 20, boil_size REAL DEFAULT 25, boil_time REAL DEFAULT 60,
        efficiency REAL DEFAULT 75, style_id INTEGER REFERENCES beer_styles(id),
        equipment_id INTEGER REFERENCES equipment(id), mash_profile_id INTEGER REFERENCES mash_profiles(id),
        mash_name TEXT DEFAULT '', grain_temp REAL DEFAULT 20, tun_temp REAL DEFAULT 20,
        sparge_temp REAL DEFAULT 78, mash_ph REAL DEFAULT 0, mash_notes TEXT DEFAULT '',
        og REAL DEFAULT 0, fg REAL DEFAULT 0, ibu REAL DEFAULT 0, color REAL DEFAULT 0, abv REAL DEFAULT 0,
        carbonation REAL DEFAULT 0, notes TEXT DEFAULT '', created_at TEXT DEFAULT '', updated_at TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS recipe_fermentables (
        id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        fermentable_id INTEGER REFERENCES fermentables(id), name TEXT NOT NULL, type TEXT DEFAULT 'Grain',
        amount REAL NOT NULL DEFAULT 0, yield REAL DEFAULT 0, color REAL DEFAULT 0,
        add_after_boil INTEGER DEFAULT 0, grain_type TEXT DEFAULT 'Base', added TEXT DEFAULT 'Mash'
      );
      CREATE TABLE IF NOT EXISTS recipe_hops (
        id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        hop_id INTEGER REFERENCES hops(id), name TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0,
        alpha REAL DEFAULT 0, time REAL DEFAULT 60, use TEXT DEFAULT 'Boil', form TEXT DEFAULT 'Pellet'
      );
      CREATE TABLE IF NOT EXISTS recipe_yeasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        yeast_id INTEGER REFERENCES yeasts(id), name TEXT NOT NULL, amount REAL DEFAULT 0,
        attenuation REAL DEFAULT 75, starter_volume REAL DEFAULT 0, starter_og REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS recipe_miscs (
        id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        misc_id INTEGER REFERENCES miscs(id), name TEXT NOT NULL, type TEXT DEFAULT 'Other', amount REAL DEFAULT 0, time REAL DEFAULT 0, use TEXT DEFAULT 'Boil'
      );
      CREATE TABLE IF NOT EXISTS recipe_waters (
        id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        water_id INTEGER REFERENCES waters(id), name TEXT NOT NULL, amount REAL DEFAULT 0,
        calcium REAL DEFAULT 0, bicarbonate REAL DEFAULT 0, sulfate REAL DEFAULT 0,
        chloride REAL DEFAULT 0, sodium REAL DEFAULT 0, magnesium REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS recipe_mash_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        name TEXT NOT NULL, type TEXT DEFAULT 'Infusion', step_temp REAL NOT NULL DEFAULT 65,
        step_time REAL NOT NULL DEFAULT 60, ramp_time REAL DEFAULT 0, infuse_amount REAL DEFAULT 0, sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS brews (
        id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER REFERENCES recipes(id),
        name TEXT NOT NULL, code TEXT DEFAULT '', brew_date TEXT DEFAULT '', status TEXT DEFAULT 'planned',
        og_actual REAL DEFAULT 0, fg_actual REAL DEFAULT 0, efficiency_actual REAL DEFAULT 0,
        notes TEXT DEFAULT '', brewer TEXT DEFAULT '', assistant_brewer TEXT DEFAULT '',
        taste_notes TEXT DEFAULT '', taste_rating REAL DEFAULT 0,
        taste_appearance TEXT DEFAULT '', taste_aroma TEXT DEFAULT '', taste_flavor TEXT DEFAULT '',
        taste_mouthfeel TEXT DEFAULT '', taste_aftertaste TEXT DEFAULT '', taste_overall TEXT DEFAULT '',
        storage_temp REAL DEFAULT 0, start_time TEXT DEFAULT '', end_time TEXT DEFAULT '',
        volume_fermenter REAL DEFAULT 0, water_added_fermenter REAL DEFAULT 0,
        bottle_volume REAL DEFAULT 0, keg_volume REAL DEFAULT 0, keg_carbonation_method TEXT DEFAULT '',
        forced_co2 REAL DEFAULT 0, forced_temp REAL DEFAULT 0, forced_pressure REAL DEFAULT 0,
        fermentation_temp REAL DEFAULT 0, transfer_date TEXT DEFAULT '', lager_date TEXT DEFAULT '',
        bottling_date TEXT DEFAULT '', carbonation_type TEXT DEFAULT '', carbonation_volume REAL DEFAULT 0,
        priming_sugar_type TEXT DEFAULT '', priming_sugar_amount REAL DEFAULT 0, created_at TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS brew_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT, brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
        datetime TEXT NOT NULL, sg REAL DEFAULT 0, temp_s1 REAL DEFAULT 0,
        temp_s2 REAL DEFAULT 0, co2 REAL DEFAULT 0, set_temp REAL DEFAULT 0,
        cooling_power REAL DEFAULT 0, cooling_on INTEGER DEFAULT 0, heating_on INTEGER DEFAULT 0,
        series_tag TEXT DEFAULT '', notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS brew_yeast_starter (
        id INTEGER PRIMARY KEY AUTOINCREMENT, brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL DEFAULT 1, source_type TEXT NOT NULL DEFAULT 'activator',
        source_yeast_id INTEGER REFERENCES yeasts(id), source_vitality REAL DEFAULT 1.0,
        mode TEXT DEFAULT 'simple', wort_volume REAL DEFAULT 0, wort_sg REAL DEFAULT 1.040,
        target_cells REAL DEFAULT 0, dme_grams REAL DEFAULT 0, notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS brew_divisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, parent_brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
        child_brew_id INTEGER REFERENCES brews(id) ON DELETE SET NULL, split_date TEXT DEFAULT '',
        volume REAL DEFAULT 0, container_type TEXT DEFAULT '', notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS neural_networks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        equipment_id INTEGER REFERENCES equipment(id), input_params TEXT NOT NULL DEFAULT '[]',
        output_params TEXT NOT NULL DEFAULT '[]', hidden_layers TEXT NOT NULL DEFAULT '[8]',
        weights TEXT DEFAULT '', trained_at TEXT DEFAULT '', rounds INTEGER DEFAULT 0,
        final_error REAL DEFAULT 0, notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS neural_network_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT, network_id INTEGER NOT NULL REFERENCES neural_networks(id) ON DELETE CASCADE,
        brew_id INTEGER REFERENCES brews(id) ON DELETE SET NULL, inputs TEXT NOT NULL DEFAULT '[]',
        outputs TEXT NOT NULL DEFAULT '[]', use_for_training INTEGER DEFAULT 1, created_at TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS brew_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT, brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
        item_text TEXT NOT NULL, checked INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `)

    // Insert default settings
    const insertSetting = sqlite.prepare(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    )
    insertSetting.run('ibuMethod', 'tinseth')
    insertSetting.run('colorMethod', 'morey')
    insertSetting.run('temperatureUnit', 'celsius')
    insertSetting.run('gravityUnit', 'sg')
    insertSetting.run('colorUnit', 'ebc')
    insertSetting.run('defaultBatchSize', '20')
    insertSetting.run('defaultBoilTime', '60')
    insertSetting.run('defaultEfficiency', '75')
    // Phase 1 — list display & hop-aging defaults.
    insertSetting.run('hopStorageTempDefault', '20')
    insertSetting.run('hopStorageMethodDefault', 'foil')
    insertSetting.run('showStockIndicator', 'true')
    insertSetting.run('showRecipeCode', 'true')
    insertSetting.run('showBrewCode', 'true')
    insertSetting.run('parentBrewIdRequired', 'false')
    insertSetting.run('nnDefaultRounds', '500')
    insertSetting.run('nnDefaultLearningRate', '0.1')
    insertSetting.run('nnDefaultErrorStop', '0.001')
    insertSetting.run('themeFontFamily', 'Inter')
    insertSetting.run('themeFontSize', '14')
    insertSetting.run('themeAccentColor', '#16a34a')
    insertSetting.run('themeMode', 'system')

    // Seed the standard reference data (ingredient databases, styles, mash
    // profiles) so a freshly-created database is ready to use immediately.
    try {
      const db = drizzle(sqlite, { schema })
      console.log('🌱 Seeding standard data...')
      const counts = await seedStandardData(db)
      console.log(
        '✅ Seeded:',
        Object.entries(counts)
          .map(([table, count]) => `${table}=${count}`)
          .join(', '),
      )
    } catch (error) {
      console.error('⚠️  Seeding standard data failed:', error)
    }

    sqlite.close()
    console.log('✅ Database created successfully')
  }

  // Apply idempotent migrations to existing databases (created before a
  // feature was added). Safe to run on every startup.
  const migrate = new Database(dbPath)
  try {
    migrate.pragma('foreign_keys = ON')
    ensureEmbeddedMashSchema(migrate)
    ensureEquipmentSchema(migrate)
    ensureBrewSchema(migrate)
    ensureSubstitutesSchema(migrate)
    ensureRecipeMiscSchema(migrate)
    ensurePhase1Schema(migrate)
    ensureBrewWorkflowSchema(migrate)
    ensureNeuralNetworkSchema(migrate)
  } finally {
    migrate.close()
  }
})

/**
 * Phase 1 schema additions (BrouwHulp parity foundation):
 *   - recipes.code, brews.code  — free-form volgnummer
 *   - waters.is_default          — Standaard water flag
 *   - hops.storage_temp / hops.storage_method — per-hop hop-aging overrides
 * Idempotent. New `settings` keys are seeded on insert (only).
 */
function ensurePhase1Schema(sqlite: Database.Database) {
  const addColumn = (table: string, name: string, def: string) => {
    const cols = new Set(
      (sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
        (c) => c.name,
      ),
    )
    if (!cols.has(name)) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`)
    }
  }
  addColumn('recipes', 'code', `TEXT DEFAULT ''`)
  addColumn('brews', 'code', `TEXT DEFAULT ''`)
  addColumn('waters', 'is_default', `INTEGER DEFAULT 0`)
  addColumn('hops', 'storage_temp', `REAL DEFAULT 0`)
  addColumn('hops', 'storage_method', `TEXT DEFAULT ''`)

  // Seed Phase 1 default settings (only if absent — never overwrite).
  const seed = sqlite.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
  // Hop-aging defaults (used when a hop has no per-record override).
  seed.run('hopStorageTempDefault', '20') // °C
  seed.run('hopStorageMethodDefault', 'foil') // freezer|fridge|room|vacuum|foil
  // List-display toggles.
  seed.run('showStockIndicator', 'true')
  seed.run('showRecipeCode', 'true')
  seed.run('showBrewCode', 'true')
  seed.run('themeFontFamily', 'Inter')
  seed.run('themeFontSize', '14')
  seed.run('themeAccentColor', '#16a34a')
  seed.run('themeMode', 'system')
}

/**
 * Phase 5 brew-workflow schema additions for brew timing, packaging, TControl
 * measurements, yeast propagation and split/division metadata. Idempotent.
 */
function ensureBrewWorkflowSchema(sqlite: Database.Database) {
  const addColumn = (table: string, name: string, def: string) => {
    const cols = new Set(
      (sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
        (c) => c.name,
      ),
    )
    if (!cols.has(name)) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`)
    }
  }

  const brewColumns: Record<string, string> = {
    start_time: `TEXT DEFAULT ''`,
    end_time: `TEXT DEFAULT ''`,
    volume_fermenter: `REAL DEFAULT 0`,
    water_added_fermenter: `REAL DEFAULT 0`,
    bottle_volume: `REAL DEFAULT 0`,
    keg_volume: `REAL DEFAULT 0`,
    keg_carbonation_method: `TEXT DEFAULT ''`,
    forced_co2: `REAL DEFAULT 0`,
    forced_temp: `REAL DEFAULT 0`,
    forced_pressure: `REAL DEFAULT 0`,
    fermentation_temp: `REAL DEFAULT 0`,
    transfer_date: `TEXT DEFAULT ''`,
    lager_date: `TEXT DEFAULT ''`,
  }
  for (const [name, def] of Object.entries(brewColumns)) {
    addColumn('brews', name, def)
  }

  const measurementColumns: Record<string, string> = {
    set_temp: `REAL DEFAULT 0`,
    cooling_power: `REAL DEFAULT 0`,
    cooling_on: `INTEGER DEFAULT 0`,
    heating_on: `INTEGER DEFAULT 0`,
    series_tag: `TEXT DEFAULT ''`,
  }
  for (const [name, def] of Object.entries(measurementColumns)) {
    addColumn('brew_measurements', name, def)
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS brew_yeast_starter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL DEFAULT 1,
      source_type TEXT NOT NULL DEFAULT 'activator',
      source_yeast_id INTEGER REFERENCES yeasts(id),
      source_vitality REAL DEFAULT 1.0,
      mode TEXT DEFAULT 'simple',
      wort_volume REAL DEFAULT 0,
      wort_sg REAL DEFAULT 1.040,
      target_cells REAL DEFAULT 0,
      dme_grams REAL DEFAULT 0,
      notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS brew_divisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
      child_brew_id INTEGER REFERENCES brews(id) ON DELETE SET NULL,
      split_date TEXT DEFAULT '',
      volume REAL DEFAULT 0,
      container_type TEXT DEFAULT '',
      notes TEXT DEFAULT ''
    );
  `)

  const seed = sqlite.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
  seed.run('parentBrewIdRequired', 'false')
}

/**
 * Phase 8 neural-network schema additions. Networks are scoped optionally to
 * equipment and samples can point back to source brews. Idempotent.
 */
function ensureNeuralNetworkSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS neural_networks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      equipment_id INTEGER REFERENCES equipment(id),
      input_params TEXT NOT NULL DEFAULT '[]',
      output_params TEXT NOT NULL DEFAULT '[]',
      hidden_layers TEXT NOT NULL DEFAULT '[8]',
      weights TEXT DEFAULT '',
      trained_at TEXT DEFAULT '',
      rounds INTEGER DEFAULT 0,
      final_error REAL DEFAULT 0,
      notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS neural_network_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      network_id INTEGER NOT NULL REFERENCES neural_networks(id) ON DELETE CASCADE,
      brew_id INTEGER REFERENCES brews(id) ON DELETE SET NULL,
      inputs TEXT NOT NULL DEFAULT '[]',
      outputs TEXT NOT NULL DEFAULT '[]',
      use_for_training INTEGER DEFAULT 1,
      created_at TEXT DEFAULT ''
    );
  `)

  const seed = sqlite.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
  seed.run('nnDefaultRounds', '500')
  seed.run('nnDefaultLearningRate', '0.1')
  seed.run('nnDefaultErrorStop', '0.001')
}

/**
 * Ensure the recipe_miscs table has the BeerXML `type` column (Spice, Herb,
 * Flavor, Fining, Water Agent, Nutrient, Other). Adds it to databases created
 * before the column existed. Idempotent.
 */
function ensureRecipeMiscSchema(sqlite: Database.Database) {
  const existing = new Set(
    (sqlite.prepare(`PRAGMA table_info(recipe_miscs)`).all() as { name: string }[]).map(
      (c) => c.name,
    ),
  )
  if (!existing.has('type')) {
    sqlite.exec(`ALTER TABLE recipe_miscs ADD COLUMN type TEXT DEFAULT 'Other'`)
  }
}

/**
 * Ensure the fermentables, yeasts and beer_styles tables have a `substitutes`
 * column (hops already have one), so the user can record suggested ingredient
 * substitutions. Mirrors BrouwHulp's FermentableSubs / YeastSubs / StyleSubs.
 * Idempotent.
 */
function ensureSubstitutesSchema(sqlite: Database.Database) {
  const tables = ['fermentables', 'yeasts', 'beer_styles']
  for (const table of tables) {
    const existing = new Set(
      (sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
        (c) => c.name,
      ),
    )
    if (!existing.has('substitutes')) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN substitutes TEXT DEFAULT ''`)
    }
  }
}

/**
 * Ensure the brews table has the brewer and structured tasting-note columns
 * (BrouwHulp proefnotities). Adds them to databases created before the columns
 * existed. Idempotent.
 */
function ensureBrewSchema(sqlite: Database.Database) {
  const existing = new Set(
    (sqlite.prepare(`PRAGMA table_info(brews)`).all() as { name: string }[]).map((c) => c.name),
  )
  const columns: Record<string, string> = {
    brewer: `TEXT DEFAULT ''`,
    assistant_brewer: `TEXT DEFAULT ''`,
    taste_appearance: `TEXT DEFAULT ''`,
    taste_aroma: `TEXT DEFAULT ''`,
    taste_flavor: `TEXT DEFAULT ''`,
    taste_mouthfeel: `TEXT DEFAULT ''`,
    taste_aftertaste: `TEXT DEFAULT ''`,
    taste_overall: `TEXT DEFAULT ''`,
    storage_temp: `REAL DEFAULT 0`,
  }
  for (const [name, def] of Object.entries(columns)) {
    if (!existing.has(name)) {
      sqlite.exec(`ALTER TABLE brews ADD COLUMN ${name} ${def}`)
    }
  }
}

/**
 * Ensure the equipment table has the BeerXML `top_up_kettle` column (extra water
 * added at the start of the boil). Adds it to databases created before the
 * column existed. Idempotent.
 */
function ensureEquipmentSchema(sqlite: Database.Database) {
  const existing = new Set(
    (sqlite.prepare(`PRAGMA table_info(equipment)`).all() as { name: string }[]).map((c) => c.name),
  )
  if (!existing.has('top_up_kettle')) {
    sqlite.exec(`ALTER TABLE equipment ADD COLUMN top_up_kettle REAL DEFAULT 0`)
  }
}

/**
 * Ensure the embedded per-recipe mash schema (BeerXML MASH / MASH_STEPS) is
 * present. Adds the `recipe_mash_steps` table and the mash header columns on
 * `recipes` if they are missing. Idempotent.
 */
function ensureEmbeddedMashSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS recipe_mash_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      name TEXT NOT NULL, type TEXT DEFAULT 'Infusion', step_temp REAL NOT NULL DEFAULT 65,
      step_time REAL NOT NULL DEFAULT 60, ramp_time REAL DEFAULT 0, infuse_amount REAL DEFAULT 0, sort_order INTEGER DEFAULT 0
    );
  `)

  const existing = new Set(
    (sqlite.prepare(`PRAGMA table_info(recipes)`).all() as { name: string }[]).map((c) => c.name),
  )
  const columns: Record<string, string> = {
    mash_name: `TEXT DEFAULT ''`,
    grain_temp: `REAL DEFAULT 20`,
    tun_temp: `REAL DEFAULT 20`,
    sparge_temp: `REAL DEFAULT 78`,
    mash_ph: `REAL DEFAULT 0`,
    mash_notes: `TEXT DEFAULT ''`,
  }
  for (const [name, def] of Object.entries(columns)) {
    if (!existing.has(name)) {
      sqlite.exec(`ALTER TABLE recipes ADD COLUMN ${name} ${def}`)
    }
  }
}
