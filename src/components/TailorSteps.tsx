import * as styles from './tailoring.css'

const STEPS = ['Source', 'Generate', 'Review'] as const

export function TailorSteps({ current }: { current: (typeof STEPS)[number] }) {
  return (
    <ol className={styles.steps} aria-label="Tailoring steps">
      {STEPS.map((name, index) => (
        <li
          key={name}
          className={`${styles.step} ${name === current ? styles.stepCurrent : ''}`}
          aria-current={name === current ? 'step' : undefined}
        >
          <span className={styles.stepNumber}>{index + 1}</span> {name}
        </li>
      ))}
    </ol>
  )
}
