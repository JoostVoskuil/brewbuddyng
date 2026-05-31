<template>
  <article class="print:space-y-4 space-y-6">
    <header class="border-b pb-4">
      <h1 class="text-2xl font-bold">{{ brew.name }}</h1>
      <p class="text-sm text-muted-foreground">{{ $t('brew.print.title') }}</p>
    </header>
    <slot />
  </article>
</template>

<script setup lang="ts">
import type { Brew } from '~/types'

defineProps<{ brew: Brew }>()
</script>
