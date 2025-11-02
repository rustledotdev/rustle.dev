# Changelog

All notable changes to this project will be documented in this file.

## 1.0.1 - 2025-11-02

- docs: improved README (Contributing, Support, FAQ)
- ci: fix publish gating and step-level conditions; remove duplicate if; visible publish job
- types: add @babel/core, @types/babel__core, @types/babel__traverse, next; remove temporary shims


## 1.0.0

Initial public release of rustle.dev SDK

Highlights:
- Zero-refactor extraction for React/Next.js (JSX/TSX)
- Build-time engine with master.json + per-locale dictionaries
- Persistent translation cache (CI/dev/build)
- Git-aware CLI (rustle-engine) with --blame, --cleanup, JSON/Markdown reports
- Production guardrails (HTTPS, Authorization header, apiKey requirement)
- Next.js and Vite plugins with dev-mode translation and locale cleanup
- Troubleshooting docs and public README

