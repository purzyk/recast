'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as screen from './screen.css'
import * as buttonStyles from './button.css'
import * as fieldStyles from './field.css'
import * as loadStyles from './loadingPanel.css'
import * as table from './dataTable.css'
import * as styles from './tailoring.css'
import { srOnly } from '@/styles/utils.css'
import { KIND_LABEL_ONE } from '@/lib/experience-kinds'
import type { ImportPreview } from '@/lib/import-cv'
import type { ImportEvent } from '@/app/api/import/route'
import { saveImport } from '@/app/experience/actions'

type Phase = 'reading' | 'matching' | 'drafting'
const PHASES: Phase[] = ['reading', 'matching', 'drafting']
const PHASE_TEXT: Record<Phase, string> = {
  reading: 'Reading the CV',
  matching: 'Working out jobs, projects and skills',
  drafting: 'Writing the preview',
}

export function ImportRunner({ existing, hasProfile }: { existing: number; hasProfile: boolean }) {
  const router = useRouter()
  const [source, setSource] = useState<'pdf' | 'text'>('pdf')
  const [phase, setPhase] = useState<Phase | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mode, setMode] = useState<'add' | 'replace'>(existing ? 'add' : 'replace')
  const [replaceProfile, setReplaceProfile] = useState(!hasProfile)
  const [saving, startSaving] = useTransition()
  const abortRef = useRef<AbortController | null>(null)

  const running = phase !== null
  useEffect(() => {
    if (!running) return
    setSeconds(0)
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [running])

  async function read(form: HTMLFormElement) {
    setError(null)
    setPreview(null)
    setPhase('reading')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await fetch('/api/import', { method: 'POST', body: new FormData(form), signal: controller.signal })
      if (!response.ok || !response.body) throw new Error((await response.text()) || `Request failed (${response.status})`)

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
          const event = JSON.parse(line) as ImportEvent
          if (event.type === 'phase') setPhase(event.phase)
          if (event.type === 'error') throw new Error(event.message)
          if (event.type === 'done') {
            setPreview(event.preview)
            setPhase(null)
            return
          }
        }
      }
      throw new Error('The connection closed before the CV was read.')
    } catch (caught) {
      setPhase(null)
      setError(controller.signal.aborted ? 'Cancelled.' : caught instanceof Error ? caught.message : String(caught))
    }
  }

  function save() {
    if (!preview) return
    startSaving(async () => {
      await saveImport(preview, mode, replaceProfile)
      router.push('/experience')
    })
  }

  const byKey = new Map(preview?.entries.map((entry) => [entry.key, entry]) ?? [])
  const counts = preview
    ? (['work', 'project', 'skill', 'achievement'] as const).map((kind) => ({
        kind,
        count: preview.entries.filter((entry) => entry.kind === kind).length,
      }))
    : []

  return (
    <div className={`${screen.body} ${styles.twoPane}`}>
      <section className={screen.pane}>
        <h2 className={screen.paneLabel}>Source</h2>
        <form
          className={styles.outputForm}
          onSubmit={(event) => {
            event.preventDefault()
            read(event.currentTarget)
          }}
        >
          <fieldset className={styles.kindChoice}>
            <legend className={srOnly}>Source type</legend>
            {(['pdf', 'text'] as const).map((option) => (
              <label key={option} className={styles.kindOption}>
                <input
                  type="radio"
                  name="source"
                  value={option}
                  checked={source === option}
                  onChange={() => setSource(option)}
                  className={styles.kindInput}
                />
                {option === 'pdf' ? 'PDF file' : 'Paste text'}
              </label>
            ))}
          </fieldset>

          {source === 'pdf' ? (
            <div className={fieldStyles.field}>
              <label htmlFor="file" className={fieldStyles.label}>
                CV as PDF
              </label>
              <input id="file" name="file" type="file" accept="application/pdf" required className={fieldStyles.control} style={{ height: 'auto', padding: 6 }} />
              <span className={fieldStyles.hint}>Up to 10 MB. Read directly, layout included.</span>
            </div>
          ) : (
            <div className={fieldStyles.field}>
              <label htmlFor="text" className={fieldStyles.label}>
                CV as text
              </label>
              <textarea
                id="text"
                name="text"
                rows={18}
                required
                placeholder="Paste the whole CV: experience, projects, skills, education."
                className={`${fieldStyles.control} ${fieldStyles.textarea}`}
              />
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={phase !== null || saving}
            className={`${buttonStyles.button[preview ? 'secondary' : 'primary']} ${buttonStyles.large}`}
            style={{ alignSelf: 'flex-start' }}
          >
            {preview ? 'Read again' : 'Read the CV'}
          </button>
          <p className={styles.note}>
            Nothing is saved until you choose below. The CV&rsquo;s wording is kept: this step restructures, it
            does not rewrite.
          </p>
        </form>
      </section>

      <section className={screen.pane}>
        <h2 className={screen.paneLabel}>Preview</h2>

        {phase && (
          <div className={loadStyles.panel} role="status" aria-live="polite">
            <div className={loadStyles.header}>
              <span className={loadStyles.title}>Importing the CV</span>
              <span className={loadStyles.elapsed}>
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
              </span>
            </div>
            <div className={loadStyles.track}>
              <i
                className={loadStyles.fill}
                style={{ width: `${((PHASES.indexOf(phase) + 0.5) / PHASES.length) * 100}%` }}
              />
            </div>
            <div className={loadStyles.steps}>
              {PHASES.map((step, index) => {
                const current = PHASES.indexOf(phase)
                const tone = index < current ? 'done' : index === current ? 'current' : 'todo'
                return (
                  <span key={step} className={loadStyles.step[tone]}>
                    {PHASE_TEXT[step]}
                  </span>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className={buttonStyles.button.ghost}
              style={{ alignSelf: 'flex-start' }}
            >
              Cancel
            </button>
          </div>
        )}

        {!phase && !preview && <p className={screen.prose}>The structured result appears here before anything is saved.</p>}

        {preview && (
          <>
            <p className={screen.prose}>
              <strong style={{ color: 'inherit' }}>{preview.profile.name || 'No name found'}</strong>
              {preview.profile.headline && <> · {preview.profile.headline}</>}
              <br />
              {preview.profile.contact.join(' · ')}
              {preview.profile.portfolio.url && <> · portfolio {preview.profile.portfolio.label}</>}
              {preview.profile.quotes.length > 0 && <> · {preview.profile.quotes.length} quoted reference(s)</>}
            </p>
            <p className={styles.note}>{counts.map((item) => `${item.count} ${KIND_LABEL_ONE[item.kind].toLowerCase()}`).join(' · ')}</p>

            <table className={table.table} style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th className={table.th}>Entry</th>
                  <th className={table.th}>Kind</th>
                  <th className={`${table.th} ${table.num}`}>Dates</th>
                  <th className={`${table.th} ${table.num}`}>Bullets</th>
                </tr>
              </thead>
              <tbody>
                {preview.entries.map((entry) => (
                  <tr key={entry.key} className={table.row}>
                    <td className={table.td}>
                      {entry.parentKey && <span className={table.dimCell}>↳ </span>}
                      {entry.title}
                      {entry.parentKey && (
                        <span className={table.dimCell}> · part of {byKey.get(entry.parentKey)?.title}</span>
                      )}
                    </td>
                    <td className={`${table.td} ${table.dimCell}`}>{KIND_LABEL_ONE[entry.kind]}</td>
                    <td className={`${table.td} ${table.num}`}>{entry.period || '—'}</td>
                    <td className={`${table.td} ${table.num}`}>
                      {entry.body.split('\n').filter((line) => line.trim().startsWith('- ')).length || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.outputForm} style={{ marginTop: 16 }}>
              <fieldset className={styles.kindChoice}>
                <legend className={srOnly}>How to save</legend>
                {(['add', 'replace'] as const).map((option) => (
                  <label key={option} className={styles.kindOption}>
                    <input
                      type="radio"
                      name="mode"
                      value={option}
                      checked={mode === option}
                      onChange={() => setMode(option)}
                      className={styles.kindInput}
                    />
                    {option === 'add' ? 'Add to the library' : `Replace the library (${existing})`}
                  </label>
                ))}
              </fieldset>
              <label className={fieldStyles.hint} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={replaceProfile} onChange={(event) => setReplaceProfile(event.target.checked)} />
                {hasProfile ? 'Replace the profile (name, contact, education) with this one' : 'Save this as the profile'}
              </label>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className={`${buttonStyles.button[mode === 'replace' && existing ? 'danger' : 'primary']} ${buttonStyles.large}`}
                style={{ alignSelf: 'flex-start' }}
              >
                {saving ? 'Saving…' : `Save ${preview.entries.length} entries`}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
