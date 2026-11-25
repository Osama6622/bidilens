# BidiLens — Bidirectional CSS & Sass Logical Workbench

> **See your CSS in both directions.** An instant, zero-backend daily developer workbench for compiling `.scss` / `.sass` in-browser, auditing hardcoded physical directional CSS rules, one-click logical property rewriting, and side-by-side LTR vs. RTL verification.

---

## Why BidiLens?

Frontend engineers building bilingual (**English LTR + Arabic/Hebrew RTL**) products lose hours hunting layout regressions caused by physical directional CSS (`margin-left`, `padding-right`, `left`, `border-left`, `text-align: left`, asymmetric 4-value shorthands, and physical corner radii).

**BidiLens** eliminates that feedback loop in a single local-first browser workbench:
1. Paste **HTML + SCSS or indented `.sass`** (or pick one of 4 one-click **Sample Fixtures**).
2. Compile in real time using **Dart Sass (`sass.compileString`)** with exact line/column syntax diagnostics.
3. Inspect physical directional rules with RTL impact explanations and apply **single-rule** or **full-stylesheet** logical CSS fixes while preserving `$variables`, nesting, comments, and `!important`.
4. Compare **LTR (`dir="ltr"`)** and **RTL (`dir="rtl"`)** rendering side-by-side inside isolated `<iframe sandbox="">` containers, toggling **Original vs. Logical-Fixed** CSS and a **Bounding-Box Grid Overlay** live.

---

## Architecture Overview

```text
src/
├── core/
│   ├── auditor/                 # Pure TypeScript engine (zero Vue dependencies)
│   │   ├── types.ts             # Diagnostics, compiler, and report contracts
│   │   ├── sassCompiler.ts      # Dart Sass compileString wrapper + 1-based error spans
│   │   ├── parser.ts            # Offset-preserving SCSS & indented .sass declaration scanner
│   │   ├── rules.ts             # Physical -> CSS Logical Property & 4-value shorthand registry
│   │   ├── transformer.ts       # Single/all auto-fixer + Bidi Readiness Score calculator
│   │   ├── syntaxConverter.ts   # Bidirectional .scss <-> .sass converter
│   │   └── reportGenerator.ts   # Markdown audit report exporter
│   └── fixtures/                # 4 built-in sample HTML + SCSS/Sass test cases
├── composables/
│   ├── useBidiAuditor.ts        # Reactive workspace state, compilation, and actions
│   ├── useLocalStorage.ts       # Resilient JSON localStorage synchronization
│   └── useKeyboardShortcuts.ts  # Global workbench keyboard bindings
└── components/
    ├── ToolbarHeader.vue        # Fixture selector, Bidi Score, primary actions & UI LTR/RTL switch
    ├── CodeEditorPane.vue       # Split CodeMirror 6 HTML + SCSS/Sass editors & error banner
    ├── BidiPreviewFrame.vue     # Dual sandboxed LTR/RTL iframes, viewports & bounding grid
    └── AuditDiagnosticsList.vue # Filterable diff diagnostics & one-click single-rule fixes
```

### Architecture Decision Records
- [ADR 001: Browser-Native Dart Sass Compilation & Offset-Preserving Logical CSS Rewriter](./docs/adr/001-sass-compiler-and-logical-rewriter.md)
- [ADR 002: Sandboxed Dual-Iframe LTR/RTL Live Preview Architecture](./docs/adr/002-sandboxed-iframe-preview.md)

---

## Supported Physical-to-Logical Mappings

| Category | Physical Input | Logical Output |
| :--- | :--- | :--- |
| **Box Model** | `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| **Box Model** | `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| **Box Model** | `border-left` / `border-right` (+ `-width`/`-style`/`-color`) | `border-inline-start` / `border-inline-end` (+ sub-properties) |
| **Positioning** | `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| **Alignment & Float** | `text-align: left/right`, `float: left/right`, `clear: left/right` | `start/end`, `inline-start/inline-end` |
| **Corner Radii** | `border-top-left-radius`, `border-top-right-radius`, `border-bottom-left-radius`, `border-bottom-right-radius` | `border-start-start-radius`, `border-start-end-radius`, `border-end-start-radius`, `border-end-end-radius` |
| **Asymmetric Shorthands** | `margin: T R B L` / `padding: T R B L` / `inset: T R B L` (when `R !== L`) | `*-block: T B` + `*-inline: L R` |

> **Dogfooded Logical UI:** BidiLens's own interface is styled exclusively with CSS Logical Properties and verified by automated Vitest checks (`dogfood.spec.ts`). Toggle **UI: LTR ⇄ RTL** in the top header to mirror the entire workbench.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd + Enter` / `Ctrl + Enter` | Compile Sass & Run Logical CSS Audit |
| `Cmd + Shift + F` / `Ctrl + Shift + F` | Auto-Fix All Physical Rules to Logical CSS |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run Vitest unit & dogfood test suites
npm test

# Type-check & build production bundle
npm run build
```
