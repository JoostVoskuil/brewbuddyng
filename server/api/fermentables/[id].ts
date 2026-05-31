import { fermentables } from '~/server/db/schema'
import { fermentableInsert, fermentableUpdate } from '~/server/utils/validation'

export default defineItemHandler({
  table: fermentables,
  insertSchema: fermentableInsert,
  updateSchema: fermentableUpdate,
  name: 'Fermentable',
})
