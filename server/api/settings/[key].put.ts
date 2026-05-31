import { eq } from 'drizzle-orm'
import { useDB } from '~/server/db'
import { settings } from '~/server/db/schema'

const MAX_LOGO_BYTES = 200 * 1024

function validateSettingValue(key: string, value: string) {
  if (key !== 'breweryLogo' || value === '') return
  const match = value.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    throw createError({ statusCode: 400, message: 'Brewery logo must be a base64 PNG or JPEG data URL' })
  }
  const bytes = Buffer.from(match[2] ?? '', 'base64').byteLength
  if (bytes > MAX_LOGO_BYTES) {
    throw createError({ statusCode: 400, message: 'Brewery logo must be 200 KB or smaller' })
  }
}

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  if (!key) throw createError({ statusCode: 400, message: 'Missing setting key' })

  const body = await readBody<{ value?: unknown }>(event)
  const value = String(body?.value ?? '')
  validateSettingValue(key, value)

  const db = useDB()
  const [row] = await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .returning()

  return row ?? (await db.select().from(settings).where(eq(settings.key, key)).get())
})
