# Repository Rules & Contributing Guidelines

## Git Hygiene
1. **Conventional Commits**: Use `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
2. **Atomic Commits**: One logical change per commit.
3. **Branching**: `main` is production. Work on `feature/*` branches and merge via PRs.
4. **Secrets**: Never commit `.env` or any secret keys. Use `.env.example`.

## Code Quality
1. **Linting & Formatting**: ESLint and Prettier for the JS/TS stack. Black for Python.
2. **Documentation**: Comment *why*, not *what*. Keep the `README.md` and this rules document updated.
3. **Database Scripts**: All schema changes and DML must be stored in SQL migration files, not applied manually.

## Architectural Constraints
- **NO LOGIC IN NODE.JS**: The backend is just a messenger. If you are writing `if (vibe_score < -50)` in JavaScript, you are violating the core architecture. Put it in a PL/pgSQL trigger.
