import { yeasts } from '~/server/db/schema'
import { yeastInsert, yeastUpdate } from '~/server/utils/validation'

export default defineCollectionHandler({
  table: yeasts,
  insertSchema: yeastInsert,
  updateSchema: yeastUpdate,
  name: 'Yeast',
})
