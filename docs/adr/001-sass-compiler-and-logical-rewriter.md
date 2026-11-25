# ADR 001: Browser-Native Dart Sass Compilation & Offset-Preserving Logical CSS Rewriter

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** `src/core/auditor/`

## Context & Problem Statement

Frontend teams shipping bilingual (English LTR + Arabic/Hebrew RTL) products spend disproportionate engineering hours hunting hardcoded physical CSS declarations (`margin-left`, `padding-right`, `left`, `border-top-right-radius`, `text-align: left`, asymmetric 4-value `padding`/`margin` shorthands).

BidiLens requires an instant, zero-backend auditing and transformation engine capable of:
1. Compiling both `.scss` and indented `.sass` syntax directly in the browser with faithful error reporting (1-based line, column, message).
2. Detecting physical directional CSS properties, directional values, and asymmetric 4-value shorthands.
3. Applying deterministic single-rule and full-stylesheet auto-fixes **without destroying Sass variables (`$space-md`), nesting (`&__icon`), comments, `!important` flags, or `.sass` indentation**.

## Decision

1. **Decoupled Pure-TypeScript Auditor Core (`src/core/auditor/`):**
   - Zero Vue dependencies inside `src/core/auditor/`. Every module (`sassCompiler.ts`, `parser.ts`, `rules.ts`, `transformer.ts`, `reportGenerator.ts`) is pure TypeScript, making it trivially testable in Vitest and reusable in CLI or CI pipelines.

2. **Dart Sass (`sass.compileString`) Compiler Wrapper:**
   - Use official Dart Sass (`sass`) browser-compatible `compileString(source, { syntax: mode === 'sass' ? 'indented' : 'scss' })`.
   - Normalize Dart Sass's 0-based `span.start.line` / `span.start.column` into 1-based editor coordinates so syntax errors highlight exact editor lines.

3. **Dual-Layer Source + Compiled Auditing & Offset-Preserving Rewriting:**
   - Why not rewrite only compiled CSS? Rewriting compiled CSS loses `$variables`, `@media` nesting, and `.sass` indentation when the engineer copies fixed code back into their codebase.
   - Instead, `parser.ts` scans `.scss` and `.sass` declarations with exact `[start, end)` character spans while skipping comments (`//`, `/* */`), string literals, Sass variable assignments (`$offset-left: 12px`), and selector colons (`a:hover`).
   - `transformer.ts` applies replacements in **descending character-offset order** so multi-line expansions never invalidate earlier spans.
   - For asymmetric 4-value shorthands (`padding: T R B L` where `R !== L`), BidiLens expands into universally supported `padding-block: T B; padding-inline: L R;` (since CSS `logical` shorthand keywords lack cross-browser support, whereas `*-block` and `*-inline` have baseline browser support). Symmetric shorthands (`R === L`) are intentionally ignored to avoid false positives.
   - Finally, `transformCssToLogical` also runs over the compiled CSS output so dynamic declarations emitted by Sass loops/mixins still mirror accurately in the live preview.

## Consequences

- **Positive:** Preserves author intent (`$variables`, nesting, comments, `.scss`/`.sass` formatting), achieves sub-10ms feedback in browser, and produces 100% browser-supported CSS Logical Properties.
- **Trade-offs:** Complex dynamic property interpolation (`margin-#{$side}`) cannot be statically rewritten at the Sass variable site, so it is flagged from compiled CSS output while literal declarations are auto-fixable in source.
