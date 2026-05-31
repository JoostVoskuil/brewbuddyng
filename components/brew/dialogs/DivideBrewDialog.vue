<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div class="bg-background border rounded-lg shadow-xl w-full max-w-3xl p-4 space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold">{{ $t('brew.divide.title') }}</h3>
        <button class="text-sm" @click="$emit('close')">×</button>
      </div>
      <p class="text-sm text-muted-foreground">{{ $t('brew.divide.help') }}</p>
      <div class="space-y-2">
        <div v-for="(child, index) in children" :key="index" class="grid grid-cols-1 md:grid-cols-[1fr_7rem_1fr_auto] gap-2">
          <input v-model="child.name" class="px-3 py-2 border rounded-md bg-background" :placeholder="$t('recipe.name')" />
          <input v-model.number="child.fraction" type="number" min="0" max="1" step="0.01" class="px-3 py-2 border rounded-md bg-background" />
          <input v-model="child.notes" class="px-3 py-2 border rounded-md bg-background" :placeholder="$t('common.notes')" />
          <button type="button" class="px-3 py-2 border rounded-md" @click="children.splice(index, 1)">−</button>
        </div>
      </div>
      <div class="text-sm" :class="Math.abs(total - 1) < 0.001 ? 'text-green-700' : 'text-destructive'">
        {{ $t('brew.divide.total') }}: {{ (total * 100).toFixed(0) }}%
      </div>
      <div class="flex justify-between gap-2">
        <button type="button" class="px-3 py-2 border rounded-md text-sm" @click="add">{{ $t('common.add') }}</button>
        <button type="button" class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50" :disabled="saving || Math.abs(total - 1) > 0.01" @click="divide">
          {{ saving ? $t('common.loading') : $t('brew.divide.button') }}
        </button>
      </div>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ brewId: number; brewName: string }>()
const emit = defineEmits<{ close: []; divided: [] }>()
const saving = ref(false)
const error = ref('')
const children = ref([
  { name: `${props.brewName} A`, fraction: 0.5, notes: '' },
  { name: `${props.brewName} B`, fraction: 0.5, notes: '' },
])
const total = computed(() => children.value.reduce((sum, row) => sum + (Number(row.fraction) || 0), 0))
function add() {
  children.value.push({ name: `${props.brewName} ${children.value.length + 1}`, fraction: 0, notes: '' })
}
async function divide() {
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/brews/${props.brewId}/divide`, { method: 'POST', body: { children: children.value } })
    emit('divided')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Divide failed'
  } finally {
    saving.value = false
  }
}
</script>
