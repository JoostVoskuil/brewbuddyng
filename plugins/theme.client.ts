import { useTheme } from '~/composables/useTheme'

export default defineNuxtPlugin((nuxtApp) => {
  const { refresh, apply } = useTheme()

  nuxtApp.hook('app:mounted', () => {
    void refresh()

    window.addEventListener('brewbuddy:settings-changed', () => {
      void refresh()
    })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      apply()
    })
  })
})
