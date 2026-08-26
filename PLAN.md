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
- **Deploy target:** Azure Container Apps — genuine always-free monthly grant (~180k vCPU-seconds / 360k GiB-seconds / 2M requests), runs OCI images directly, and "Azure" reads better on a CV than a generic VPS
- **Domain:** `recast.purzycki.pl` — subdomain of the existing purzycki.pl domain, CNAME to Azure Container Apps' default hostname, custom domain + managed TLS cert configured in Azure

## Phases

### Phase 0 — Repo setup
- Create the GitHub repo for `recast` (public is fine — nothing sensitive in the code)
- Push the empty `jobs-app` folder as the initial commit

### Phase 1 — Skeleton app
- Minimal Next.js app: one page, one API route ("hello")
- No real features yet — this phase exists purely to prove the pipeline end to end

### Phase 2 — Dockerize the skeleton
- `Dockerfile` for the Next.js app
- `docker-compose.yml` for local dev

### Phase 3 — CI/CD pipeline
- `.github/workflows/deploy.yml`: build the Docker image, push to GitHub Container Registry (`ghcr.io`)

### Phase 4 — Deploy target
- Create the Azure Container Apps environment
- Extend the pipeline to deploy: pull the pushed image, `az containerapp update --image ...`
- Confirm the skeleton is live on its default `*.azurecontainerapps.io` hostname

### Phase 5 — Domain
- Add the `recast.purzycki.pl` CNAME record wherever purzycki.pl's DNS is managed
- Bind the custom domain in Azure Container Apps, issue the managed certificate
- Confirm `recast.purzycki.pl` resolves to the deployed skeleton over HTTPS

### Phase 6 — Add Postgres
- Add Postgres as a second container in `docker-compose.yml`
- Wire a DB connection env var through the CI/CD pipeline and Azure Container Apps config
- Confirm the deploy still works with the DB in place, before adding any real schema

### Phase 7 — Real features
- **Experience data:** input/store work history, projects, skills (the material the tailoring step draws from)
- **CRM:** companies, job postings, application records with a status pipeline (saved → applied → interview → offer/rejected)
- **Tailoring:** paste a job description against a specific application record → Claude API generates a tailored CV/cover letter from the stored experience data
- **Auth:** single-user is fine for a personal tool, but gate it behind at least basic auth before it's live on a public subdomain

### Phase 8 — Stretch ideas (not committed, revisit later)
- Mock interview practice tool over WebRTC, questions generated from a stored job description
- Small MCP server exposing the stored experience/project data, so any MCP-aware LLM client can query it directly

## Open questions to resolve before Phase 7

- Single-user auth approach (simplest thing that isn't "no auth at all")
- Exact CRM schema: what fields does an application record need beyond company / job title / status / dates / link?
- Where the "master experience data" lives — structured DB rows vs. one long-form document the AI reads from
