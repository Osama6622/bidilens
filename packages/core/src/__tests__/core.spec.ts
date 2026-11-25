import { describe, expect, it } from 'vitest';
import {
  applyAllFixes,
  applySingleFix,
  auditStylesheet,
  compileSass,
  evaluateDeclarationRule,
  extractVueStyleBlocks,
  fixAllInDocument,
  generateMarkdownReport,
  indentedSassToScss,
  SAMPLE_FIXTURES,
  scanDocumentForPhysicalCss,
  scssToIndentedSass,
  splitCssValueTokens,
} from '../index.js';

describe('@bidilens/core — sassCompiler', () => {
  it('compiles valid SCSS and indented Sass and extracts structured syntax errors', () => {
    const scss = `$gap: 16px;\n.card { margin-left: $gap; }`;
    const okScss = compileSass(scss, 'scss');
    expect(okScss.ok).toBe(true);
    expect(okScss.css).toContain('margin-left: 16px;');

    const sassCode = `$space: 12px\n.nav\n  padding-left: $space`;
    const okSass = compileSass(sassCode, 'sass');
    expect(okSass.ok).toBe(true);
    expect(okSass.css).toContain('padding-left: 12px;');

    const bad = compileSass(`.broken {\n  left: ;\n}`, 'scss');
    expect(bad.ok).toBe(false);
    expect(bad.error?.line).toBe(2);
    expect(bad.error?.column).toBeGreaterThan(0);
  });
});

describe('@bidilens/core — physical-to-logical rule mappings & shorthands', () => {
  it('maps box model, positioning, alignment/float, and corner radii accurately', () => {
    expect(evaluateDeclarationRule('margin-left', '12px')?.replacements).toEqual([
      { property: 'margin-inline-start', value: '12px' },
    ]);
    expect(evaluateDeclarationRule('padding-right', '1rem')?.replacements).toEqual([
      { property: 'padding-inline-end', value: '1rem' },
    ]);
    expect(evaluateDeclarationRule('border-left', '2px solid #000')?.replacements).toEqual([
      { property: 'border-inline-start', value: '2px solid #000' },
    ]);
    expect(evaluateDeclarationRule('left', '0')?.replacements).toEqual([
      { property: 'inset-inline-start', value: '0' },
    ]);
    expect(evaluateDeclarationRule('right', '8px')?.replacements).toEqual([
      { property: 'inset-inline-end', value: '8px' },
    ]);
    expect(evaluateDeclarationRule('text-align', 'left')?.replacements).toEqual([
      { property: 'text-align', value: 'start' },
    ]);
    expect(evaluateDeclarationRule('float', 'right')?.replacements).toEqual([
      { property: 'float', value: 'inline-end' },
    ]);
    expect(evaluateDeclarationRule('clear', 'left')?.replacements).toEqual([
      { property: 'clear', value: 'inline-start' },
    ]);
    expect(evaluateDeclarationRule('border-top-left-radius', '6px')?.replacements).toEqual([
      { property: 'border-start-start-radius', value: '6px' },
    ]);
    expect(evaluateDeclarationRule('border-bottom-right-radius', '14px')?.replacements).toEqual([
      { property: 'border-end-end-radius', value: '14px' },
    ]);
  });

  it('handles asymmetric 4-value shorthands and ignores symmetric shorthands', () => {
    expect(splitCssValueTokens('8px calc(100% - 12px) 8px 4px')).toEqual([
      '8px',
      'calc(100% - 12px)',
      '8px',
      '4px',
    ]);

    expect(evaluateDeclarationRule('margin', '10px 20px 30px 40px')?.replacements).toEqual([
      { property: 'margin-block', value: '10px 30px' },
      { property: 'margin-inline', value: '40px 20px' },
    ]);
    expect(evaluateDeclarationRule('margin', '10px 20px 30px 20px')).toBeNull();
    expect(evaluateDeclarationRule('border-radius', '8px 0 0 8px')?.replacements).toHaveLength(4);
    expect(evaluateDeclarationRule('border-radius', '8px 8px 0 0')).toBeNull();
  });
});

describe('@bidilens/core — ranges, fixes, Vue SFC scanning & Markdown report', () => {
  it('computes exact start/end line and column spans and fixes single or all declarations', () => {
    const scss = `.nav {\n  margin-left: 16px;\n  right: 4px !important;\n}`;
    const res = auditStylesheet(scss, 'scss');
    expect(res.diagnostics).toHaveLength(2);
    expect(res.diagnostics[0].line).toBe(2);
    expect(res.diagnostics[0].column).toBe(3);
    expect(res.diagnostics[0].endLine).toBe(2);
    expect(res.diagnostics[0].endColumn).toBe(21);

    const oneFixed = applySingleFix(scss, res.diagnostics[0].id, 'scss');
    expect(oneFixed).toContain('margin-inline-start: 16px;');
    expect(oneFixed).toContain('right: 4px !important;');

    const allFixed = applyAllFixes(scss, 'scss');
    expect(allFixed).toContain('inset-inline-end: 4px !important;');
    expect(auditStylesheet(allFixed, 'scss').diagnostics).toHaveLength(0);
  });

  it('scans and auto-fixes <style> blocks inside .vue Single-File Components with exact SFC line numbers', () => {
    const vueSfc = [
      '<template>',
      '  <div class="chip">Hello</div>',
      '</template>',
      '',
      '<style scoped lang="scss">',
      '.chip {',
      '  padding-left: 12px;',
      '  text-align: right;',
      '}',
      '</style>',
    ].join('\n');

    const blocks = extractVueStyleBlocks(vueSfc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].syntax).toBe('scss');

    const diags = scanDocumentForPhysicalCss(vueSfc, 'Chip.vue');
    expect(diags).toHaveLength(2);
    expect(diags[0].line).toBe(7);
    expect(diags[0].column).toBe(3);
    expect(diags[1].line).toBe(8);

    const fixedVue = fixAllInDocument(vueSfc, 'Chip.vue');
    expect(fixedVue).toContain('<div class="chip">Hello</div>');
    expect(fixedVue).toContain('padding-inline-start: 12px;');
    expect(fixedVue).toContain('text-align: end;');
    expect(scanDocumentForPhysicalCss(fixedVue, 'Chip.vue')).toHaveLength(0);
  });

  it('validates all 4 built-in fixtures, syntax conversion, and Markdown export', () => {
    expect(SAMPLE_FIXTURES).toHaveLength(4);
    for (const fix of SAMPLE_FIXTURES) {
      const audited = auditStylesheet(fix.scss, 'scss');
      expect(audited.compileResult.ok).toBe(true);
      expect(compileSass(fix.sass, 'sass').ok).toBe(true);
    }

    const roundTrip = indentedSassToScss(scssToIndentedSass('.a {\n  left: 4px;\n}\n'));
    expect(compileSass(roundTrip, 'scss').ok).toBe(true);

    const md = generateMarkdownReport(auditStylesheet('.x { left: 2px; }', 'scss'), {
      fixtureName: 'Demo',
    });
    expect(md).toContain('# BidiLens Logical CSS Audit Report — Demo');
    expect(md).toContain('`inset-inline-start: 2px;`');
  });
});
