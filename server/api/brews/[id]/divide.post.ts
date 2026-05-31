import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDB } from '~/server/db'
import { brews, brewDivisions } from '~/server/db/schema'

const divideRequest = z.object({
  children: z.array(z.object({
    name: z.string().min(1),
    fraction: z.number().finite().positive().max(1),
    notes: z.string().optional().default(''),
    additionalIngredients: z.unknown().optional(),
  })).min(2),
})

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'Invalid id' })
  const body = await readValidatedBody(event, (value) => divideRequest.parse(value))
  const total = body.children.reduce((sum, child) => sum + child.fraction, 0)
  if (Math.abs(total - 1) > 0.01) throw createError({ statusCode: 400, message: 'Fractions must add up to 1.00' })

  const db = useDB()
  const parent = await db.select().from(brews).where(eq(brews.id, id)).get()
  if (!parent) throw createError({ statusCode: 404, message: 'Brew not found' })

  const now = new Date().toISOString()
  const baseVolume = (parent.volumeFermenter ?? 0) || (parent.bottleVolume ?? 0) + (parent.kegVolume ?? 0)
  const created = []
  for (const child of body.children) {
    const [brew] = await db.insert(brews).values({
      ...parent,
      id: undefined,
      name: child.name,
      code: parent.code ? `${parent.code}.${created.length + 1}` : '',
      status: parent.status ?? 'planned',
      notes: [child.notes, child.additionalIngredients ? `additionalIngredients=${JSON.stringify(child.additionalIngredients)}` : ''].filter(Boolean).join('\n'),
      volumeFermenter: Number((baseVolume * child.fraction).toFixed(3)),
      bottleVolume: 0,
      kegVolume: 0,
      createdAt: now,
    }).returning()

    await db.insert(brewDivisions).values({
      parentBrewId: id,
      childBrewId: brew.id,
      splitDate: now,
      volume: Number((baseVolume * child.fraction).toFixed(3)),
      containerType: 'fermenter',
      notes: `${Math.round(child.fraction * 100)}%${child.notes ? ` · ${child.notes}` : ''}`,
    })
    created.push(brew)
  }

  return { parentBrewId: id, children: created }
})
