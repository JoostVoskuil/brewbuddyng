import { equipment } from '~/server/db/schema'
import { equipmentInsert, equipmentUpdate } from '~/server/utils/validation'

export default defineCollectionHandler({
  table: equipment,
  insertSchema: equipmentInsert,
  updateSchema: equipmentUpdate,
  name: 'Equipment',
})
