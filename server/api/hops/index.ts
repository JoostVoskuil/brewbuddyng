import { hops } from '~/server/db/schema'
import { hopInsert, hopUpdate } from '~/server/utils/validation'

export default defineCollectionHandler({
  table: hops,
  insertSchema: hopInsert,
  updateSchema: hopUpdate,
  name: 'Hop',
})
