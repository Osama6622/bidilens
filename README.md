# BidiLens

**See and enforce your CSS in both directions (LTR & RTL).**

BidiLens detects hardcoded physical CSS properties (`margin-left`, `padding-right`, `left`, `right`, `border-left`, `text-align: left`, directional `border-radius`, and asymmetric 4-value shorthands) and converts them to CSS Logical Properties—across the browser, your editor, and your Vite build.

---

## 1. Web Workbench (Live LTR / RTL Studio)

Use BidiLens directly in your browser—no installation required.

1. Open the deployed **BidiLens Web Workbench**.
2. Paste your component's **HTML** and **`.scss` / `.sass`** styles (or click one of the 4 built-in **Sample Fixtures** to test immediately).
3. Inspect the synchronized side-by-side **`dir="ltr"`** and **`dir="rtl"`** previews:
   - Switch between **Original CSS** and **Logical-Fixed Preview** to compare layouts live.
   - Toggle **Bounding Grid** to spot spacing or alignment collisions.
   - Test responsive breakpoints with **Mobile `375px`**, **Tablet `768px`**, and **Desktop `100%`**.
4. Fix issues individually (**Fix Issue**) or rewrite the entire stylesheet in one step (**Auto-Fix All**), then click **Copy Fixed Output** or **Export Report (`.md`)**.

**Keyboard Shortcuts**
- `Cmd + Enter` / `Ctrl + Enter` — Compile Sass & run audit
- `Cmd + Shift + F` / `Ctrl + Shift + F` — Auto-fix all physical CSS to logical CSS

---

## 2. VS Code & Cursor Extension

Get real-time warning squiggles and one-click Quick Fixes in `.css`, `.scss`, `.sass`, and `.vue` `<style>` blocks.

### Install
- **VS Code / Cursor Marketplace:** Search for **BidiLens** in the Extensions panel and click **Install**.
- **From `.vsix` (GitHub Releases):**
  ```bash
  code --install-extension bidilens-vscode.vsix
  # or in Cursor:
  cursor --install-extension bidilens-vscode.vsix
  ```

### Use
1. Open any `.css`, `.scss`, `.sass`, or `.vue` file. Physical directional rules are underlined automatically.
2. Place your cursor on a warning and press **`Cmd + .`** (macOS) or **`Ctrl + .`** (Windows/Linux):
   - **Convert to logical CSS property** — fixes the current line.
   - **Fix all physical CSS in file** — converts every physical rule in the file at once.
3. You can also run **`BidiLens: Fix All Physical CSS in File`** from the Command Palette (`Cmd/Ctrl + Shift + P`).

### Optional Settings
```json
{
  "bidilens.enable": true,
  "bidilens.severity": "Warning" // "Warning" | "Information" | "Error"
}
```

---

## 3. Vite Plugin (`vite-plugin-bidilens`)

Catch physical CSS regressions automatically during `vite dev` and fail CI builds on `vite build`.

### Install
```bash
npm install -D vite-plugin-bidilens
```

### Configure (`vite.config.ts`)
```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { bidilensPlugin } from 'vite-plugin-bidilens';

export default defineConfig({
  plugins: [
    bidilensPlugin({
      failOnError: process.env.CI === 'true', // Warn in dev, fail in CI
      include: ['src/**/*.{css,scss,sass,vue}'],
      exclude: ['**/node_modules/**', '**/legacy/**'],
    }),
    vue(),
  ],
});
```

---

## 4. Programmatic API (`@bidilens/core`)

Use the pure TypeScript engine directly in custom scripts, linters, or CI tools.

### Install
```bash
npm install @bidilens/core
```

### Usage
```ts
import { auditStylesheet, applyAllFixes, generateMarkdownReport } from '@bidilens/core';

const scss = `
.card {
  margin-left: 16px;
  padding: 12px 16px 12px 24px;
  text-align: left;
}
`;

const result = auditStylesheet(scss, 'scss');
console.log(result.summary.bidiScore); // Bidi readiness percentage
console.log(result.diagnostics);       // Line/column spans & logical suggestions

const fixedScss = applyAllFixes(scss, 'scss');
const markdown = generateMarkdownReport(result);
```

---

## Supported Physical → Logical Mappings

| Category | Physical CSS | Logical CSS |
| :--- | :--- | :--- |
| **Box Model** | `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| **Box Model** | `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| **Box Model** | `border-left` / `border-right` (+ `-width` / `-style` / `-color`) | `border-inline-start` / `border-inline-end` (+ sub-properties) |
| **Positioning** | `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| **Alignment & Float** | `text-align: left/right`, `float: left/right`, `clear: left/right` | `start/end`, `inline-start/inline-end` |
| **Corner Radii** | `border-top-left-radius`, `border-top-right-radius`, `border-bottom-left-radius`, `border-bottom-right-radius` | `border-start-start-radius`, `border-start-end-radius`, `border-end-start-radius`, `border-end-end-radius` |
| **Asymmetric Shorthands** | 4-value `margin` / `padding` / `inset` / `border-*` (`right !== left`), asymmetric `border-radius` | `*-block` + `*-inline` / logical corner radii |
