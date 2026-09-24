'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as buttonStyles from './button.css'
import * as loadStyles from './loadingPanel.css'
import * as styles from './tailoring.css'
import { srOnly } from '@/styles/utils.css'
import { DOCUMENT_KINDS, DOCUMENT_LABEL, type DocumentKind } from '@/lib/document-types'
import type { TailorEvent } from '@/app/api/applications/[id]/tailor/route'

type Phase = 'reading' | 'matching' | 'drafting' | 'saving'
const PHASES: Phase[] = ['reading', 'matching', 'drafting', 'saving']

function formatElapsed(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function TailorRunner({
  applicationId,
  company,
  entryCount,
  nextVersion,
  disabled,
}: {
  applicationId: number
  company: string
  entryCount: number
  nextVersion: Record<DocumentKind, number>
  disabled: boolean
}) {
  const router = useRouter()
  const [kind, setKind] = useState<DocumentKind>('cv')
  const [phase, setPhase] = useState<Phase | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const running = phase !== null

  useEffect(() => {
    if (!running) return
    setSeconds(0)
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [running])

  async function run() {
    setError(null)
    setPhase('reading')
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`/api/applications/${applicationId}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
        signal: controller.signal,
      })
      if (!response.ok || !response.body) throw new Error(`Request failed (${response.status})`)

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as TailorEvent
          if (event.type === 'phase') setPhase(event.phase)
          if (event.type === 'error') throw new Error(event.message)
          if (event.type === 'done') {
            router.push(`/applications/${applicationId}/documents/${event.documentId}`)
            return
          }
        }
      }
      throw new Error('The connection closed before tailoring finished.')
    } catch (caught) {
      setPhase(null)
      setError(
        controller.signal.aborted
          ? 'Cancelled. Nothing was saved.'
          : caught instanceof Error
            ? caught.message
            : String(caught),
      )
    }
  }

  const label = DOCUMENT_LABEL[kind]
  const stepText: Record<Phase, string> = {
    reading: 'Reading the job description',
    matching: `Matching ${entryCount} experience ${entryCount === 1 ? 'entry' : 'entries'}`,
    drafting: kind === 'cv' ? 'Drafting the CV' : 'Drafting the cover letter',
    saving: `Saving as ${label} v${nextVersion[kind]}`,
  }

  if (running) {
    const currentIndex = PHASES.indexOf(phase)
    return (
      <div className={loadStyles.panel} role="status" aria-live="polite">
        <div className={loadStyles.header}>
          <span className={loadStyles.title}>Tailoring for {company}</span>
          <span className={loadStyles.elapsed}>{formatElapsed(seconds)}</span>
        </div>
        <div className={loadStyles.track}>
          <i className={loadStyles.sweepBar} />
        </div>
        <div className={loadStyles.steps}>
          {PHASES.map((step, index) => (
            <span
              key={step}
              className={
                index < currentIndex
                  ? loadStyles.step.done
                  : index === currentIndex
                    ? loadStyles.step.current
                    : loadStyles.step.todo
              }
            >
              {stepText[step]}
            </span>
          ))}
        </div>
        {/* Saving is a database write that takes milliseconds; cancelling
            it would only race the result. */}
        {phase !== 'saving' && (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className={buttonStyles.button.ghost}
            style={{ alignSelf: 'flex-start' }}
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.outputForm}>
      <fieldset className={styles.kindChoice}>
        <legend className={srOnly}>What to write</legend>
        {DOCUMENT_KINDS.map((option) => (
          <label key={option} className={styles.kindOption}>
            <input
              type="radio"
              name="kind"
              value={option}
              checked={kind === option}
              onChange={() => setKind(option)}
              className={styles.kindInput}
            />
            {DOCUMENT_LABEL[option]}
          </label>
        ))}
      </fieldset>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={run}
        disabled={disabled}
        className={`${buttonStyles.button.primary} ${buttonStyles.large}`}
        style={{ alignSelf: 'flex-start' }}
      >
        Generate {label} v{nextVersion[kind]}
      </button>
    </div>
  )
}
