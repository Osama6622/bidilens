import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanDocumentForPhysicalCss } from '@bidilens/core';

describe('@bidilens/web UI Dogfooding (100% Logical CSS)', () => {
  it('ensures global stylesheet and all Vue SFC <style> blocks contain zero physical directional CSS rules', () => {
    const srcDir = join(__dirname, '..');
    const globalScssPath = join(srcDir, 'styles', 'main.scss');
    expect(
      scanDocumentForPhysicalCss(readFileSync(globalScssPath, 'utf8'), globalScssPath),
    ).toEqual([]);

    const vueFiles = [
      join(srcDir, 'App.vue'),
      ...readdirSync(join(srcDir, 'components'))
        .filter((f) => f.endsWith('.vue'))
        .map((f) => join(srcDir, 'components', f)),
    ];

    for (const filePath of vueFiles) {
      const diagnostics = scanDocumentForPhysicalCss(readFileSync(filePath, 'utf8'), filePath);
      expect(diagnostics, `Physical CSS leaked into ${filePath}`).toEqual([]);
    }
  });
});
