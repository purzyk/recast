import { Archivo, Geist_Mono } from 'next/font/google'

// Self-hosted by next/font: no render-blocking request to Google, and no
// swap flash. latin-ext is required — Polish diacritics live there.
export const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-archivo',
  display: 'swap',
})

// Geist Mono rather than IBM Plex Mono: at the 10–11px the labels use, Plex's
// uneven spacing broke up the letter-spaced capitals.
export const geistMono = Geist_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})
