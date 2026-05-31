/**
 * Shared domain types for BrewBuddyNG.
 *
 * These are inferred directly from the Drizzle schema so that the client and
 * server always agree on the shape of every entity. Import from `~/types` in
 * pages/components and from `~/server/db/schema` types on the server.
 */
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type * as schema from '~/server/db/schema'

export type Fermentable = InferSelectModel<typeof schema.fermentables>
export type NewFermentable = InferInsertModel<typeof schema.fermentables>

export type Hop = InferSelectModel<typeof schema.hops>
export type NewHop = InferInsertModel<typeof schema.hops>

export type Yeast = InferSelectModel<typeof schema.yeasts>
export type NewYeast = InferInsertModel<typeof schema.yeasts>

export type Misc = InferSelectModel<typeof schema.miscs>
export type NewMisc = InferInsertModel<typeof schema.miscs>

export type Water = InferSelectModel<typeof schema.waters>
export type NewWater = InferInsertModel<typeof schema.waters>

export type Equipment = InferSelectModel<typeof schema.equipment>
export type NewEquipment = InferInsertModel<typeof schema.equipment>

export type BeerStyle = InferSelectModel<typeof schema.beerStyles>
export type NewBeerStyle = InferInsertModel<typeof schema.beerStyles>

export type MashProfile = InferSelectModel<typeof schema.mashProfiles>
export type MashStep = InferSelectModel<typeof schema.mashSteps>

export type Recipe = InferSelectModel<typeof schema.recipes>
export type NewRecipe = InferInsertModel<typeof schema.recipes>
/** Stock-state badge value for recipe / brew list rows (BrouwHulp parity). */
export type StockState = 'green' | 'yellow' | 'red' | 'unknown'
/** Recipe list row including a precomputed searchable text of ingredient names. */
export interface RecipeListItem extends Recipe {
  searchText: string
  stockState: StockState
}
export type RecipeFermentable = InferSelectModel<typeof schema.recipeFermentables>
export type RecipeHop = InferSelectModel<typeof schema.recipeHops>
export type RecipeYeast = InferSelectModel<typeof schema.recipeYeasts>
export type RecipeMisc = InferSelectModel<typeof schema.recipeMiscs>
export type RecipeWater = InferSelectModel<typeof schema.recipeWaters>
export type RecipeMashStep = InferSelectModel<typeof schema.recipeMashSteps>

/** A recipe together with all of its ingredient lists. */
export interface RecipeWithIngredients extends Recipe {
  fermentables: RecipeFermentable[]
  hops: RecipeHop[]
  yeasts: RecipeYeast[]
  miscs: RecipeMisc[]
  waters: RecipeWater[]
  mashSteps: RecipeMashStep[]
}

export type Brew = InferSelectModel<typeof schema.brews>
export type NewBrew = InferInsertModel<typeof schema.brews>
/** Brew list row including a precomputed searchable text of ingredient names. */
export interface BrewListItem extends Brew {
  searchText: string
  stockState: StockState
}
export type BrewMeasurement = InferSelectModel<typeof schema.brewMeasurements>
export type NewBrewMeasurement = InferInsertModel<typeof schema.brewMeasurements>
export type BrewYeastStarter = InferSelectModel<typeof schema.brewYeastStarter>
export type NewBrewYeastStarter = InferInsertModel<typeof schema.brewYeastStarter>
export type BrewDivision = InferSelectModel<typeof schema.brewDivisions>
export type NewBrewDivision = InferInsertModel<typeof schema.brewDivisions>
export type NeuralNetwork = InferSelectModel<typeof schema.neuralNetworks>
export type NewNeuralNetwork = InferInsertModel<typeof schema.neuralNetworks>
export type NeuralNetworkSample = InferSelectModel<typeof schema.neuralNetworkSamples>
export type NewNeuralNetworkSample = InferInsertModel<typeof schema.neuralNetworkSamples>
export type BrewChecklistItem = InferSelectModel<typeof schema.brewChecklist>
export type NewBrewChecklistItem = InferInsertModel<typeof schema.brewChecklist>

/** A brew together with its measurements and checklist. */
export interface BrewWithDetails extends Brew {
  measurements: BrewMeasurement[]
  checklist: BrewChecklistItem[]
  yeastStarter: BrewYeastStarter[]
  divisions: BrewDivision[]
  /** The linked recipe's mash steps, for the brew-day workflow. */
  mashSteps: RecipeMashStep[]
  /** The linked recipe's boil time in minutes, for the brew-day boil timer. */
  boilTime: number
}
