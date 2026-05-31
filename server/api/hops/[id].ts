import { hops } from '~/server/db/schema'
import { hopInsert, hopUpdate } from '~/server/utils/validation'

export default defineItemHandler({
  table: hops,
  insertSchema: hopInsert,
  updateSchema: hopUpdate,
  name: 'Hop',
})
