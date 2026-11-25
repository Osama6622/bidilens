# BidiLens — Logical CSS & RTL Linter

Real-time warning squiggles and one-click **Quick Fixes (`Cmd+.` / `Ctrl+.`)** for hardcoded physical directional CSS (`margin-left`, `padding-right`, `left`, `right`, `border-left`, `text-align: left`, corner radii, and asymmetric 4-value shorthands) across `.css`, `.scss`, `.sass`, and `.vue` `<style>` blocks.

## Features
- Live diagnostics pinpointing exact declarations with RTL impact explanations.
- **Quick Fix (Single Rule):** `Convert to logical CSS property (...)`.
- **Quick Fix (Entire File):** `Fix all physical CSS in file` (also supports `source.fixAll` on save).
- Command Palette action: **`BidiLens: Fix All Physical CSS in File`**.

## Settings
- `bidilens.enable` (`boolean`, default `true`)
- `bidilens.severity` (`"Warning" | "Information" | "Error"`, default `"Warning"`)
