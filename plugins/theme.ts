import { loadThemeSettings } from '~/composables/useTheme'

// Universal plugin: load persisted theme settings during SSR so the server and
// client render the same theme mode (prevents a hydration mismatch on the theme
// toggle button). Client-side live refreshing is handled by theme.client.ts.
export default defineNuxtPlugin(async () => {
  await loadThemeSettings()
})
