<template>
  <section class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="border rounded-lg p-4 space-y-3"><h3 class="font-semibold">{{ $t('brew.notes.freeText') }}</h3><textarea v-model="form.notes" rows="16" class="w-full px-3 py-2 border rounded-md bg-background" /></div>
      <div class="border rounded-lg p-4 space-y-3"><h3 class="font-semibold">{{ $t('brew.notes.tasting') }}</h3><label class="text-sm block">{{ $t('brew.notes.tasteNotes') }}<textarea v-model="form.tasteNotes" rows="4" class="w-full mt-1 px-3 py-2 border rounded-md bg-background" /></label><label class="text-sm block">{{ $t('brew.notes.rating') }}<input v-model.number="form.tasteRating" type="range" min="1" max="5" step="1" class="w-full mt-1" /><span class="font-mono">{{ form.tasteRating }}</span></label><div v-for="field in fields" :key="field.key"><label class="text-sm block">{{ $t(field.label) }}<input v-model="form[field.key]" type="range" min="1" max="5" step="1" class="w-full mt-1" /><span class="font-mono">{{ form[field.key] || 1 }}</span></label></div></div>
    </div>
    <button type="button" class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm" @click="save">{{ $t('common.save') }}</button>
  </section>
</template>
<script setup lang="ts">
import type { Brew, RecipeWithIngredients } from '~/types'
const props = defineProps<{ brew: Brew; recipe?: RecipeWithIngredients | null }>()
const emit = defineEmits<{ save: [patch: Partial<Brew>] }>()
const fields = [{ key:'tasteAppearance', label:'brew.tasteAppearance' },{ key:'tasteAroma', label:'brew.tasteAroma' },{ key:'tasteFlavor', label:'brew.tasteFlavor' },{ key:'tasteMouthfeel', label:'brew.tasteMouthfeel' },{ key:'tasteAftertaste', label:'brew.tasteAftertaste' },{ key:'tasteOverall', label:'brew.tasteOverall' }] as const
const form = reactive<Record<string, string | number | undefined>>({ notes: props.brew.notes || props.recipe?.notes || '', tasteNotes: props.brew.tasteNotes ?? '', tasteRating: props.brew.tasteRating || 3, tasteAppearance: props.brew.tasteAppearance || '3', tasteAroma: props.brew.tasteAroma || '3', tasteFlavor: props.brew.tasteFlavor || '3', tasteMouthfeel: props.brew.tasteMouthfeel || '3', tasteAftertaste: props.brew.tasteAftertaste || '3', tasteOverall: props.brew.tasteOverall || '3' })
function save() { emit('save', { notes: String(form.notes ?? ''), tasteNotes: String(form.tasteNotes ?? ''), tasteRating: Number(form.tasteRating ?? 0), tasteAppearance: String(form.tasteAppearance ?? ''), tasteAroma: String(form.tasteAroma ?? ''), tasteFlavor: String(form.tasteFlavor ?? ''), tasteMouthfeel: String(form.tasteMouthfeel ?? ''), tasteAftertaste: String(form.tasteAftertaste ?? ''), tasteOverall: String(form.tasteOverall ?? '') }) }
</script>
