type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeSettings {
  themeFontFamily: string
  themeFontSize: string
  themeAccentColor: string
  themeMode: ThemeMode
}

const DEFAULT_THEME: ThemeSettings = {
  themeFontFamily: 'Inter',
  themeFontSize: '14',
  themeAccentColor: '#16a34a',
  themeMode: 'system',
}

function normaliseThemeMode(value: string | undefined): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : DEFAULT_THEME.themeMode
}

function normaliseHex(value: string | undefined): string {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? (value as string) : DEFAULT_THEME.themeAccentColor
}

function hexToHsl(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return `0 0% ${Math.round(l * 100)}%`

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0)
      break
    case g:
      h = (b - r) / d + 2
      break
    default:
      h = (r - g) / d + 4
      break
  }
  h /= 6
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function normaliseSettings(settings: Record<string, string>): ThemeSettings {
  const fontSize = Number.parseFloat(settings.themeFontSize ?? DEFAULT_THEME.themeFontSize)
  return {
    themeFontFamily: settings.themeFontFamily?.trim() || DEFAULT_THEME.themeFontFamily,
    themeFontSize:
      Number.isFinite(fontSize) && fontSize >= 10 && fontSize <= 24
        ? String(fontSize)
        : DEFAULT_THEME.themeFontSize,
    themeAccentColor: normaliseHex(settings.themeAccentColor),
    themeMode: normaliseThemeMode(settings.themeMode),
  }
}

export function applyThemeSettings(settings: Record<string, string>) {
  if (!import.meta.client) return

  const theme = normaliseSettings(settings)
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const useDark = theme.themeMode === 'dark' || (theme.themeMode === 'system' && prefersDark)
  const accentHsl = hexToHsl(theme.themeAccentColor)

  root.style.setProperty('--theme-accent', theme.themeAccentColor)
  root.style.setProperty('--theme-font-family', theme.themeFontFamily)
  root.style.setProperty('--primary', accentHsl)
  root.style.setProperty('--ring', accentHsl)
  root.style.fontFamily = `var(--theme-font-family), system-ui, sans-serif`
  root.style.fontSize = `${theme.themeFontSize}px`
  root.classList.toggle('dark', useDark)
}

export function useTheme() {
  const settings = useState<Record<string, string>>('theme-settings', () => ({ ...DEFAULT_THEME }))

  const apply = () => applyThemeSettings(settings.value)

  const refresh = async () => {
    const loaded = await $fetch<Record<string, string>>('/api/settings' as string)
    settings.value = {
      ...DEFAULT_THEME,
      ...loaded,
    }
    apply()
  }

  return { settings, apply, refresh }
}
