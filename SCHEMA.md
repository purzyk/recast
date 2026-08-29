# Recast — proposed data model

Derived from what the six designed screens actually display, not from a guess
at what a tracker needs. Nothing here is migrated yet.

The current `prisma/schema.prisma` holds a placeholder `Application` written in
Phase 6 to prove the database connection. This replaces it.

## What the screens forced

Four things the placeholder did not have, each demanded by a specific view:

| The view shows | So the model needs |
|---|---|
| Cards labelled "5d ago" meaning *time in this column* | Status history, not a single `updatedAt` |
| Booksy with 2 applications, "one archived off the board" | `archived`, and Company as its own row |
| "CV v2" listed above "CV v1" | Documents as versions, never overwritten |
| "Used in: 9" on an experience entry | A link table between documents and entries |

## Stored vs derived

Worth stating, because the temptation is to denormalise all of it:

**Derived, never stored** — a company's latest status, its application count,
its last activity, the role last applied for, time-in-column on a card, and an
experience entry's "used in" count. All are queries. Storing them means
maintaining them.

**Stored, though it looks derivable** — `lastContactAt`. The detail screen
shows it as "—" when unset, and it means "the last time a human contacted me",
which no status change reliably implies. A recruiter emailing without moving
the stage is exactly the case it exists for.

## The schema

```prisma
enum ApplicationStatus {
  saved
  applied
  interview
  offer
  rejected
}

enum ExperienceKind {
  work
  project
  skill
  achievement
}

enum DocumentKind {
  cv
  coverLetter
}

model Company {
  id           Int           @id @default(autoincrement())
  name         String        @unique
  website      String?
  applications Application[]
  createdAt    DateTime      @default(now())
}

model Application {
  id        Int               @id @default(autoincrement())
  company   Company           @relation(fields: [companyId], references: [id])
  companyId Int
  role      String
  status    ApplicationStatus @default(saved)

  /// The posting itself. Null is meaningful: the card only shows the external
  /// mark when this is set, which is what makes the mark worth reading.
  sourceUrl String?
  /// Pasted job description. Feeds the tailoring step in Phase 9.
  jobDescription String?

  /// Off the board, still in the companies view. Not a delete — the whole
  /// point of the tool is remembering what you already applied for.
  archived   Boolean   @default(false)
  /// Set by a human contacting you, not by a status change.
  lastContactAt DateTime?

  history   StatusEvent[]
  notes     Note[]
  documents Document[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  /// Drives the duplicate guard. Not unique — the guard warns rather than
  /// blocks, so a genuine re-application to a reposted role must be possible.
  @@index([companyId, role])
  @@index([status, archived])
}

/// Append-only. Time-in-column is now() minus the newest row for an
/// application; the detail screen's timeline is this list read in reverse.
model StatusEvent {
  id            Int               @id @default(autoincrement())
  application   Application       @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  applicationId Int
  status        ApplicationStatus
  at            DateTime          @default(now())

  @@index([applicationId, at])
}

model Note {
  id            Int         @id @default(autoincrement())
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  applicationId Int
  body          String
  createdAt     DateTime    @default(now())

  @@index([applicationId, createdAt])
}

/// The source material tailoring draws from. Kept current, not imported once.
model ExperienceEntry {
  id    Int            @id @default(autoincrement())
  title String
  kind  ExperienceKind
  /// Display string, deliberately not a date range: "2018 – present" and the
  /// "—" a skill carries are both unrepresentable as two DateTimes.
  period String?
  body   String

  usedIn    DocumentSource[]
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@index([kind])
}

/// A generated CV or cover letter. Versions accumulate; regeneration writes a
/// new row rather than replacing one, so what you actually sent stays readable
/// after a recruiter calls.
model Document {
  id            Int          @id @default(autoincrement())
  application   Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  applicationId Int
  kind          DocumentKind
  version       Int
  content       String
  /// Touched by hand. Regeneration leaves edited documents alone.
  edited        Boolean      @default(false)

  sources   DocumentSource[]
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@unique([applicationId, kind, version])
}

/// Which experience entries fed which document. Two jobs: the provenance line
/// under a generated block, and the "used in" count in the library — the
/// number that tells you an entry has never earned its place.
model DocumentSource {
  document   Document        @relation(fields: [documentId], references: [id], onDelete: Cascade)
  documentId Int
  entry      ExperienceEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  entryId    Int

  @@id([documentId, entryId])
}
```

## Suggested migration split

Two migrations rather than one, so nothing unused ships early:

1. **Phase 7–8** — `Company`, `Application`, `StatusEvent`, `Note`, `ExperienceEntry`. Everything the CRM and library need.
2. **Phase 9** — `Document`, `DocumentSource`, and the `DocumentKind` enum, alongside the tailoring feature.

The cost is that the library's "used in" column reads 0 for everything until
Phase 9 lands. That is honest rather than broken — the column means "never
made it into a document", and before Phase 9 nothing has.

## Two decisions worth a second look

**`Note` as rows, not a text field.** The detail screen renders notes as
prose, which a single `String` would serve. Rows cost a table but give each
note a timestamp, which is what makes a note useful three weeks later when you
cannot remember whether the recruiter called before or after the take-home.

**No `Contact` model.** The screens never show a named person — `lastContactAt`
is a bare timestamp. Adding contacts now would be modelling for a screen that
does not exist. Easy to add later; hard to remove once it has rows.
