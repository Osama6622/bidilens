import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditStylesheet } from '../index';

describe('BidiLens UI Dogfooding (100% Logical CSS)', () => {
  it('ensures BidiLens global stylesheet and Vue component styles contain zero physical directional CSS rules', () => {
    const rootDir = join(__dirname, '..', '..', '..');
    const globalScss = readFileSync(join(rootDir, 'styles', 'main.scss'), 'utf8');
    expect(auditStylesheet(globalScss, 'scss').diagnostics).toEqual([]);

    const vueFiles = [
      join(rootDir, 'App.vue'),
      ...readdirSync(join(rootDir, 'components'))
        .filter((f) => f.endsWith('.vue'))
        .map((f) => join(rootDir, 'components', f)),
    ];

    for (const filePath of vueFiles) {
      const content = readFileSync(filePath, 'utf8');
      const styleBlocks = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];
      for (const match of styleBlocks) {
        const audit = auditStylesheet(match[1], 'scss');
        expect(audit.diagnostics, `Physical CSS rule leaked into ${filePath}`).toEqual([]);
      }
    }
  });
});
