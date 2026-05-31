import { ref, computed, onMounted } from 'vue'

/**
 * Generic CRUD logic for the simple "database" management pages
 * (fermentables, hops, yeasts, ...). Handles loading, searching,
 * the add/edit dialog state and create/update/delete requests.
 */
export function useResourceCrud<T extends { id: number; name: string }>(
  endpoint: string,
  createEmptyForm: () => Partial<T>,
  searchFields: (keyof T)[] = ['name'],
) {
  const items = ref<T[]>([])
  const search = ref('')
  const showAdd = ref(false)
  const editingItem = ref<T | null>(null)
  const form = ref<Partial<T>>(createEmptyForm())

  const { t } = useI18n()

  const filtered = computed(() => {
    if (!search.value) return items.value
    const term = search.value.toLowerCase()
    return items.value.filter((item) =>
      searchFields.some((field) => {
        const value = (item as Record<string, unknown>)[field as string]
        return typeof value === 'string' && value.toLowerCase().includes(term)
      }),
    )
  })

  async function loadItems() {
    items.value = await $fetch<T[]>(`/api/${endpoint}`)
  }

  function editItem(item: T) {
    editingItem.value = item
    form.value = { ...item }
  }

  function closeDialog() {
    showAdd.value = false
    editingItem.value = null
    form.value = createEmptyForm()
  }

  async function saveItem() {
    if (editingItem.value) {
      await $fetch(`/api/${endpoint}/${editingItem.value.id}`, {
        method: 'PUT',
        body: form.value,
      })
    } else {
      await $fetch(`/api/${endpoint}`, { method: 'POST', body: form.value })
    }
    closeDialog()
    await loadItems()
  }

  async function deleteItem(id: number) {
    if (confirm(t('common.confirm') + '?')) {
      await $fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
      await loadItems()
    }
  }

  onMounted(loadItems)

  return {
    items,
    search,
    showAdd,
    editingItem,
    form,
    filtered,
    loadItems,
    editItem,
    closeDialog,
    saveItem,
    deleteItem,
  }
}
