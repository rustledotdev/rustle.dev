# rustle.dev

AI-powered translation SDK for React & Next.js with zero-refactor extraction, master.json + per-locale dictionaries, and a small runtime provider.

## Why rustle.dev
- Zero-refactor: scan JSX/TSX and auto-extract strings
- Fast runtime: per-locale JSON dictionaries, fallback to source from master.json
- Works in dev and build: translate on startup/HMR (Vite) and during build
- Safe for teams: persistent cache across runs, content-hash dedupe
- CI-friendly: git-aware CLI with blame/cleanup/reporting

## Quickstart
1. Install:
   - `npm i rustle.dev`
2. Create `rustle.config.json` at your app root:
   ```json
   { "sourceLanguage": "en", "targetLanguages": ["es","fr"], "apiUrl": "http://localhost:3001/api", "apiKey": "test-api-key" }
   ```
3. React (Vite):
   - vite.config.ts
     ```ts
     import rustlePlugin from 'rustle.dev/vite';
     export default { plugins: [rustlePlugin()] };
     ```
4. Next.js (App Router):
   - next.config.ts
     ```ts
     import { withRustle } from 'rustle.dev/next';
     export default withRustle({});
     ```
5. Runtime:
   ```tsx
   import { RustleBox } from 'rustle.dev';
   <RustleBox initialLocale="en"><App/></RustleBox>
   ```

## CLI (CI/CD)
- `rustle-engine check --changed-only --report markdown`
- `rustle-engine check --src "src/**/*.{ts,tsx},app/**/*" --output ./public/rustle --write`

Note: `rustle-ci` alias prints a deprecation notice. Please update to `rustle-engine`.

## Dev/Build Outputs
- `public/rustle/master.json` (metadata + all locales)
- `public/rustle/locales/<locale>.json` (per-locale dictionary)
- Target locale entries are empty strings when missing; runtime falls back to source.


## Use cases
- Translate product UI without refactors (scan JSX/TSX)
- Ship MVPs fast: dev-mode translations + runtime fallback to source
- Keep repos clean: persistent cache and locale cleanup in CI/build
- Audit changes: blame authors and generate JSON/Markdown reports
- Enforce prod guardrails: HTTPS-only and apiKey presence checks

## Security & Production Guardrails
- In production, use HTTPS API URLs. If `RUSTLE_STRICT_HTTPS=1`, non-HTTPS (non-localhost) will fail the build.
- In production, translation requests require `apiKey`; Authorization header is sent.

## Docs & Links
- Developer guide: AI-docs/rustle-dev.md (in repo)
- npm: https://www.npmjs.com/package/rustle.dev
- GitHub: https://github.com/rustledotdev/rustle.dev

## License
Apache-2.0 for the SDK. Hosted backend is proprietary under separate Terms of Service.
