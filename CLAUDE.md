# Project notes

## Tech stack

Vanilla JS + Vite SPA. No framework. Optional Neon Auth + Neon Data API for cloud sync (disabled when env vars are absent).

## Development approach

Development follows TDD: write tests first, then add the implementation to make them pass.

## Testing

- **Unit tests**: vitest with jsdom environment — `npm test` (or `npm run test:watch` for watch mode)
  - Test files live in `src/` alongside source files, named `*.test.js`
  - `src/rules.test.js` covers `extractArticle`, `articleContentToHtml`, `renderExplanationHtml`
  - `src/rulesPages.test.js` covers the build-time rendering of `docs/rules/*.md` into `rules/*.html` pages (article anchors, cross-reference links)
  - `src/quiz.test.js` covers `normalizeCount`, `shuffleArray`, `pickQuestions`; auth/api/rules modules are mocked via `vi.mock()`
  - `src/analytics.test.js` covers `initAnalytics`, `trackPageview` and `stripUrl` (Vercel Web Analytics only injected when enabled)
  - `src/router.test.js` covers the screen routes (`parseRoute`, `routeHash`, `routePath`) and `DIALOG_PATHS`
  - `src/dialogTracking.test.js` loads `index.html` with `quiz.js` wired up and checks the pageviews for the settings and sign-in/sign-up dialogs
  - `src/labels.test.js` covers question label filtering (`filterQuestionsByLabels`, persisted toggles) and validates the `labels` in `public/questions.json`
- **E2E tests**: Playwright — `npx playwright test`
  - Config: `playwright.config.ts`, tests in `tests/`
  - `tests/url-screens.spec.ts` covers screen URLs, Back/Forward and deep links
- **CI** (`.github/workflows/`): `unit-tests.yml`, `e2e-tests.yml`, and `deploy-pages.yml` (builds the app plus rendered rules pages and deploys `dist/` to GitHub Pages on push to `main`)

## Dependencies

Dependency updates are managed by Renovate (see `renovate.json`). `vitest`, `jsdom` and `marked` are pinned to exact versions so Renovate opens explicit update PRs for them.

## Question labels

Questions in `public/questions.json` may carry an optional `labels` array (known labels are defined in `QUESTION_LABELS` in `src/labels.js`: `team`, `fie`). The start screen shows a toggle per label; a labeled question is only used in study/exam sessions while all of its labels are switched on, and unlabeled questions are always used. Toggle state is stored in `localStorage` under `labelFilters`.

## Analytics

Vercel Web Analytics (`@vercel/analytics`) is enabled only for builds running on Vercel (`VERCEL=1`): `vite.config.js` turns that into `import.meta.env.VITE_VERCEL_ANALYTICS` for the SPA (`src/analytics.js`) and adds the `/_vercel/insights/script.js` tag to the rendered rules pages. GitHub Pages and local builds don't load it.

Auto-tracking is disabled because the Vercel script only counts path changes, and screens use hash URLs. Instead `showScreen()` in `src/quiz.js` reports every screen change with `trackPageview()` as `/`, `/study`, `/exam` or `/results`. `stripUrl` (`beforeSend`) drops query strings and hashes from every event.

Dialogs have no URL but are tracked when they open (`DIALOG_PATHS` in `src/router.js`): `/settings`, and `/sign-in` or `/sign-up` for the auth dialog, including each switch between its two modes. Closing a dialog is not tracked.

## Screen URLs

Each screen has a hash URL (`src/router.js`): home has no hash, then `#/study`, `#/exam` and `#/results`. Hash URLs are used because GitHub Pages has no SPA fallback for real paths. A session (study, exam or results) takes one history entry pushed on top of home, so Back always leads home, and leaving a running session through Back asks for the same confirmation as the exit button. Opening `#/study` or `#/exam` directly starts a new session. `#/results` without a finished session, and unknown hashes, fall back to home.
