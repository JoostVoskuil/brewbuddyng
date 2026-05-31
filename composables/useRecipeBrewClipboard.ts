import type {
  BrewListItem,
  NewBrew,
  NewRecipe,
  RecipeListItem,
  RecipeWithIngredients,
} from '~/types'

type RecipeChildKey = 'fermentables' | 'hops' | 'yeasts' | 'miscs' | 'waters' | 'mashSteps'
const childKeys: RecipeChildKey[] = [
  'fermentables',
  'hops',
  'yeasts',
  'miscs',
  'waters',
  'mashSteps',
]

function stripServerFields<T extends Record<string, unknown>>(row: T) {
  const { id: _id, recipeId: _recipeId, ...rest } = row
  return rest
}

function recipeBody(recipe: RecipeListItem | RecipeWithIngredients, name = recipe.name): NewRecipe {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    searchText: _searchText,
    stockState: _stockState,
    fermentables: _fermentables,
    hops: _hops,
    yeasts: _yeasts,
    miscs: _miscs,
    waters: _waters,
    mashSteps: _mashSteps,
    ...body
  } = recipe as RecipeWithIngredients & RecipeListItem
  return { ...body, name } as NewRecipe
}

function brewBody(brew: BrewListItem, name = brew.name): NewBrew {
  const {
    id: _id,
    createdAt: _createdAt,
    searchText: _searchText,
    stockState: _stockState,
    ...body
  } = brew
  return { ...body, name } as NewBrew
}

export function useRecipeBrewClipboard() {
  async function copyRecipeToBrew(recipe: RecipeListItem) {
    return await $fetch<{ id: number }>('/api/brews', {
      method: 'POST',
      body: {
        name: recipe.name,
        recipeId: recipe.id,
        brewDate: new Date().toISOString().slice(0, 10),
        status: 'planned',
        ogActual: recipe.og ?? 0,
        fgActual: recipe.fg ?? 0,
        efficiencyActual: recipe.efficiency ?? 0,
        notes: recipe.notes ?? '',
      } satisfies NewBrew,
    })
  }

  async function copyBrewToRecipe(brew: BrewListItem) {
    return await $fetch<{ id: number; name: string }>(`/api/brews/${brew.id}/copy-to-recipe`, {
      method: 'POST',
    })
  }

  async function duplicateRecipe(recipe: RecipeListItem) {
    const full = await $fetch<RecipeWithIngredients>(`/api/recipes/${recipe.id}`)
    const created = await $fetch<{ id: number }>('/api/recipes', {
      method: 'POST',
      body: recipeBody(full, `${full.name} copy`),
    })

    const children = Object.fromEntries(
      childKeys.map((key) => [key, full[key].map((row) => stripServerFields(row))]),
    )
    await $fetch(`/api/recipes/${created.id}`, { method: 'PUT', body: children })
    return created
  }

  async function duplicateBrew(brew: BrewListItem) {
    return await $fetch<{ id: number }>('/api/brews', {
      method: 'POST',
      body: brewBody(brew, `${brew.name} copy`),
    })
  }

  return { copyRecipeToBrew, copyBrewToRecipe, duplicateRecipe, duplicateBrew }
}
