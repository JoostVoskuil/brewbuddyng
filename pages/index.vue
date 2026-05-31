<template>
  <div>
    <h1 class="text-3xl font-bold mb-2">{{ $t('home.title') }}</h1>
    <p class="text-muted-foreground mb-8">{{ $t('home.description') }}</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="border rounded-lg p-6 hover:bg-accent transition-colors"
      >
        <h2 class="font-semibold text-lg mb-1">{{ $t(card.title) }}</h2>
        <p class="text-sm text-muted-foreground">{{ $t(card.description) }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const cards = [
  { to: '/recipes', title: 'home.cards.recipes', description: 'home.cards.recipesDesc' },
  { to: '/brews', title: 'home.cards.brews', description: 'home.cards.brewsDesc' },
  { to: '/databases', title: 'home.cards.databases', description: 'home.cards.databasesDesc' },
  { to: '/tools', title: 'home.cards.tools', description: 'home.cards.toolsDesc' },
  { to: '/analysis', title: 'home.cards.analysis', description: 'home.cards.analysisDesc' },
  { to: '/settings', title: 'home.cards.settings', description: 'home.cards.settingsDesc' },
]
</script>
