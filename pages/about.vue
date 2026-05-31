<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">{{ $t('about.title') }}</h1>

    <div class="space-y-6">
      <section class="border rounded-lg p-6">
        <h2 class="font-semibold text-lg mb-2">BrewBuddyNG</h2>
        <p class="text-muted-foreground">{{ $t('about.description') }}</p>
        <p class="mt-2 text-sm">
          <span class="font-medium">{{ $t('about.version') }}:</span> {{ version }}
        </p>
        <p class="mt-1 text-sm">
          <span class="font-medium">{{ $t('about.repository') }}:</span>
          <a
            href="https://github.com/JoostVoskuil/brewbuddy"
            target="_blank"
            class="text-primary hover:underline ml-1"
          >
            github.com/JoostVoskuil/brewbuddy →
          </a>
        </p>
      </section>

      <section class="border rounded-lg p-6">
        <h2 class="font-semibold text-lg mb-2">{{ $t('about.originalProject') }}</h2>
        <p class="text-muted-foreground">{{ $t('about.originalDesc') }}</p>
        <a
          href="https://github.com/BrewBuddyOrg/BrewBuddy"
          target="_blank"
          class="inline-flex items-center gap-1 mt-3 text-primary hover:underline text-sm font-medium"
        >
          github.com/BrewBuddyOrg/BrewBuddy →
        </a>
      </section>

      <section class="border rounded-lg p-6 bg-accent/30">
        <h2 class="font-semibold text-lg mb-2">{{ $t('about.aiPort') }}</h2>
        <p class="text-muted-foreground">{{ $t('about.aiPortDesc') }}</p>
      </section>

      <section class="border rounded-lg p-6">
        <h2 class="font-semibold text-lg mb-2">{{ $t('about.techStack') }}</h2>
        <p class="text-muted-foreground">{{ $t('about.techStackDesc') }}</p>
      </section>

      <section class="border rounded-lg p-6">
        <h2 class="font-semibold text-lg mb-2">{{ $t('about.license') }}</h2>
        <p class="text-muted-foreground">{{ $t('about.licenseDesc') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  public: { version },
} = useRuntimeConfig()
</script>
