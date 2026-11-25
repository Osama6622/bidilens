# BidiLens

**See your CSS in both directions.**

BidiLens is a local-first developer workbench for auditing, fixing, and previewing bidirectional (`LTR` / `RTL`) web layouts. Built with **Vue 3 (`<script setup lang="ts">`)**, **TypeScript**, **Vite**, and **Sass**, it compiles SCSS/Sass in the browser, flags physical directional rules (`margin-left`, `padding-right`, `left`/`right`, `text-align: left`, directional border radii), rewrites them to CSS logical properties, and renders synchronized `LTR` and `RTL` live previews side-by-side.

> **Live Demo:** `https://bidilens.dev` _(replace with your deployment URL)_

---

## Why BidiLens?

Building bilingual (`LTR` / `RTL`) interfaces often breaks down over small, repetitive layout bugs:

- Hardcoded physical spacing and positioning (`margin-left`, `padding-right`, `left`, `right`) that fail to flip when `dir="rtl"` is applied.
- Asymmetric shorthands and directional border radii (`border-top-left-radius`, `border-bottom-right-radius`) that cause subtle visual drift.
- Switching back and forth between tabs, inspect panels, and test snippets just to verify how a component behaves in both directions.

BidiLens keeps everything **local-first in the browser**—no backend, no sign-up, and instant feedback on real HTML + SCSS/Sass snippets.

---

## Key Features

- **Sass Compilation & Logical CSS Auditor (`src/core/auditor/`):**
  - Compiles `.scss` and `.sass` syntax in the browser using `sass` (`compileString`) with clear error reporting on syntax issues.
  - Detects physical box-model properties (`margin-left/right`, `padding-left/right`, `border-left/right`), positioning (`left`, `right`), alignment/floats (`text-align: left/right`, `float: left/right`, `clear: left/right`), and corner radii (`border-top-left-radius`, etc.).
  - Supports **one-click single fixes**, **Auto-Fix All**, **Copy Fixed Output**, and **Markdown Audit Report export** for PR reviews.
- **Synchronized Side-by-Side LTR & RTL Live Preview:**
  - Renders HTML + compiled styles inside sandboxed `<iframe>` containers locked to
