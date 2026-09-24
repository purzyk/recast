'use client'

import { useState } from 'react'
import * as buttonStyles from './button.css'

export function CopyDocument({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      className={buttonStyles.button.secondary}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? 'Copied' : 'Copy as text'}
    </button>
  )
}
