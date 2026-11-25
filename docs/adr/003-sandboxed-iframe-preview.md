# ADR 003: Sandboxed Dual-Iframe LTR/RTL Live Preview

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** `packages/web/src/components/BidiPreviewFrame.vue`

## Context & Problem Statement

Rendering user-pasted HTML and compiled CSS directly inside the Vue 3 workbench DOM risks style bleed (`body`, `*`, `.btn` selectors), inaccurate document-root `dir="ltr"` / `dir="rtl"` behavior, and XSS script execution against `window.localStorage`.

## Decision

1. **Opaque-Origin Sandboxed `<iframe sandbox="">` Pair:**
   - Render two synchronized `<iframe sandbox="" :srcdoc="...">` containers side-by-side (`<html lang="en" dir="ltr">` and `<html lang="ar" dir="rtl">`).
   - Leaving `sandbox=""` empty blocks all inline `<script>` execution and isolates origin storage while permitting full HTML/CSS Flexbox, Grid, typography, and RTL layout calculation.

2. **Zero-Layout-Shift Bounding Grid & Non-Destructive Stream Comparison:**
   - The **Bounding Grid** toggle injects `outline: 1px dashed` (rather than `border`) inside `srcdoc` so element dimensions never shift when inspecting box alignment.
   - `@bidilens/web` maintains both `compiledCss` (Original) and `fixedCompiledCss` (Logical-Fixed) concurrently, letting engineers flip between broken and logically mirrored states live before mutating editor code.

## Consequences

- **Positive:** Complete CSS encapsulation, strict XSS isolation, zero layout shift during geometry inspection, and instant reactive comparison.
- **Trade-offs:** User snippets are intentionally evaluated as pure HTML + CSS without JavaScript execution.
