<template>
  <aside class="w-48 shrink-0">
    <div class="sticky top-6 rounded-lg border bg-background p-3 shadow-sm">
      <button
        type="button"
        class="mb-2 flex w-full items-center justify-between text-left text-sm font-semibold"
        @click="toggle"
      >
        <span>{{ $t('recipe.toolbar.title') }}</span>
        <span>{{ collapsed ? '▸' : '▾' }}</span>
      </button>
      <div v-if="!collapsed" class="space-y-2">
        <button
          v-for="wizard in wizards"
          :key="wizard.event"
          type="button"
          class="w-full rounded border px-3 py-2 text-left text-sm hover:bg-muted"
          @click="emitWizard(wizard.event)"
        >
          {{ $t(wizard.label) }}
        </button>
        <button
          type="button"
          class="w-full rounded border px-3 py-2 text-left text-sm hover:bg-muted"
          @click="emit('neural')"
        >
          {{ $t('recipe.toolbar.neural.button') }}
        </button>
        <slot name="neural" />
        <div class="border-t pt-2">
          <NuxtLink
            v-for="tool in tools"
            :key="tool.to"
            :to="tool.to"
            class="mb-1 block rounded border px-3 py-2 text-sm hover:bg-muted"
          >
            {{ $t(tool.label) }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const emit = defineEmits<{ hop: []; mout: []; water: []; neural: [] }>()
void emit

const collapsed = ref(false)
const wizards = [
  { event: 'hop' as const, label: 'recipe.toolbar.hopWizard' },
  { event: 'mout' as const, label: 'recipe.toolbar.moutWizard' },
  { event: 'water' as const, label: 'recipe.toolbar.waterWizard' },
]
const tools = [
  { to: '/tools/cm-volume', label: 'tools.cmVolume.title' },
  { to: '/tools/yeast-starter-multi', label: 'tools.yeastStarterMulti.title' },
  { to: '/tools/refractometer', label: 'tools.refractometer' },
  { to: '/tools/hop-calculator', label: 'tools.hopCalculator' },
  { to: '/tools/mash-ph', label: 'tools.mashPh' },
]

onMounted(() => {
  collapsed.value = localStorage.getItem('recipe-toolbar-collapsed') === 'true'
})

function emitWizard(event: 'hop' | 'mout' | 'water') {
  if (event === 'hop') emit('hop')
  else if (event === 'mout') emit('mout')
  else emit('water')
}

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('recipe-toolbar-collapsed', String(collapsed.value))
}
</script>
