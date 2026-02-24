# Project notes

## Tech stack

Vanilla JS + Vite SPA. No framework. Optional Neon Auth + Neon Data API for cloud sync (disabled when env vars are absent).

## Testing

- **Unit tests**: vitest with jsdom environment — `npm test` (or `npm run test:watch` for watch mode)
  - Test files live in `src/` alongside source files, named `*.test.js`
  - `src/rules.test.js` covers `extractArticle`, `articleContentToHtml`, `renderExplanationHtml`
  - `src/quiz.test.js` covers `normalizeCount`, `shuffleArray`; auth/api/rules modules are mocked via `vi.mock()`
- **E2E tests**: Playwright — `npx playwright test`
  - Config: `playwright.config.ts`, tests in `tests/`

## Dependencies

Dependency updates are managed by Renovate (see `renovate.json`). `vitest` and `jsdom` are pinned to exact versions so Renovate opens explicit update PRs for them.
