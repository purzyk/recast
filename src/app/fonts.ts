import { Archivo, IBM_Plex_Mono } from 'next/font/google'

// Self-hosted by next/font: no render-blocking request to Google, and no
// swap flash. latin-ext is required — Polish diacritics live there.
export const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-archivo',
  display: 'swap',
})

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})
