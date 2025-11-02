# Contributing to rustle.dev

Thanks for your interest in contributing! This repo contains the public SDK.

## Getting started
- Node 18+
- Install deps: `npm install`
- Build: `npm run build`
- Test: `npm test`
- Typecheck: `npx tsc --noEmit`

## Branch naming
Create branches as `username/type/short-description`.
- `type` one of: `feature|bug|docs|chore|refactor|test|ci|build|perf|style`
- Example: `alice/feature/add-runtime-cache`

## Commits
Use Conventional Commits:
- `feat(scope): message`
- `fix(scope): message`
- `docs(scope): message`
- `chore(scope): message`

## Pull requests
- Fill PR template
- Ensure CI is green: typecheck, tests, build
- Add tests where applicable
- Keep PRs focused and small

## Releasing
Publishing to npm is automated on merges to `main` (CI checks, environment-protected publish).

## Code of Conduct
Be kind, respectful, and constructive. Report abusive behavior via SECURITY.md.

