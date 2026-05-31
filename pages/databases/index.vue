<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('databases.title') }}</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink
        v-for="db in databases"
        :key="db.to"
        :to="db.to"
        class="border rounded-lg p-5 hover:bg-accent transition-colors"
      >
        <h2 class="font-semibold mb-1">{{ $t(db.label) }}</h2>
        <p class="text-sm text-muted-foreground">{{ db.count }} {{ $t('common.items') }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const databases = ref([
  { to: '/databases/fermentables', label: 'databases.fermentables', count: 0 },
  { to: '/databases/hops', label: 'databases.hops', count: 0 },
  { to: '/databases/yeasts', label: 'databases.yeasts', count: 0 },
  { to: '/databases/miscs', label: 'databases.miscs', count: 0 },
  { to: '/databases/waters', label: 'databases.waters', count: 0 },
  { to: '/databases/equipment', label: 'databases.equipment', count: 0 },
  { to: '/databases/styles', label: 'databases.styles', count: 0 },
  { to: '/databases/mash-profiles', label: 'databases.mashProfiles', count: 0 },
])

onMounted(async () => {
  const endpoints = [
    'fermentables',
    'hops',
    'yeasts',
    'miscs',
    'waters',
    'equipment',
    'styles',
    'mashes',
  ]
  for (let i = 0; i < endpoints.length; i++) {
    try {
      const data = await $fetch<unknown[]>(`/api/${endpoints[i]}`)
      databases.value[i]!.count = data.length
    } catch {
      databases.value[i]!.count = 0
    }
  }
})
</script>
