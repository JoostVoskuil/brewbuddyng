<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      ref="menu"
      class="fixed z-50 min-w-48 overflow-hidden rounded-md border bg-background py-1 text-sm shadow-lg"
      :style="positionStyle"
      role="menu"
      tabindex="-1"
      @keydown.esc.prevent="close"
    >
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="block w-full px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        :class="item.destructive ? 'text-destructive' : ''"
        :disabled="item.disabled"
        role="menuitem"
        @click="select(item.key)"
      >
        {{ item.label }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
export interface ContextMenuItem {
  key: string
  label: string
  destructive?: boolean
  disabled?: boolean
}

const props = defineProps<{
  modelValue: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [key: string]
}>()

const menu = ref<HTMLElement | null>(null)

const positionStyle = computed(() => {
  if (!import.meta.client) return { left: `${props.x}px`, top: `${props.y}px` }
  const width = 220
  const height = Math.max(44, props.items.length * 40 + 8)
  return {
    left: `${Math.min(props.x, window.innerWidth - width - 8)}px`,
    top: `${Math.min(props.y, window.innerHeight - height - 8)}px`,
  }
})

function close() {
  emit('update:modelValue', false)
}

function select(key: string) {
  emit('select', key)
  close()
}

function onPointerDown(event: PointerEvent) {
  if (menu.value?.contains(event.target as Node)) return
  close()
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!import.meta.client) return
    if (open) {
      await nextTick()
      menu.value?.focus()
      window.addEventListener('pointerdown', onPointerDown, true)
      window.addEventListener('keydown', onKeyDown)
    } else {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  },
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('pointerdown', onPointerDown, true)
  window.removeEventListener('keydown', onKeyDown)
})
</script>
