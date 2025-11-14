# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`, where route folders contain their own `page.tsx`, layout, and server actions. Shared UI sits in `components/`, while reusable hooks and data utilities live in `hooks/` and `lib/`. Styling mixes Tailwind tokens (configured via `tailwind.config`) with global layers in `styles/`. Static assets belong in `public/`, and middleware or config glue stays at the workspace root alongside `components.json` for the component registry.

## Build, Test, and Development Commands
Use `pnpm dev` for hot-reload development, `pnpm build` to produce the optimized Next.js bundle, and `pnpm start` to run the production server locally. `pnpm lint` runs ESLint with the repository presets; fix autofixable issues with `pnpm lint --fix`. Match the Node version defined by the project (check `.nvmrc` or `package.json` engines) before running any command.

## Coding Style & Naming Conventions
Follow TypeScript strictness and prefer functional React components with arrow functions. Components live in PascalCase files (e.g., `DashboardCard.tsx`), hooks in camelCase (`useModal.ts`), and shared utilities in kebab-case folders. Keep imports absolute via the configured `tsconfig` paths. Tailwind classes should group layout → color → state modifiers. Run `pnpm lint` before committing; ESLint and Prettier rules enforce 2-space indentation and single quotes where possible.

## Testing Guidelines
No automated suite ships yet, so prioritize unit-ready code. When adding tests, colocate them under `components/__tests__` or `lib/__tests__` using `@testing-library/react` and Jest. Name files `*.test.tsx` and cover at least the primary render path and one failure state. Document manual QA steps in the PR until automated coverage lands.

## Commit & Pull Request Guidelines
Commits should stay small, use the imperative mood, and optionally include a scope: `feat(auth): add OTP enrollment`. Avoid the vague one-word `update` style seen in early history. Each PR must describe the change, list testing evidence (`pnpm lint`, manual scenarios), link the tracking issue, and attach screenshots for UI-facing updates.

## Security & Configuration Tips
Secrets belong in `.env.local`, never in Git; reference them via `process.env`. Regenerate Supabase keys or third-party tokens if they leak in logs. Keep browser storage minimal—prefer Supabase server components for sensitive flows, and validate all inputs with Zod on both client and server layers.
