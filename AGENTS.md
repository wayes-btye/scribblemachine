# Repository Guidelines

## Project Structure & Module Organization
- `apps/web/`: Next.js front-end with app router pages, shared UI components, and Tailwind config. Public assets live under `apps/web/public/`.
- `services/worker/`: TypeScript worker that handles generation pipelines, PDF export, and queue jobs; integration artifacts are kept in `services/worker/test-output/`.
- `packages/`: Workspace libraries for config, database, and types; treat these as the canonical sources for cross-package imports.
- `scripts/`: Operational tooling, including Playwright-style smoke tests in `scripts/testing/` and captured logs in `scripts/logs/`.
- `docs/` and `supabase/`: Product documentation and database migrations; keep them aligned with production releases.

## Build, Test, and Development Commands
- `pnpm install`: Bootstrap the workspace; re-run after dependency updates.
- `pnpm dev`: Launches web and worker targets concurrently for full-stack iteration.
- `pnpm web:dev` / `pnpm worker:dev`: Start a focused dev server for a single surface.
- `pnpm build`: Compile every package; run before tagging a release.
- `pnpm test`: Execute package-level test scripts, including worker integrations.
- `pnpm lint` and `pnpm type-check`: Verify ESLint and TypeScript gates before opening a PR.

## Coding Style & Naming Conventions
- Prettier enforces 2-space indentation, 100-character lines, semicolons, and single quotes; format with `pnpm exec prettier --write` when needed.
- Author code in TypeScript with explicit return types on exports; prefer barrel exports from `packages/types`.
- UI components use PascalCase (`ColoringCanvas.tsx`), hooks use the `use` prefix, and worker utilities adopt descriptive kebab-case (`test-gemini.ts`).
- Centralize environment reads through helpers in `packages/config` rather than ad-hoc `process.env` access.

## Testing Guidelines
- Front-end smoke scripts reside in `scripts/testing/`; run targeted checks with `node scripts/testing/auth-flow-test.js`.
- Worker integration tests depend on Gemini and Supabase credentials; invoke them via `pnpm --filter @coloringpage/worker run test:gemini` and avoid committing generated binaries unless they aid review.
- Name new specs with a `test-` prefix alongside the feature they cover; update README or docs with any fixture requirements.
- Clean artifacts under `services/worker/test-output/` once verification is complete to keep diffs minimal.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat:`, `fix:`, `chore:`) as used in recent history; keep subjects imperative and under ~60 characters.
- Reference issue IDs or context in the body when applicable, and separate refactors from feature commits.
- PRs should summarize scope, list manual test notes, and attach UI screenshots for visual changes; link Supabase migration notes for schema updates.
- Secure approvals from both web and worker owners on cross-cutting changes and wait for `pnpm lint` and `pnpm test` to pass before merging.

## Configuration & Secrets
- Copy `.env.example` to `.env` and `apps/web/.env.local` as needed; never commit secret values.
- Apply database migrations in `supabase/` alongside updates to `packages/config`, and flag breaking configuration changes in PR descriptions.
