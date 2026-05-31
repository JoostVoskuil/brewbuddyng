<template>
  <div class="hidden print:flex items-center justify-between border-b pb-4 mb-4 break-after-avoid">
    <div>
      <div class="text-xl font-bold">{{ breweryName }}</div>
      <div class="text-sm text-muted-foreground">{{ title }}</div>
      <div class="text-xs text-muted-foreground">{{ generatedAt }}</div>
    </div>
    <img
      v-if="breweryLogo"
      :src="breweryLogo"
      :alt="breweryName"
      class="max-h-16 max-w-32 object-contain"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  breweryName: string
  breweryLogo: string
  title: string
  generatedAt: string
}>()
</script>
