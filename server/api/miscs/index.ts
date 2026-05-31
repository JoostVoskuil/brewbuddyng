import { miscs } from '~/server/db/schema'
import { miscInsert, miscUpdate } from '~/server/utils/validation'

export default defineCollectionHandler({
  table: miscs,
  insertSchema: miscInsert,
  updateSchema: miscUpdate,
  name: 'Misc',
})
