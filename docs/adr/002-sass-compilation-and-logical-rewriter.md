# ADR 002: Browser-Compatible Dart Sass Compilation & Offset-Preserving Logical Rewriter

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** `packages/core/src/`

## Context & Problem Statement

BidiLens must both compile `.scss` / indented `.sass` into valid CSS for live rendering **and** rewrite physical directional rules back into author source code without stripping `$variables`, nested `&` selectors, comments, `!important` flags, or `.sass` indentation.

## Decision

1. **Dual-Path Engine (`scanStylesheetDeclarations` + `compileSass`):**
   - **Static Declaration Scanner (`parser.ts` + `transformer.ts`):** Scans `.css`, `.scss`, `.sass`, and `.vue` `<style>` blocks in sub-millisecond time while ignoring `//` and `/* */` comments, string literals, selector pseudo-classes (`a:hover`), and Sass variable definitions (`$offset-left: 16px`). Used directly by `bidilens-vscode` and `vite-plugin-bidilens` for near-zero latency linting.
   - **Dart Sass Compiler (`sassCompiler.ts`):** Uses `sass.compileString` (`syntax: 'scss' | 'indented'`) in `@bidilens/web` to render compiled CSS and surface 1-based syntax error spans.

2. **Reverse-Offset Source Rewriting & Universal Logical Shorthand Expansion:**
   - Auto-fixes sort diagnostics in descending character-offset order (`b.range.start - a.range.start`) so multi-line replacements never shift earlier character spans.
   - Asymmetric 4-value shorthands (`padding: T R B L` where `R !== L`) expand into baseline cross-browser `padding-block: T B; padding-inline: L R;` (since the CSS `logical` shorthand keyword is not supported across browsers), while symmetric shorthands (`R === L`) are intentionally skipped to prevent false positives.

## Consequences

- **Positive:** Sub-millisecond IDE feedback, preserved Sass authoring idioms, and 100% browser-compatible logical CSS output.
- **Trade-offs:** Dynamic property interpolation (`margin-#{$side}`) cannot be rewritten statically at the variable site and is caught instead on the compiled CSS pass inside the web workbench.
