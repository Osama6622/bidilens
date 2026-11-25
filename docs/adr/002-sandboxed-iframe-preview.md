# ADR 002: Sandboxed Dual-Iframe LTR/RTL Live Preview Architecture

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** `src/components/BidiPreviewFrame.vue`

## Context & Problem Statement

Rendering user-authored HTML and compiled CSS directly inside the host Vue 3 DOM introduces three severe failure modes:
1. **Style Bleed:** User selectors such as `body`, `*`, `.btn`, or `nav` can corrupt BidiLens's own workbench chrome, or BidiLens's own CSS reset can distort the component under test.
2. **Direction Isolation:** True browser bidirectional layout (`dir="ltr"` vs. `dir="rtl"`) depends on root document directionality, initial containing block alignment, and scrollbar/viewport calculation.
3. **Security (XSS):** Pasting untrusted HTML snippets with inline `<script>` or event handlers (`onerror`, `onload`) must not execute arbitrary JavaScript in BidiLens's origin (`localStorage` access).

## Decision

1. **Dual Sandboxed `<iframe sandbox>` Containers (`srcdoc`):**
   - Render two synchronized `<iframe sandbox="">` instances side-by-side:
     - Frame A: `<html lang="en" dir="ltr">`
     - Frame B: `<html lang="ar" dir="rtl">`
   - Omit `allow-same-origin` and `allow-scripts` on the `sandbox` attribute! Using `srcdoc` with an empty `sandbox=""` enforces an opaque origin with **zero script execution**, preventing pasted HTML from executing scripts or reading `window.localStorage` while allowing pure HTML + CSS layout, Flexbox/Grid mirroring, Web Fonts, and SVG/emoji rendering.

2. **Viewport Presets & Optional Bounding-Box Overlay via Injected Stylesheet:**
   - Each preview stage wraps the `<iframe>` in a responsive viewport frame supporting `375px` (Mobile), `768px` (Tablet), and `100%` (Desktop).
   - The **Layout Grid / Bounding-Box Overlay** toggle injects a non-intrusive diagnostic `<style data-bidilens-overlay>` rule inside `srcdoc` (subtle 8px background dot-grid + `1px dashed` element outlines that do not alter box dimensions because `outline` takes zero layout space, unlike `border`).

3. **Non-Destructive Original vs. Logical-Fixed Toggle:**
   - Because `useBidiAuditor` maintains both `compiledCss` (Original) and `fixedCompiledCss` (Logical-Fixed) simultaneously, engineers can flip between **Original** and **Logical-Fixed** in real time across both LTR and RTL iframes before committing changes to their source editor.

## Consequences

- **Positive:** Complete CSS and security isolation, faithful root `dir="ltr"` / `dir="rtl"` browser behavior, zero layout shift when toggling bounding-box outlines, and instant reactive updates via `srcdoc`.
- **Trade-offs:** Interactive JS inside user snippets is intentionally disabled inside `sandbox=""` since BidiLens focuses strictly on CSS layout and bidirectional geometry auditing.
