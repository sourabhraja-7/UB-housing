import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise

  setOptions({
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    v: 'weekly',
  })

  loadPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('places'),
    importLibrary('geocoding'),
    importLibrary('routes'),
  ]).then(() => undefined)

  return loadPromise
}

export type MapTheme = 'light' | 'dark'

export function getMapId(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ??
    process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_DARK
  )
}

const THEME_STORAGE_KEY = 'ub-map-theme'

export function readStoredTheme(): MapTheme {
  if (typeof window === 'undefined') return 'dark'
  const v = window.localStorage.getItem(THEME_STORAGE_KEY)
  return v === 'light' ? 'light' : 'dark'
}

export function storeTheme(theme: MapTheme): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
}
