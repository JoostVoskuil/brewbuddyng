import { beerStyles } from '~/server/db/schema'
import { beerStyleInsert, beerStyleUpdate } from '~/server/utils/validation'

export default defineCollectionHandler({
  table: beerStyles,
  insertSchema: beerStyleInsert,
  updateSchema: beerStyleUpdate,
  name: 'Style',
})
