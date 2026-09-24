// Client-safe: no database import, so components can use the labels.
export const EXPERIENCE_KINDS = ['work', 'project', 'skill', 'achievement'] as const
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number]

/** Plural, because they label a filter that counts things. */
export const KIND_LABEL: Record<ExperienceKind, string> = {
  work: 'Work history',
  project: 'Projects',
  skill: 'Skills',
  achievement: 'Achievements',
}

/** Singular, for the one place a single entry names its own kind. */
export const KIND_LABEL_ONE: Record<ExperienceKind, string> = {
  work: 'Work history',
  project: 'Project',
  skill: 'Skill',
  achievement: 'Achievement',
}

export function isExperienceKind(value: string): value is ExperienceKind {
  return (EXPERIENCE_KINDS as readonly string[]).includes(value)
}

