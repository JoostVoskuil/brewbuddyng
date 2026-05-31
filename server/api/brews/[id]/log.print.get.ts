import { eq } from 'drizzle-orm'
import { useDB } from '~/server/db'
import {
  brews,
  recipes,
  brewMeasurements,
  brewChecklist,
  brewDivisions,
  brewYeastStarter,
  settings,
} from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid id' })
  const db = useDB()
  const brew = await db.select().from(brews).where(eq(brews.id, id)).get()
  if (!brew) throw createError({ statusCode: 404, message: 'Brew not found' })
  const [recipe, measurements, checklist, divisions, starters, settingRows] = await Promise.all([
    brew.recipeId
      ? db.select().from(recipes).where(eq(recipes.id, brew.recipeId)).get()
      : Promise.resolve(undefined),
    db.select().from(brewMeasurements).where(eq(brewMeasurements.brewId, id)).all(),
    db.select().from(brewChecklist).where(eq(brewChecklist.brewId, id)).all(),
    db.select().from(brewDivisions).where(eq(brewDivisions.parentBrewId, id)).all(),
    db.select().from(brewYeastStarter).where(eq(brewYeastStarter.brewId, id)).all(),
    db.select().from(settings).all(),
  ])
  const opts = Object.fromEntries(settingRows.map((row) => [row.key, row.value]))
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(brew.name)} brewlog</title><style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:2rem;color:#111}.header{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid #ddd;padding-bottom:1rem}img{max-height:80px;max-width:180px}h1,h2{margin:.2rem 0}table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{border-bottom:1px solid #ddd;padding:.35rem;text-align:left;font-size:.9rem}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem}.card{border:1px solid #ddd;border-radius:8px;padding:.75rem}@media print{body{margin:0}.no-print{display:none}.card{break-inside:avoid}a{color:inherit}}
</style></head><body><a class="no-print" href="/brews/${brew.id}">← Back</a><div class="header"><div><p>${esc(opts.breweryName || 'BrewBuddyNG')}</p><h1>${esc(brew.name)}</h1><p>${esc(brew.code || '')} ${esc(brew.brewDate || '')}</p></div>${opts.breweryLogo ? `<img src="${esc(opts.breweryLogo)}" alt="${esc(opts.breweryName || '')}">` : ''}</div>
<h2>Recipe summary</h2><div class="grid"><div class="card">Recipe<br><strong>${esc(recipe?.name || '—')}</strong></div><div class="card">OG / FG<br><strong>${num(recipe?.og)} / ${num(recipe?.fg)}</strong></div><div class="card">IBU / EBC<br><strong>${num(recipe?.ibu)} / ${num(recipe?.color)}</strong></div><div class="card">Batch<br><strong>${num(recipe?.batchSize)} L</strong></div></div>
<h2>Brewday timeline</h2><table><tr><th>Event</th><th>Time</th></tr>${row('Brew date', brew.brewDate)}${row('Mash start', brew.startTime)}${row('Boil start', brew.endTime)}${row('Fermentation start', brew.transferDate)}${row('Packaging', brew.bottlingDate)}</table>
<h2>Checklist</h2><table><tr><th>Done</th><th>Item</th></tr>${checklist.map((i) => `<tr><td>${i.checked ? '✓' : '—'}</td><td>${esc(i.itemText)}</td></tr>`).join('')}</table>
<h2>Measurements</h2><table><tr><th>Date</th><th>SG</th><th>T1</th><th>T2</th><th>pH / cells / notes</th></tr>${measurements.map((m) => `<tr><td>${esc(fmt(m.datetime))}</td><td>${num(m.sg)}</td><td>${num(m.tempS1)}</td><td>${num(m.tempS2)}</td><td>${esc(m.notes || '')}</td></tr>`).join('')}</table>
<h2>Fermentation</h2><div class="grid"><div class="card">Temp<br><strong>${num(brew.fermentationTemp)} °C</strong></div><div class="card">Volume<br><strong>${num(brew.volumeFermenter)} L</strong></div><div class="card">Actual OG/FG<br><strong>${num(brew.ogActual)} / ${num(brew.fgActual)}</strong></div><div class="card">ABV<br><strong>${brew.ogActual && brew.fgActual ? ((brew.ogActual - brew.fgActual) * 131.25).toFixed(1) : '—'}%</strong></div></div>
<h3>Yeast starter</h3><table><tr><th>#</th><th>Mode</th><th>Volume</th><th>SG</th><th>DME</th></tr>${starters.map((s) => `<tr><td>${s.stepNumber}</td><td>${esc(s.mode || '')}</td><td>${num(s.wortVolume)} L</td><td>${num(s.wortSg)}</td><td>${num(s.dmeGrams)} g</td></tr>`).join('')}</table>
<h2>Packaging</h2><div class="grid"><div class="card">Packaged<br><strong>${esc(fmt(brew.bottlingDate))}</strong></div><div class="card">Bottle / keg<br><strong>${num(brew.bottleVolume)} / ${num(brew.kegVolume)} L</strong></div><div class="card">CO₂<br><strong>${num(brew.carbonationVolume)} vol</strong></div><div class="card">Sugar / pressure<br><strong>${num(brew.primingSugarAmount)} g / ${num(brew.forcedPressure)} bar</strong></div></div>
<h2>Divisions</h2><table><tr><th>Date</th><th>Child</th><th>Volume</th><th>Notes</th></tr>${divisions.map((d) => `<tr><td>${esc(fmt(d.splitDate))}</td><td>${d.childBrewId ?? '—'}</td><td>${num(d.volume)} L</td><td>${esc(d.notes || '')}</td></tr>`).join('')}</table>
<h2>Tasting notes</h2><p>${esc(brew.tasteNotes || brew.notes || '—')}</p><div class="grid"><div class="card">Aroma ${esc(brew.tasteAroma || '—')}</div><div class="card">Appearance ${esc(brew.tasteAppearance || '—')}</div><div class="card">Flavour ${esc(brew.tasteFlavor || '—')}</div><div class="card">Mouthfeel ${esc(brew.tasteMouthfeel || '—')}</div><div class="card">Overall ${esc(brew.tasteOverall || '—')}</div></div></body></html>`
})
function esc(v: unknown) {
  return String(v ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  )
}
function num(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) && v !== 0
    ? v.toFixed(v < 10 ? 3 : 1).replace(/\.0+$/, '')
    : '—'
}
function fmt(v: string | null | undefined) {
  return v ? new Date(v).toLocaleString() : '—'
}
function row(name: string, value: string | null | undefined) {
  return `<tr><td>${esc(name)}</td><td>${esc(fmt(value))}</td></tr>`
}
