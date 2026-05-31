import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      version: pkg.version,
    },
  },

  modules: ['@nuxtjs/i18n', '@nuxt/eslint'],

  css: ['~/assets/css/tailwind.css', '~/assets/css/print.css'],

  i18n: {
    locales: [
      { code: 'nl', name: 'Nederlands', file: 'nl.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'nl',
    lazy: true,
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },

  runtimeConfig: {
    databasePath: './data/brewbuddy.db',
  },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  hooks: {
    // Suppress harmless SOURCEMAP_BROKEN warnings from transform plugins
    // (Tailwind, module-preload polyfill) that do not emit sourcemaps. The hook
    // runs for both the client and server Vite builds.
    'vite:extendConfig'(config) {
      config.build ||= {}
      config.build.rollupOptions ||= {}
      const previous = config.build.rollupOptions.onwarn
      config.build.rollupOptions.onwarn = (warning, defaultHandler) => {
        if (warning.code === 'SOURCEMAP_BROKEN') {
          return
        }
        if (typeof previous === 'function') {
          previous(warning, defaultHandler)
        } else {
          defaultHandler(warning)
        }
      }
    },
  },

  experimental: {
    typedPages: false,
  },
})
