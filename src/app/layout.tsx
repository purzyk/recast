import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recast',
  description: 'Job application tracker and CV tailoring tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
