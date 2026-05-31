<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.title') }}</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.to"
        :to="tool.to"
        class="border rounded-lg p-5 hover:bg-accent transition-colors"
      >
        <h2 class="font-semibold mb-1">{{ $t(tool.label) }}</h2>
        <p class="text-sm text-muted-foreground">{{ tool.desc }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const tools = [
  {
    to: '/tools/hop-calculator',
    label: 'tools.hopCalculator',
    desc: 'IBU from hops or hops for target IBU',
  },
  { to: '/tools/yeast-starter', label: 'tools.yeastStarter', desc: 'Yeast propagation steps' },
  {
    to: '/tools/yeast-starter-multi',
    label: 'tools.yeastStarterMulti.title',
    desc: 'Multi-stage yeast propagation',
  },
  { to: '/tools/water-wizard', label: 'tools.waterWizard', desc: 'Water mineral adjustment' },
  { to: '/tools/refractometer', label: 'tools.refractometer', desc: 'Brix to SG conversion' },
  { to: '/tools/carbonation', label: 'tools.carbonation', desc: 'CO₂ pressure & priming' },
  { to: '/tools/priming', label: 'tools.priming', desc: 'Priming sugar calculator' },
  {
    to: '/tools/hydrometer-correction',
    label: 'tools.hydrometerCorrection',
    desc: 'Temperature correction',
  },
  {
    to: '/tools/infusion-calculator',
    label: 'tools.infusionCalculator',
    desc: 'Infusion & decoction volumes',
  },
  { to: '/tools/hop-aging', label: 'tools.hopAging', desc: 'Alpha acid loss over time' },
  { to: '/tools/mash-ph', label: 'tools.mashPh', desc: 'Acid/base to target mash pH' },
  { to: '/tools/kettle-volume', label: 'tools.kettleVolume', desc: 'Volume from liquid height' },
  { to: '/tools/cm-volume', label: 'tools.cmVolume.title', desc: 'Volume from cm under rim' },
  { to: '/tools/dilution', label: 'tools.dilution', desc: 'Adjust gravity with water/sugar' },
  { to: '/tools/blending', label: 'tools.blending', desc: 'Virtual OG of blended worts' },
  {
    to: '/tools/sg-plato-brix',
    label: 'tools.sgPlatoBrix',
    desc: 'Convert between SG, Brix and Plato',
  },
  {
    to: '/tools/og-after-fermentation',
    label: 'tools.ogAfterFermentation',
    desc: 'OG & ABV from hydrometer + refractometer',
  },
  { to: '/tools/boil-test', label: 'tools.boilTest', desc: 'ABV of a finished beer by boiling' },
  {
    to: '/tools/grist-wizard',
    label: 'tools.gristWizard',
    desc: 'Build a grain bill by percentage',
  },
  {
    to: '/tools/style-match',
    label: 'tools.styleMatch',
    desc: 'Find the closest beer styles for your numbers',
  },
  { to: '/tools/timer', label: 'tools.timer', desc: 'Countdown & stopwatch' },
]
</script>
