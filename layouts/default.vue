<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r bg-card flex flex-col print:hidden">
      <div class="p-4 border-b">
        <h1 class="text-xl font-bold text-primary">🍺 BrewBuddyNG</h1>
        <p class="text-xs text-muted-foreground">{{ $t('app.subtitle') }}</p>
      </div>
      <nav class="flex-1 p-2 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          active-class="bg-accent text-accent-foreground"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ $t(item.label) }}
        </NuxtLink>
      </nav>
      <div class="p-4 border-t text-xs text-muted-foreground space-y-1">
        <p>
          {{ $t('app.attribution') }}
          <a
            href="https://github.com/BrewBuddyOrg/BrewBuddy"
            target="_blank"
            class="underline hover:text-foreground"
          >
            {{ $t('app.originalSource') }}
          </a>
        </p>
        <p>{{ $t('app.portedBy') }}</p>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col">
      <header class="h-14 border-b flex items-center justify-between px-6 print:hidden">
        <div />
        <div class="flex items-center gap-2">
          <select
            :value="locale"
            class="text-sm border rounded px-2 py-1 bg-background"
            @change="setLocale(($event.target as HTMLSelectElement).value as 'nl' | 'en')"
          >
            <option value="nl">🇳🇱 NL</option>
            <option value="en">🇬🇧 EN</option>
          </select>
        </div>
      </header>
      <div class="flex-1 p-6 overflow-auto print:overflow-visible print:p-0">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  Database,
  BookOpen,
  FlaskConical,
  Wrench,
  BarChart3,
  Settings,
  Info,
  Boxes,
} from '@lucide/vue'

const { locale, setLocale } = useI18n()

const navItems = [
  { to: '/recipes', label: 'nav.recipes', icon: BookOpen },
  { to: '/brews', label: 'nav.brews', icon: FlaskConical },
  { to: '/databases', label: 'nav.databases', icon: Database },
  { to: '/inventory', label: 'nav.inventory', icon: Boxes },
  { to: '/tools', label: 'nav.tools', icon: Wrench },
  { to: '/analysis', label: 'nav.analysis', icon: BarChart3 },
  { to: '/settings', label: 'nav.settings', icon: Settings },
  { to: '/about', label: 'nav.about', icon: Info },
]
</script>
