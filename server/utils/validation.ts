import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  fermentables,
  hops,
  yeasts,
  miscs,
  waters,
  equipment,
  beerStyles,
  recipes,
  recipeFermentables,
  recipeHops,
  recipeYeasts,
  recipeMiscs,
  recipeWaters,
  recipeMashSteps,
  brews,
  brewMeasurements,
  brewYeastStarter,
  brewDivisions,
  neuralNetworks,
  neuralNetworkSamples,
  brewChecklist,
  mashProfiles,
  mashSteps,
} from '~/server/db/schema'

/**
 * Validation schemas derived from the Drizzle tables.
 *
 * `createInsertSchema` produces a Zod object where required (notNull, no
 * default) columns are required and everything else is optional. Parsing with
 * these schemas also strips unknown keys (e.g. a client-supplied `id`), so the
 * data reaching the database is always well-formed.
 */
export const fermentableInsert = createInsertSchema(fermentables)
export const fermentableUpdate = fermentableInsert.partial()

export const hopInsert = createInsertSchema(hops)
export const hopUpdate = hopInsert.partial()

export const yeastInsert = createInsertSchema(yeasts)
export const yeastUpdate = yeastInsert.partial()

export const miscInsert = createInsertSchema(miscs)
export const miscUpdate = miscInsert.partial()

export const waterInsert = createInsertSchema(waters)
export const waterUpdate = waterInsert.partial()

const saltAdditionSchema = z.object({
  cacl2: z.number().finite().min(0).default(0),
  caso4: z.number().finite().min(0).default(0),
  mgso4: z.number().finite().min(0).default(0),
  nacl: z.number().finite().min(0).default(0),
  nahco3: z.number().finite().min(0).default(0),
  caco3: z.number().finite().min(0).default(0),
})

const waterProfileSchema = z.object({
  calcium: z.number().finite().min(0).default(0),
  magnesium: z.number().finite().min(0).default(0),
  sodium: z.number().finite().min(0).default(0),
  chloride: z.number().finite().min(0).default(0),
  sulfate: z.number().finite().min(0).default(0),
  bicarbonate: z.number().finite().min(0).default(0),
  ph: z.number().finite().min(0).max(14).default(7),
})

export const recipeWaterTreatmentUpsert = z.object({
  sourceWaterId: z.number().int().positive().nullable().optional(),
  targetWaterId: z.number().int().positive().nullable().optional(),
  sourceProfile: waterProfileSchema.optional(),
  targetProfile: waterProfileSchema.optional(),
  mashVolumeL: z.number().finite().min(0).default(0),
  spargeVolumeL: z.number().finite().min(0).default(0),
  mashAdditions: saltAdditionSchema.default({
    cacl2: 0,
    caso4: 0,
    mgso4: 0,
    nacl: 0,
    nahco3: 0,
    caco3: 0,
  }),
  spargeAdditions: saltAdditionSchema.default({
    cacl2: 0,
    caso4: 0,
    mgso4: 0,
    nacl: 0,
    nahco3: 0,
    caco3: 0,
  }),
  acids: z
    .object({
      lactic88Ml: z.number().finite().min(0).default(0),
      phosphoric75Ml: z.number().finite().min(0).default(0),
      acidMaltPercent: z.number().finite().min(0).max(20).default(0),
      targetMashPh: z.number().finite().min(3.5).max(7).default(5.4),
    })
    .default({ lactic88Ml: 0, phosphoric75Ml: 0, acidMaltPercent: 0, targetMashPh: 5.4 }),
})

const waterSuggestionGristSchema = z.object({
  amountKg: z.number().finite().min(0),
  colorEbc: z.number().finite().min(0),
  grainType: z.string().optional(),
  added: z.string().optional(),
})

export const waterSuggestionMatchProfile = z.object({
  sourceWaterId: z.number().int().positive(),
  targetProfileId: z.number().int().positive(),
  mashVolumeL: z.number().finite().positive(),
  spargeVolumeL: z.number().finite().min(0).default(0),
  gristEbcDistribution: waterSuggestionGristSchema.array().optional(),
})

export const waterSuggestionMatchStyle = waterSuggestionMatchProfile
  .omit({ targetProfileId: true })
  .extend({
    styleId: z.number().int().positive(),
  })

export const equipmentInsert = createInsertSchema(equipment)
export const equipmentUpdate = equipmentInsert.partial()

export const beerStyleInsert = createInsertSchema(beerStyles)
export const beerStyleUpdate = beerStyleInsert.partial()

// --- Recipes -------------------------------------------------------------

// Child rows are validated without the server-controlled `id`/`recipeId`.
const recipeFermentableInput = createInsertSchema(recipeFermentables).omit({
  id: true,
  recipeId: true,
})
const recipeHopInput = createInsertSchema(recipeHops).omit({ id: true, recipeId: true })
const recipeYeastInput = createInsertSchema(recipeYeasts).omit({ id: true, recipeId: true })
const recipeMiscInput = createInsertSchema(recipeMiscs).omit({ id: true, recipeId: true })
const recipeWaterInput = createInsertSchema(recipeWaters).omit({ id: true, recipeId: true })
const recipeMashStepInput = createInsertSchema(recipeMashSteps).omit({ id: true, recipeId: true })

const recipeBase = createInsertSchema(recipes).omit({ id: true, createdAt: true, updatedAt: true })

export const recipeCreate = recipeBase
export const recipeUpdate = recipeBase.partial().extend({
  fermentables: recipeFermentableInput.array().optional(),
  hops: recipeHopInput.array().optional(),
  yeasts: recipeYeastInput.array().optional(),
  miscs: recipeMiscInput.array().optional(),
  waters: recipeWaterInput.array().optional(),
  mashSteps: recipeMashStepInput.array().optional(),
})

// --- Mash profiles -------------------------------------------------------

// Child steps are validated without the server-controlled `id`/`mashProfileId`.
const mashStepInput = createInsertSchema(mashSteps).omit({ id: true, mashProfileId: true })

const mashProfileBase = createInsertSchema(mashProfiles).omit({ id: true })

export const mashProfileCreate = mashProfileBase.extend({
  steps: mashStepInput.array().optional(),
})
export const mashProfileUpdate = mashProfileBase.partial().extend({
  steps: mashStepInput.array().optional(),
})

// --- Brews ---------------------------------------------------------------

export const brewCreate = createInsertSchema(brews).omit({ id: true, createdAt: true })
export const brewUpdate = brewCreate.partial()

export const brewMeasurementCreate = createInsertSchema(brewMeasurements).omit({
  id: true,
  brewId: true,
})

export const brewYeastStarterCreate = createInsertSchema(brewYeastStarter).omit({ id: true })
export const brewYeastStarterUpdate = brewYeastStarterCreate.partial()

export const brewDivisionCreate = createInsertSchema(brewDivisions).omit({ id: true })
export const brewDivisionUpdate = brewDivisionCreate.partial()

const numberVector = z.array(z.number().finite())
const positiveInt = z.number().int().positive()

const neuralNetworkBase = createInsertSchema(neuralNetworks)
  .omit({ id: true, weights: true, trainedAt: true, rounds: true, finalError: true })
  .extend({
    inputSize: positiveInt.optional(),
    outputSize: positiveInt.optional(),
    inputParams: z.array(z.string().min(1)).optional(),
    outputParams: z.array(z.string().min(1)).optional(),
    hiddenLayers: z.array(positiveInt).min(1).optional(),
    activation: z.enum(['sigmoid', 'tanh', 'relu', 'elliot']).optional(),
  })

export const neuralNetworkCreate = neuralNetworkBase.superRefine((value, ctx) => {
  const inputSize = value.inputSize ?? value.inputParams?.length
  const outputSize = value.outputSize ?? value.outputParams?.length
  if (!inputSize)
    ctx.addIssue({ code: 'custom', path: ['inputSize'], message: 'inputSize is required' })
  if (!outputSize)
    ctx.addIssue({ code: 'custom', path: ['outputSize'], message: 'outputSize is required' })
  if (value.inputParams && inputSize !== value.inputParams.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['inputParams'],
      message: 'inputParams length must match inputSize',
    })
  }
  if (value.outputParams && outputSize !== value.outputParams.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['outputParams'],
      message: 'outputParams length must match outputSize',
    })
  }
})
export const neuralNetworkUpdate = neuralNetworkBase.partial()

export const neuralNetworkSampleCreate = createInsertSchema(neuralNetworkSamples).omit({
  id: true,
  networkId: true,
  createdAt: true,
})
export const neuralNetworkSampleUpdate = neuralNetworkSampleCreate.partial()

export const neuralNetworkSamplesAdd = z.object({
  samples: z
    .array(
      z.object({
        inputs: numberVector,
        outputs: numberVector,
        weight: z.number().finite().positive().optional(),
        brewId: z.number().int().positive().nullable().optional(),
        useForTraining: z.boolean().optional(),
      }),
    )
    .min(1),
})
export const neuralNetworkTrainRequest = z.object({
  maxEpochs: z.number().int().positive().max(100000).default(5000),
  targetRmse: z.number().finite().positive().default(0.01),
  learningRate: z.number().finite().positive().default(0.7),
  momentum: z.number().finite().min(0).max(1).default(0.1),
  seed: z.number().int().optional(),
  collectHistory: z.boolean().optional(),
})
export const neuralNetworkPredictRequest = z.object({
  inputs: numberVector,
})

export const brewChecklistItemInput = createInsertSchema(brewChecklist).omit({
  id: true,
  brewId: true,
})
