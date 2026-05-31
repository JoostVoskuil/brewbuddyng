import { equipment } from '~/server/db/schema'
import { equipmentInsert, equipmentUpdate } from '~/server/utils/validation'

export default defineItemHandler({
  table: equipment,
  insertSchema: equipmentInsert,
  updateSchema: equipmentUpdate,
  name: 'Equipment',
})
