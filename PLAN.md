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

### Phase 4 — Deploy target
- Create a Google Cloud project and enable the Cloud Run API
- Extend the pipeline to deploy: `gcloud run deploy recast --image ghcr.io/purzyk/recast:latest ...`
- Confirm the skeleton is live on its default `*.run.app` hostname

### Phase 5 — Domain
- Add the `recast.purzycki.pl` CNAME record wherever purzycki.pl's DNS is managed
- Map the custom domain to the Cloud Run service (`gcloud run domain-mappings create`), issue the Google-managed certificate
- Confirm `recast.purzycki.pl` resolves to the deployed skeleton over HTTPS

### Phase 6 — Add Postgres
- Add Postgres as a second container in `docker-compose.yml` for local dev
- Cloud Run is stateless/serverless — it can't host the Postgres container itself, so this phase also picks a free-tier managed Postgres for the deployed environment (e.g. Neon or Supabase) and wires its connection string through the CI/CD pipeline and Cloud Run's env vars
- Confirm the deploy still works with the DB connected, before adding any real schema

### Phase 7 — The CRM (the actually useful half)
This is the part that solves the stated problem — never applying to the same posting
twice — and it needs no AI, no API key and no extra billing. Shipping this alone
gives a working, deployed, containerised app worth pointing at.

- **CRM:** companies, job postings, application records with a status pipeline (saved → applied → interview → offer/rejected)
- **Duplicate guard:** warn when adding a posting matching a company + role already in the pipeline
- **Auth:** single-user is fine for a personal tool, but gate it behind at least basic auth before it's live on a public subdomain

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

## Open questions to resolve before Phase 7

- Single-user auth approach (simplest thing that isn't "no auth at all")
- Exact CRM schema: what fields does an application record need beyond company / job title / status / dates / link?
- Where the "master experience data" lives — structured DB rows vs. one long-form document the AI reads from

## Cost notes

- **Cloud Run:** the free grant's binding constraint is 180,000 vCPU-seconds/month (~50 hours of actual request-processing time; the app bills nothing while idle since it scales to zero). Heavy personal use estimates to roughly 2% of that. Guard with `--max-instances`, which actually caps exposure — a budget alert only notifies, it does not stop spending.
- **Claude API:** the real recurring cost, and only from Phase 9 onward. Separate from Claude Pro.
- **Neon Postgres:** free tier, scales to zero.
