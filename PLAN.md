# Recast — Phased Plan

Personal full-stack project: an application-tracking CRM combined with AI-assisted
CV/cover-letter tailoring, built to demonstrate Docker + CI/CD for job applications
that require it.

## Stack decisions

- **App:** Next.js, React, TypeScript (same stack as purzycki.pl)
- **Database:** Postgres
- **AI:** Claude API, for tailoring a CV/cover letter from stored experience + a pasted job description
- **Containerization:** Docker, `docker-compose` for local dev (app + Postgres)
- **Repo + CI/CD:** GitHub — keeps this project on the same profile as everything else; GitHub Actions (2,000 free CI min/month private, unlimited public), GitHub Container Registry (`ghcr.io`)
- **Deploy target:** Google Cloud Run — genuine always-free monthly grant (~180k vCPU-seconds / 360k GiB-seconds / 2M requests), runs OCI images directly (including public `ghcr.io` images, no need to also push to Artifact Registry), and "Google Cloud" reads as well on a CV as Azure or AWS
- **Domain:** `recast.purzycki.pl` — subdomain of the existing purzycki.pl domain, CNAME to Cloud Run's domain-mapping target, custom domain + Google-managed TLS cert configured in Cloud Run

## Phases

### Phase 0 — Repo setup
- Create the GitHub repo for `recast` (public is fine — nothing sensitive in the code)
- Push the empty `recast` folder as the initial commit

### Phase 1 — Skeleton app
- Minimal Next.js app: one page, one API route ("hello")
- No real features yet — this phase exists purely to prove the pipeline end to end

### Phase 2 — Dockerize the skeleton
- `Dockerfile` for the Next.js app
- `docker-compose.yml` for local dev

### Phase 3 — CI/CD pipeline
- `.github/workflows/deploy.yml`: build the Docker image, push to GitHub Container Registry (`ghcr.io`)

### Phase 4 — Deploy target (done)
- Project `recast-purzycki`, Cloud Run + Artifact Registry APIs enabled
- Deployed from the GHCR image; live at `https://recast-444818248992.europe-west1.run.app`
- Pipeline deploys automatically on push to `main`, authenticating via **Workload Identity Federation** — no service account key is stored in GitHub secrets, and the OIDC provider is restricted to the `purzyk/recast` repo
- The deploy step ships the SHA-tagged image, not `:latest`, so each revision is pinned to its commit

**Region note:** originally deployed to `europe-central2` (Warsaw), but that region
rejects domain mappings outright (`Creating domain mappings is not allowed in
europe-central2`). Moved to `europe-west1` (Belgium), which supports them. Costs
roughly 25ms of latency — irrelevant here.

**Cost guardrails, set before the service was deployable:**
- Budget of 20 PLN scoped to this project, alerting at 50/90/100%. Note the budget must be in the billing account's own currency — a USD amount fails with an opaque `INVALID_ARGUMENT`.
- `--max-instances=2` on the service. This is the guardrail that actually bounds spending; a budget alert only notifies.

### Phase 5 — Domain (done)
- `recast` CNAME → `ghs.googlehosted.com.` added in the mydevil DNS zone
- Domain mapped to the Cloud Run service; `DomainRoutable` confirmed true
- Google-managed certificate issues automatically once DNS resolves

Note: the subdomain needs a **DNS record only** — not a "Strona WWW" entry in the
mydevil panel. Creating a site there would auto-add A records pointing at mydevil
and conflict with the CNAME.

### Phase 6 — Add Postgres (done)
- Local: Postgres as a compose service, with a healthcheck the app waits on
- Deployed: **Neon** free tier, Frankfurt — closest region to Cloud Run's `europe-west1`, since the latency that matters is app-to-database, not user-to-database
- ORM: **Prisma 7** with the `pg` driver adapter
- `/api/health` reports real database reachability and returns 503 when it fails

**Why a separate database provider:** Cloud Run is stateless and scales to
zero, so it cannot host the Postgres container — the data would vanish on every
scale-down. Cloud SQL, Google's own managed Postgres, has no free tier and bills
continuously because it cannot scale to zero. Neon scales to zero like Cloud Run
does, keeping both halves at $0.

**Two connection strings, deliberately:**
- *Pooled* (`-pooler` host) — used by the running app.
- *Direct* — used by migrations. Neon's pooler runs in transaction mode and cannot support the session-level advisory locks Prisma migrations require.

**Secrets:** both live in **Secret Manager**, not in GitHub secrets or plain
Cloud Run env vars. The runtime service account reads the pooled URL; the CI
service account reads the direct one using the same Workload Identity
credentials as the deploy. No database credential is stored in GitHub.

**Migrations run in the pipeline**, not at container startup — Cloud Run may
start several instances simultaneously, which would race applying the same
migration. Running once in CI also surfaces a failed migration as a failed
build, rather than a half-migrated database behind a restarting container.

**Prisma 7 notes** (it differs from most tutorials):
- Connection URLs moved out of `schema.prisma` into `prisma.config.ts`; the runtime connects through a driver adapter.
- Driver adapters mean no Rust query-engine binary in the image, which recovers most of the cold-start cost that ORM choice would otherwise add.
- The client must be created lazily: Next evaluates route modules at build time to collect config, and `DATABASE_URL` does not exist there.
- npm's `latest` tag for the `prisma` CLI currently resolves to an `8.0.0-rc` while `@prisma/client` latest is `7.10.0`. Both are pinned to `7.10.0` — installing without pinning gives a mismatched pair.

### Phase 7 — The CRM (the actually useful half)
This is the part that solves the stated problem — never applying to the same posting
twice — and it needs no AI, no API key and no extra billing. Shipping this alone
gives a working, deployed, containerised app worth pointing at.

- **Data model:** see SCHEMA.md — proposed and Prisma-validated, not yet migrated. It replaces the Phase 6 placeholder `Application`.
- **CRM:** companies, job postings, application records with a status pipeline (saved → applied → interview → offer/rejected)
- **Duplicate guard:** warn when adding a posting matching a company + role already in the pipeline
- **Theming:** dark and light both ship. Dark is primary; the light palette is fully specified, so there is no reason to defer it.
- **Auth: blocking, not optional.** `recast.purzycki.pl` currently runs `--allow-unauthenticated`, which is fine for a skeleton and not fine for a list of where you are job hunting. A password gate goes in **before** any real application data does.

**Design decisions carried in from the design pass** (argued in section 09 of
the screens artifact, confirmed rather than overridden):
1. The duplicate guard **warns, does not block** — a company reposting a role you genuinely want again must stay addable. Hence no unique constraint on `(companyId, role)`, only an index.
2. Generated output **saves as a version, never a replacement** — so what you actually sent is still readable when a recruiter calls.
3. Status changes **from the detail screen**, not only by dragging — a select that writes a `StatusEvent` is simpler than making the badge a menu.

### Phase 8 — Experience library
- Input/store work history, projects, skills — the raw material the tailoring step will later draw from
- Useful on its own as a structured place to keep CV source material, independent of any AI

### Phase 9 — AI tailoring (deliberately last)
Deferred to the end because it's the only part that costs money to run: the Claude
API is billed per token and is **not** covered by a Claude Pro subscription. Roughly
a couple of cents per tailoring call — verify against anthropic.com/pricing rather
than trusting an estimate.

- Paste a job description against an application record → Claude API generates a tailored CV/cover letter from the Phase 8 experience data
- Output must be editable in place, not a black box to accept blind
- **Cost controls before switching it on:** a hard spend limit in the Anthropic console, and consider Haiku over Sonnet — likely sufficient for this task at a fraction of the price

### Phase 10 — Stretch ideas (not committed, revisit later)
- Mock interview practice tool over WebRTC, questions generated from a stored job description
- Small MCP server exposing the stored experience/project data, so any MCP-aware LLM client can query it directly

## Open questions

Resolved:
- ~~Exact CRM schema~~ — SCHEMA.md, validated against the Prisma CLI.
- ~~Where the master experience data lives~~ — structured rows (`ExperienceEntry`), not one long document. The library screen filters by kind and counts usage per entry, neither of which works against prose.
- ~~Theme scope~~ — dark and light together.

Still open:
- ~~The auth mechanism~~ — Google sign-in via Auth.js. Verified against Next 16; see AUTH.md for the recipe and the four gotchas the spike turned up. Not yet implemented: it needs Google OAuth credentials and secrets in Secret Manager first.
- **Deployment of the first real migration.** The pipeline runs `prisma migrate deploy` automatically, so replacing the placeholder `Application` model will drop the table on the next push. It is empty, so nothing is lost — but worth doing deliberately rather than noticing afterwards.

## Cost notes

- **Cloud Run:** the free grant's binding constraint is 180,000 vCPU-seconds/month (~50 hours of actual request-processing time; the app bills nothing while idle since it scales to zero). Heavy personal use estimates to roughly 2% of that. Guard with `--max-instances`, which actually caps exposure — a budget alert only notifies, it does not stop spending.
- **Claude API:** the real recurring cost, and only from Phase 9 onward. Separate from Claude Pro.
- **Neon Postgres:** free tier, scales to zero.
