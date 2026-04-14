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
