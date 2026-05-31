import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { XMLParser } from 'fast-xml-parser'

const DB_PATH = process.env.DATABASE_PATH || './data/brewbuddy.db'

/**
 * Resolve the directory that holds the seed XML files. The same logic must work
 * for three contexts: the standalone seed script (cwd = project root), the dev
 * server (cwd = project root) and the production Docker image (cwd = /app, with
 * the seed folder copied to /app/seed). Filesystem lookups are preferred over
 * `import.meta.dirname`, which points at the bundled chunk in the Nitro output.
 */
function resolveSeedDir(): string {
  if (process.env.SEED_DIR) return resolve(process.env.SEED_DIR)
  const cwdSeed = resolve(process.cwd(), 'seed')
  if (existsSync(cwdSeed)) return cwdSeed
  return resolve(import.meta.dirname || process.cwd(), '../../seed')
}

const SEED_DIR = resolveSeedDir()

/** Drizzle database instance bound to the better-sqlite3 connection. */
export type SeedDatabase = ReturnType<typeof getDB>

function getDB() {
  const dir = dirname(DB_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

function parseXML(filePath: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) {
    console.warn(`Seed file not found: ${filePath}`)
    return null
  }
  const content = readFileSync(filePath, 'utf-8')
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => {
      return [
        'FERMENTABLE',
        'HOP',
        'YEAST',
        'MISC',
        'WATER',
        'EQUIPMENT',
        'STYLE',
        'MASH',
        'MASH_STEP',
        'RECIPE',
      ].includes(name)
    },
  })
  return parser.parse(content)
}

function toBool(val: unknown): boolean {
  if (typeof val === 'string') return val.toUpperCase() === 'TRUE'
  return Boolean(val)
}

function toNum(val: unknown, fallback = 0): number {
  const n = parseFloat(String(val))
  return isNaN(n) ? fallback : n
}

function toStr(val: unknown, fallback = ''): string {
  if (val === undefined || val === null) return fallback
  return String(val)
}

async function seedFermentables(db: ReturnType<typeof getDB>) {
  const data = parseXML(resolve(SEED_DIR, 'fermentables.xml'))
  if (!data?.FERMENTABLES?.FERMENTABLE) return 0
  const items = data.FERMENTABLES.FERMENTABLE
  for (const item of items) {
    await db.insert(schema.fermentables).values({
      name: toStr(item.NAME, 'Unknown'),
      type: toStr(item.TYPE, 'Grain'),
      yield: toNum(item.YIELD),
      color: toNum(item.COLOR),
      addAfterBoil: toBool(item.ADD_AFTER_BOIL),
      origin: toStr(item.ORIGIN),
      supplier: toStr(item.SUPPLIER),
      coarseFineDiff: toNum(item.COARSE_FINE_DIFF),
      moisture: toNum(item.MOISTURE),
      diastaticPower: toNum(item.DIASTATIC_POWER),
      protein: toNum(item.PROTEIN),
      maxInBatch: toNum(item.MAX_IN_BATCH, 100),
      recommendMash: toBool(item.RECOMMEND_MASH),
      grainType: toStr(item.GRAINTYPE, 'Base'),
      added: toStr(item.ADDED, 'Mash'),
      notes: toStr(item.NOTES),
    })
  }
  return items.length
}

async function seedHops(db: ReturnType<typeof getDB>) {
  const data = parseXML(resolve(SEED_DIR, 'hops.xml'))
  if (!data?.HOPS?.HOP) return 0
  const items = data.HOPS.HOP
  for (const item of items) {
    await db.insert(schema.hops).values({
      name: toStr(item.NAME, 'Unknown'),
      alpha: toNum(item.ALPHA),
      beta: toNum(item.BETA),
      type: toStr(item.TYPE, 'Both'),
      form: toStr(item.FORM, 'Pellet'),
      use: toStr(item.USE, 'Boil'),
      hsi: toNum(item.HSI),
      origin: toStr(item.ORIGIN),
      substitutes: toStr(item.SUBSTITUTES),
      cohumulone: toNum(item.COHUMULONE),
      myrcene: toNum(item.MYRCENE),
      humulene: toNum(item.HUMULENE),
      caryophyllene: toNum(item.CAROPHYLLENE || item.CARYOPHYLLENE),
      totalOil: toNum(item.TOTAL_OIL),
      notes: toStr(item.NOTES),
    })
  }
  return items.length
}

async function seedYeasts(db: ReturnType<typeof getDB>, file = 'yeasts.xml') {
  const data = parseXML(resolve(SEED_DIR, file))
  if (!data?.YEASTS?.YEAST) return 0
  const items = data.YEASTS.YEAST
  for (const item of items) {
    await db.insert(schema.yeasts).values({
      name: toStr(item.NAME, 'Unknown'),
      type: toStr(item.TYPE, 'Ale'),
      form: toStr(item.FORM, 'Liquid'),
      laboratory: toStr(item.LABORATORY),
      productId: toStr(item.PRODUCT_ID),
      attenuation: toNum(item.ATTENUATION, 75),
      minTemperature: toNum(item.MIN_TEMPERATURE, 15),
      maxTemperature: toNum(item.MAX_TEMPERATURE, 25),
      flocculation: toStr(item.FLOCCULATION, 'Medium'),
      notes: toStr(item.NOTES),
    })
  }
  return items.length
}

async function seedMiscs(db: ReturnType<typeof getDB>) {
  const data = parseXML(resolve(SEED_DIR, 'miscs.xml'))
  if (!data?.MISCS?.MISC) return 0
  const items = data.MISCS.MISC
  for (const item of items) {
    await db.insert(schema.miscs).values({
      name: toStr(item.NAME, 'Unknown'),
      type: toStr(item.TYPE, 'Spice'),
      use: toStr(item.USE, 'Boil'),
      useFor: toStr(item.USE_FOR),
      notes: toStr(item.NOTES),
    })
  }
  return items.length
}

async function seedWaters(db: ReturnType<typeof getDB>) {
  const data = parseXML(resolve(SEED_DIR, 'waters.xml'))
  if (!data?.WATERS?.WATER) return 0
  const items = data.WATERS.WATER
  for (const item of items) {
    await db.insert(schema.waters).values({
      name: toStr(item.NAME, 'Unknown'),
      calcium: toNum(item.CALCIUM),
      bicarbonate: toNum(item.BICARBONATE),
      sulfate: toNum(item.SULFATE),
      chloride: toNum(item.CHLORIDE),
      sodium: toNum(item.SODIUM),
      magnesium: toNum(item.MAGNESIUM),
      ph: toNum(item.PH, 7.0),
      totalAlkalinity: toNum(item.TOTAL_ALKALINITY),
      notes: toStr(item.NOTES),
    })
  }
  return items.length
}

async function seedEquipment(db: ReturnType<typeof getDB>) {
  const data = parseXML(resolve(SEED_DIR, 'equipments.xml'))
  if (!data?.EQUIPMENTS?.EQUIPMENT) return 0
  const items = data.EQUIPMENTS.EQUIPMENT
  for (const item of items) {
    await db.insert(schema.equipment).values({
      name: toStr(item.NAME, 'Unknown'),
      boilSize: toNum(item.BOIL_SIZE),
      batchSize: toNum(item.BATCH_SIZE),
      tunVolume: toNum(item.TUN_VOLUME),
      tunWeight: toNum(item.TUN_WEIGHT),
      tunSpecificHeat: toNum(item.TUN_SPECIFIC_HEAT, 0.12),
      topUpWater: toNum(item.TOP_UP_WATER),
      trubChillerLoss: toNum(item.TRUB_CHILLER_LOSS),
      evapRate: toNum(item.EVAP_RATE, 10),
      boilTime: toNum(item.BOIL_TIME, 60),
      lauterDeadspace: toNum(item.LAUTER_DEADSPACE),
      kettleVolume: toNum(item.KETTLE_VOLUME),
      efficiency: toNum(item.EFFICIENCY, 75),
      hopUtilization: toNum(item.HOP_UTILIZATION, 100),
      notes: toStr(item.NOTES),
    })
  }
  return items.length
}

async function seedStyles(
  db: ReturnType<typeof getDB>,
  file = 'styles-BJCP.xml',
  defaultGuide = 'BJCP',
) {
  const data = parseXML(resolve(SEED_DIR, file))
  if (!data?.STYLES?.STYLE) return 0
  const items = data.STYLES.STYLE
  for (const item of items) {
    await db.insert(schema.beerStyles).values({
      name: toStr(item.NAME, 'Unknown'),
      category: toStr(item.CATEGORY),
      categoryNumber: toStr(item.CATEGORY_NUMBER),
      styleLetter: toStr(item.STYLE_LETTER),
      styleGuide: toStr(item.STYLE_GUIDE, defaultGuide),
      type: toStr(item.TYPE, 'Ale'),
      ogMin: toNum(item.OG_MIN, 1.0),
      ogMax: toNum(item.OG_MAX, 1.1),
      fgMin: toNum(item.FG_MIN, 1.0),
      fgMax: toNum(item.FG_MAX, 1.03),
      ibuMin: toNum(item.IBU_MIN),
      ibuMax: toNum(item.IBU_MAX, 100),
      colorMin: toNum(item.COLOR_MIN),
      colorMax: toNum(item.COLOR_MAX, 40),
      abvMin: toNum(item.ABV_MIN),
      abvMax: toNum(item.ABV_MAX, 15),
      carbMin: toNum(item.CARB_MIN),
      carbMax: toNum(item.CARB_MAX, 4),
      notes: toStr(item.NOTES),
    })
  }
  return items.length
}

async function seedMashProfiles(db: ReturnType<typeof getDB>) {
  const data = parseXML(resolve(SEED_DIR, 'mashs.xml'))
  if (!data?.MASHS?.MASH) return 0
  const items = data.MASHS.MASH
  for (const item of items) {
    const result = await db
      .insert(schema.mashProfiles)
      .values({
        name: toStr(item.NAME, 'Unknown'),
        grainTemp: toNum(item.GRAIN_TEMP, 20),
        tunTemp: toNum(item.TUN_TEMP, 20),
        spargeTemp: toNum(item.SPARGE_TEMP, 78),
        notes: toStr(item.NOTES),
      })
      .returning()

    const profileId = result[0].id
    const steps = item.MASH_STEPS?.MASH_STEP || item.MASH_STEP || []
    const stepArray = Array.isArray(steps) ? steps : [steps]
    for (let i = 0; i < stepArray.length; i++) {
      const step = stepArray[i]
      if (!step || !step.NAME) continue
      await db.insert(schema.mashSteps).values({
        mashProfileId: profileId,
        name: toStr(step.NAME),
        type: toStr(step.TYPE, 'Infusion'),
        stepTemp: toNum(step.STEP_TEMP, 65),
        stepTime: toNum(step.STEP_TIME, 60),
        rampTime: toNum(step.RAMP_TIME),
        infuseAmount: toNum(step.INFUSE_AMOUNT),
        sortOrder: i,
      })
    }
  }
  return items.length
}

async function seedDefaultSettings(db: ReturnType<typeof getDB>) {
  const defaults: Record<string, string> = {
    ibuMethod: 'tinseth',
    colorMethod: 'morey',
    temperatureUnit: 'celsius',
    gravityUnit: 'sg',
    colorUnit: 'ebc',
    defaultBatchSize: '20',
    defaultBoilTime: '60',
    defaultEfficiency: '75',
  }
  for (const [key, value] of Object.entries(defaults)) {
    await db.insert(schema.settings).values({ key, value }).onConflictDoNothing()
  }
}

async function main() {
  console.log('🌱 Starting database seed...')
  console.log(`   Database: ${DB_PATH}`)
  console.log(`   Seed data: ${SEED_DIR}`)

  const db = getDB()

  // Create tables
  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // Create all tables from schema (simple approach: execute CREATE TABLE IF NOT EXISTS)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fermentables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Grain',
      yield REAL NOT NULL DEFAULT 0,
      color REAL NOT NULL DEFAULT 0,
      add_after_boil INTEGER DEFAULT 0,
      origin TEXT DEFAULT '',
      supplier TEXT DEFAULT '',
      coarse_fine_diff REAL DEFAULT 0,
      moisture REAL DEFAULT 0,
      diastatic_power REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      max_in_batch REAL DEFAULT 100,
      recommend_mash INTEGER DEFAULT 1,
      grain_type TEXT DEFAULT 'Base',
      added TEXT DEFAULT 'Mash',
      notes TEXT DEFAULT '',
      inventory REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      always_on_stock INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      alpha REAL NOT NULL DEFAULT 0,
      beta REAL DEFAULT 0,
      type TEXT DEFAULT 'Both',
      form TEXT DEFAULT 'Pellet',
      use TEXT DEFAULT 'Boil',
      hsi REAL DEFAULT 0,
      origin TEXT DEFAULT '',
      substitutes TEXT DEFAULT '',
      cohumulone REAL DEFAULT 0,
      myrcene REAL DEFAULT 0,
      humulene REAL DEFAULT 0,
      caryophyllene REAL DEFAULT 0,
      total_oil REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      inventory REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      always_on_stock INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS yeasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Ale',
      form TEXT DEFAULT 'Liquid',
      laboratory TEXT DEFAULT '',
      product_id TEXT DEFAULT '',
      attenuation REAL DEFAULT 75,
      min_temperature REAL DEFAULT 15,
      max_temperature REAL DEFAULT 25,
      flocculation TEXT DEFAULT 'Medium',
      starter_type TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      inventory REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      always_on_stock INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS miscs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Spice',
      use TEXT DEFAULT 'Boil',
      use_for TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      inventory REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      always_on_stock INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS waters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      calcium REAL DEFAULT 0,
      bicarbonate REAL DEFAULT 0,
      sulfate REAL DEFAULT 0,
      chloride REAL DEFAULT 0,
      sodium REAL DEFAULT 0,
      magnesium REAL DEFAULT 0,
      ph REAL DEFAULT 7.0,
      total_alkalinity REAL DEFAULT 0,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      boil_size REAL DEFAULT 0,
      batch_size REAL DEFAULT 0,
      tun_volume REAL DEFAULT 0,
      tun_weight REAL DEFAULT 0,
      tun_specific_heat REAL DEFAULT 0.12,
      top_up_water REAL DEFAULT 0,
      trub_chiller_loss REAL DEFAULT 0,
      evap_rate REAL DEFAULT 10,
      boil_time REAL DEFAULT 60,
      lauter_deadspace REAL DEFAULT 0,
      kettle_volume REAL DEFAULT 0,
      efficiency REAL DEFAULT 75,
      hop_utilization REAL DEFAULT 100,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS beer_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      category_number TEXT DEFAULT '',
      style_letter TEXT DEFAULT '',
      style_guide TEXT DEFAULT 'BJCP',
      type TEXT DEFAULT 'Ale',
      og_min REAL DEFAULT 1.0,
      og_max REAL DEFAULT 1.1,
      fg_min REAL DEFAULT 1.0,
      fg_max REAL DEFAULT 1.03,
      ibu_min REAL DEFAULT 0,
      ibu_max REAL DEFAULT 100,
      color_min REAL DEFAULT 0,
      color_max REAL DEFAULT 40,
      abv_min REAL DEFAULT 0,
      abv_max REAL DEFAULT 15,
      carb_min REAL DEFAULT 0,
      carb_max REAL DEFAULT 4,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS mash_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grain_temp REAL DEFAULT 20,
      tun_temp REAL DEFAULT 20,
      sparge_temp REAL DEFAULT 78,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS mash_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mash_profile_id INTEGER NOT NULL REFERENCES mash_profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Infusion',
      step_temp REAL NOT NULL DEFAULT 65,
      step_time REAL NOT NULL DEFAULT 60,
      ramp_time REAL DEFAULT 0,
      infuse_amount REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'All Grain',
      batch_size REAL DEFAULT 20,
      boil_size REAL DEFAULT 25,
      boil_time REAL DEFAULT 60,
      efficiency REAL DEFAULT 75,
      style_id INTEGER REFERENCES beer_styles(id),
      equipment_id INTEGER REFERENCES equipment(id),
      mash_profile_id INTEGER REFERENCES mash_profiles(id),
      og REAL DEFAULT 0,
      fg REAL DEFAULT 0,
      ibu REAL DEFAULT 0,
      color REAL DEFAULT 0,
      abv REAL DEFAULT 0,
      carbonation REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT '',
      updated_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS recipe_fermentables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      fermentable_id INTEGER REFERENCES fermentables(id),
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Grain',
      amount REAL NOT NULL DEFAULT 0,
      yield REAL DEFAULT 0,
      color REAL DEFAULT 0,
      add_after_boil INTEGER DEFAULT 0,
      grain_type TEXT DEFAULT 'Base',
      added TEXT DEFAULT 'Mash'
    );

    CREATE TABLE IF NOT EXISTS recipe_hops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      hop_id INTEGER REFERENCES hops(id),
      name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      alpha REAL DEFAULT 0,
      time REAL DEFAULT 60,
      use TEXT DEFAULT 'Boil',
      form TEXT DEFAULT 'Pellet'
    );

    CREATE TABLE IF NOT EXISTS recipe_yeasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      yeast_id INTEGER REFERENCES yeasts(id),
      name TEXT NOT NULL,
      amount REAL DEFAULT 0,
      attenuation REAL DEFAULT 75,
      starter_volume REAL DEFAULT 0,
      starter_og REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS recipe_miscs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      misc_id INTEGER REFERENCES miscs(id),
      name TEXT NOT NULL,
      amount REAL DEFAULT 0,
      time REAL DEFAULT 0,
      use TEXT DEFAULT 'Boil'
    );

    CREATE TABLE IF NOT EXISTS recipe_waters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      water_id INTEGER REFERENCES waters(id),
      name TEXT NOT NULL,
      amount REAL DEFAULT 0,
      calcium REAL DEFAULT 0,
      bicarbonate REAL DEFAULT 0,
      sulfate REAL DEFAULT 0,
      chloride REAL DEFAULT 0,
      sodium REAL DEFAULT 0,
      magnesium REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS brews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER REFERENCES recipes(id),
      name TEXT NOT NULL,
      brew_date TEXT DEFAULT '',
      status TEXT DEFAULT 'planned',
      og_actual REAL DEFAULT 0,
      fg_actual REAL DEFAULT 0,
      efficiency_actual REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      taste_notes TEXT DEFAULT '',
      taste_rating REAL DEFAULT 0,
      bottling_date TEXT DEFAULT '',
      carbonation_type TEXT DEFAULT '',
      carbonation_volume REAL DEFAULT 0,
      priming_sugar_type TEXT DEFAULT '',
      priming_sugar_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS brew_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
      datetime TEXT NOT NULL,
      sg REAL DEFAULT 0,
      temp_s1 REAL DEFAULT 0,
      temp_s2 REAL DEFAULT 0,
      co2 REAL DEFAULT 0,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS brew_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
      item_text TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
  sqlite.close()

  // Seed data
  const counts = await seedStandardData(db)

  console.log('\n✅ Seed complete!')
  for (const [table, count] of Object.entries(counts)) {
    console.log(`   ${table}: ${count} records`)
  }
}

/**
 * Seed the standard reference data (ingredient databases, beer styles, mash
 * profiles and default settings) into an already-created database. Reusable by
 * both the standalone seed script and the Nitro database plugin so that a
 * freshly-created database is automatically populated on first start.
 */
export async function seedStandardData(db: SeedDatabase): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  counts.fermentables = await seedFermentables(db)
  counts.hops = await seedHops(db)
  counts.yeasts = await seedYeasts(db)
  counts.yeasts += await seedYeasts(db, 'White Labs.xml')
  counts.miscs = await seedMiscs(db)
  counts.waters = await seedWaters(db)
  counts.equipment = await seedEquipment(db)
  counts.styles = await seedStyles(db)
  counts.styles += await seedStyles(db, 'styles.xml', 'BrewBuddy')
  counts.mashProfiles = await seedMashProfiles(db)
  await seedDefaultSettings(db)
  return counts
}

/** Only run the standalone seeding routine when executed directly (not on import). */
function isDirectRun(): boolean {
  try {
    return !!process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
