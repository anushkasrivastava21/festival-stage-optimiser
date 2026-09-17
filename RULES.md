# RULES — Engineering Standards for This Project

This document is the single source of truth for how this project is built, committed, and shipped. If a decision isn't documented here or in `ARCHITECTURE.md`/`TRD.md`, raise it before coding around it.

## 1. The Prime Rule: DB is the Brain
- All decision logic (vote aggregation, threshold checks, queue pivoting, cluster adjacency selection) lives in **PL/pgSQL triggers and stored procedures**.
- The backend/API layer may only: read, write, relay. It must never contain an `if (score < threshold)` or equivalent business rule.
- Any PR that adds decision logic to the app layer must be rejected in review with a reference to this rule.

## 2. Concurrency Rules
- Every write to `Stages.curr_vibe_score` must go through the trigger path — no ad-hoc `UPDATE Stages SET curr_vibe_score = ...` from application code.
- Use `SELECT ... FOR UPDATE` (2PL) scoped to the single stage row being modified. Never lock the whole `Stages` table.
- Load-test concurrent voting before demo day; target ≥ 5,000 votes/sec/stage with zero lost updates.

## 3. Schema Rules
- Schema changes only via migration files in `/db/migrations` — never manual edits to a live DB.
- Every table change must be reflected in `TRD.md` §2 in the same PR.
- Foreign keys are enforced at the DB level, not just assumed in app code.

## 4. Git & Repo Hygiene
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- **Branching:** `main` (stable/demo-ready) ← `dev` ← `feature/<name>`. No direct commits to `main`.
- One logical change per commit. No "final final v2" commits.
- PRs required even solo — review your own diff before merging.
- Never commit: `.env`, credentials, `node_modules`, raw ML datasets over a few MB.
- Commit the offline ML job's **output** (cluster assignments/adjacency map) as a seed file, not the raw training data.
- Tag milestone commits (`v0.1-schema`, `v0.2-triggers`, `v1.0-demo`).

## 5. Documentation Rules
- `README.md` stays current with every merged feature — stale docs are treated as a bug.
- Every trigger/stored procedure gets a comment block: purpose, inputs, side effects.
- Comment the **why**, not the **what** — the SQL already says what it does.
- Diagrams (EER, data flow) live in `/docs` as source files (draw.io/Excalidraw), not just as images pasted into slides.

## 6. Code Quality Rules
- Linter + formatter configured from the first commit (ESLint + Prettier for JS/TS).
- Environment configs separated: `.env.example` committed, real `.env` gitignored, dev/prod configs distinct.
- Frontend contains **zero** business logic beyond "render what the API returns."
- API routes are thin — one responsibility per route, no cross-cutting logic buried in controllers.

## 7. ML Job Rules
- The clustering script is deterministic and re-runnable (fixed random seed).
- Output format (cluster_id → track_id mapping, adjacency map) is versioned — re-running with a different `k` produces a new seed file, not an overwrite of history.
- Document the choice of `k` (elbow/silhouette method) in a short note alongside the script.

## 8. Definition of Done (per feature)
- [ ] Migration/trigger/procedure written and tested locally
- [ ] Corresponding doc (`TRD.md`/`ARCHITECTURE.md`) updated in the same PR
- [ ] No business logic leaked into backend or frontend
- [ ] Concurrency behavior verified if the feature touches `Live_Votes`/`Stages`
- [ ] README updated if setup/run steps changed

## 9. Pre-Demo Checklist
- [ ] EER model in repo matches deployed schema exactly
- [ ] End-to-end vote → autonomous pivot demo works with no manual intervention
- [ ] Git history tells the build story (PRD → schema → triggers → ML seed → frontend)
- [ ] All docs (PRD, TRD, Architecture, Rules, README) present and consistent with the actual code
