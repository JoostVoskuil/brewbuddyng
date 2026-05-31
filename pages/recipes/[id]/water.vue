<template>
  <WaterTreatment :recipe-id="recipeId" />
</template>

<script setup lang="ts">
const route = useRoute()
const recipeId = computed(() => Number(route.params.id))
</script>
