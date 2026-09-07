import type { Metadata } from 'next'
import { archivo, plexMono } from './fonts'
import { themeScript } from '@/lib/theme'
import './global.css'

export const metadata: Metadata = {
  title: 'Recast',
  description: 'Job application tracker',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Before first paint: see src/lib/theme.ts. The class this adds is
            not present in the server-rendered markup, hence
            suppressHydrationWarning on <html> above. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
