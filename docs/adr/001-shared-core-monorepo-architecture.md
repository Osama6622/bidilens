# ADR 001: Shared-Core TypeScript Monorepo Architecture

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** `packages/core`, `packages/web`, `packages/vscode`, `packages/vite-plugin`

## Context & Problem Statement

Catching hardcoded physical CSS (`margin-left`, `left`, `border-top-right-radius`, `text-align: left`) only in one stage of development leaves gaps:
- Engineers prototyping components want a **visual LTR/RTL browser workbench**.
- Engineers writing code in VS Code or Cursor want **instant squiggles and `Cmd+.` Quick Fixes**.
- Teams guarding production branches need **automated dev-server warnings and CI build gates**.

Maintaining separate CSS parsers or rule mappings across a web UI, an editor extension, and a bundler plugin inevitably leads to rule drift and inconsistent auto-fix behavior.

## Decision

Structure BidiLens as an **npm workspaces + TypeScript Project References (`tsc -b`) monorepo** centered around a zero-UI shared engine (`@bidilens/core`):

1. **`packages/core` (`@bidilens/core`):**
   - Pure TypeScript with zero Vue, DOM framework, Node `fs`, or VS Code dependencies.
   - Owns the Dart Sass compiler wrapper, declaration scanner (`.css`, `.scss`, `.sass`, and `.vue` `<style>` SFC blocks), physical-to-logical rule registry, offset-preserving rewriter, Markdown report generator, and built-in sample fixtures.
   - Emits exact 1-based `line`, `column`, `endLine`, `endColumn`, and character `range` coordinates so downstream consumers only adapt coordinates to their host APIs.

2. **Thin Host Adapters:**
   - **`packages/web` (`@bidilens/web`):** Vue 3 + Vite visual workbench consuming `auditStylesheet`, `SAMPLE_FIXTURES`, and `generateMarkdownReport` from `@bidilens/core`.
   - **`packages/vscode` (`bidilens-vscode`):** Maps `@bidilens/core` spans to 0-based `vscode.Range` squiggles and `vscode.WorkspaceEdit` Quick Fixes, bundled via `esbuild` into a standalone CommonJS extension entrypoint.
   - **`packages/vite-plugin` (`vite-plugin-bidilens`):** Hooks into Vite's `enforce: 'pre'` `transform` lifecycle to scan raw `.css`, `.scss`, `.sass`, and `.vue` files before compilation erases source line numbers—and is dogfooded directly inside `packages/web/vite.config.ts`.

## Consequences

- **Positive:** Single source of truth for every CSS logical rule, 100% parity between IDE Quick Fixes, CI build checks, and browser workbench fixes, and fast incremental type-checking via `tsc -b`.
- **Trade-offs:** Requires building `@bidilens/core` prior to downstream package builds (automated via root `npm run build` and `.vscode/tasks.json`).
