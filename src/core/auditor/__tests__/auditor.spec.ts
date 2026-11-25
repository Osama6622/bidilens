import { describe, expect, it } from 'vitest';
import {
  applyAllFixes,
  applySingleFix,
  auditStylesheet,
  compileSass,
  evaluateDeclarationRule,
  generateMarkdownReport,
  indentedSassToScss,
  scssToIndentedSass,
  splitCssValueTokens,
} from '../index';
import { SAMPLE_FIXTURES } from '../../fixtures';

describe('sassCompiler (compileSass)', () => {
  it('compiles valid SCSS with variables and nested rules', () => {
    const scss = `
      $gap: 16px;
      .card {
        margin-left: $gap;
        .title {
          text-align: left;
        }
      }
    `;
    const result = compileSass(scss, 'scss');
    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(result.css).toContain('margin-left: 16px;');
    expect(result.css).toContain('.card .title');
  });

  it('compiles valid indented .sass syntax without braces or semicolons', () => {
    const sassCode = [
      '$space: 12px',
      '.nav',
      '  padding-left: $space',
      '  .item',
      '    float: right',
    ].join('\n');

    const result = compileSass(sassCode, 'sass');
    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(result.css).toContain('padding-left: 12px;');
    expect(result.css).toContain('float: right;');
  });

  it('surfaces structured line and column info on invalid SCSS syntax', () => {
    const brokenScss = `.card {\n  margin-left: ;\n}`;
    const result = compileSass(brokenScss, 'scss');
    expect(result.ok).toBe(false);
    expect(result.css).toBe('');
    expect(result.error).not.toBeNull();
    expect(result.error?.line).toBe(2);
    expect(result.error?.column).toBeGreaterThan(0);
    expect(result.error?.message.length).toBeGreaterThan(0);
  });

  it('returns empty css cleanly for whitespace-only input', () => {
    const result = compileSass('   \n  ', 'scss');
    expect(result.ok).toBe(true);
    expect(result.css).toBe('');
  });
});

describe('rules (evaluateDeclarationRule & splitCssValueTokens)', () => {
  it('maps box-model physical margins, paddings, and borders to logical properties', () => {
    expect(evaluateDeclarationRule('margin-left', '16px')?.replacements).toEqual([
      { property: 'margin-inline-start', value: '16px' },
    ]);
    expect(evaluateDeclarationRule('margin-right', 'auto')?.replacements).toEqual([
      { property: 'margin-inline-end', value: 'auto' },
    ]);
    expect(evaluateDeclarationRule('padding-left', '1.5rem')?.replacements).toEqual([
      { property: 'padding-inline-start', value: '1.5rem' },
    ]);
    expect(evaluateDeclarationRule('padding-right', '$space-sm')?.replacements).toEqual([
      { property: 'padding-inline-end', value: '$space-sm' },
    ]);
    expect(evaluateDeclarationRule('border-left', '3px solid #2563eb')?.replacements).toEqual([
      { property: 'border-inline-start', value: '3px solid #2563eb' },
    ]);
    expect(evaluateDeclarationRule('border-right', '1px dashed #ccc')?.replacements).toEqual([
      { property: 'border-inline-end', value: '1px dashed #ccc' },
    ]);
  });

  it('maps physical left/right positioning to inset-inline-start/end', () => {
    expect(evaluateDeclarationRule('left', '12px')?.replacements).toEqual([
      { property: 'inset-inline-start', value: '12px' },
    ]);
    expect(evaluateDeclarationRule('right', '0')?.replacements).toEqual([
      { property: 'inset-inline-end', value: '0' },
    ]);
  });

  it('maps directional values for text-align, float, and clear while ignoring neutral values', () => {
    expect(evaluateDeclarationRule('text-align', 'left')?.replacements).toEqual([
      { property: 'text-align', value: 'start' },
    ]);
    expect(evaluateDeclarationRule('text-align', 'right')?.replacements).toEqual([
      { property: 'text-align', value: 'end' },
    ]);
    expect(evaluateDeclarationRule('text-align', 'center')).toBeNull();

    expect(evaluateDeclarationRule('float', 'left')?.replacements).toEqual([
      { property: 'float', value: 'inline-start' },
    ]);
    expect(evaluateDeclarationRule('float', 'right')?.replacements).toEqual([
      { property: 'float', value: 'inline-end' },
    ]);
    expect(evaluateDeclarationRule('float', 'none')).toBeNull();

    expect(evaluateDeclarationRule('clear', 'left')?.replacements).toEqual([
      { property: 'clear', value: 'inline-start' },
    ]);
    expect(evaluateDeclarationRule('clear', 'right')?.replacements).toEqual([
      { property: 'clear', value: 'inline-end' },
    ]);
    expect(evaluateDeclarationRule('clear', 'both')).toBeNull();
  });

  it('maps all four physical corner-radius properties to logical start/end equivalents', () => {
    expect(evaluateDeclarationRule('border-top-left-radius', '8px')?.replacements).toEqual([
      { property: 'border-start-start-radius', value: '8px' },
    ]);
    expect(evaluateDeclarationRule('border-top-right-radius', '12px')?.replacements).toEqual([
      { property: 'border-start-end-radius', value: '12px' },
    ]);
    expect(evaluateDeclarationRule('border-bottom-left-radius', '4px')?.replacements).toEqual([
      { property: 'border-end-start-radius', value: '4px' },
    ]);
    expect(evaluateDeclarationRule('border-bottom-right-radius', '16px')?.replacements).toEqual([
      { property: 'border-end-end-radius', value: '16px' },
    ]);
  });

  it('splits asymmetric 4-value shorthands into logical block and inline pairs, preserving calc()', () => {
    const tokens = splitCssValueTokens('10px calc(100% - 20px) 14px 8px');
    expect(tokens).toEqual(['10px', 'calc(100% - 20px)', '14px', '8px']);

    // Asymmetric: top=10px, right=20px, bottom=30px, left=40px => block: 10px 30px, inline: 40px 20px
    const marginMatch = evaluateDeclarationRule('margin', '10px 20px 30px 40px');
    expect(marginMatch?.category).toBe('shorthand');
    expect(marginMatch?.replacements).toEqual([
      { property: 'margin-block', value: '10px 30px' },
      { property: 'margin-inline', value: '40px 20px' },
    ]);

    // Equal top/bottom collapses block value cleanly: padding: 12px 16px 12px 28px
    const paddingMatch = evaluateDeclarationRule('padding', '12px 16px 12px 28px');
    expect(paddingMatch?.replacements).toEqual([
      { property: 'padding-block', value: '12px' },
      { property: 'padding-inline', value: '28px 16px' },
    ]);

    // Symmetric left === right does NOT trigger a false positive
    expect(evaluateDeclarationRule('margin', '10px 20px 30px 20px')).toBeNull();
    expect(evaluateDeclarationRule('padding', '12px 24px')).toBeNull();
  });

  it('expands horizontally asymmetric border-radius shorthand and ignores symmetric radius', () => {
    const asymmetric = evaluateDeclarationRule('border-radius', '8px 0 0 8px');
    expect(asymmetric?.replacements).toEqual([
      { property: 'border-start-start-radius', value: '8px' },
      { property: 'border-start-end-radius', value: '0' },
      { property: 'border-end-end-radius', value: '0' },
      { property: 'border-end-start-radius', value: '8px' },
    ]);

    // Horizontally symmetric (top-left === top-right && bottom-left === bottom-right)
    expect(evaluateDeclarationRule('border-radius', '12px 12px 0 0')).toBeNull();
    expect(evaluateDeclarationRule('border-radius', '10px')).toBeNull();
  });
});

describe('transformer (auditStylesheet, applySingleFix, applyAllFixes)', () => {
  it('audits SCSS, preserves $variables and !important, and ignores comments & Sass variable definitions', () => {
    const scss = [
      '$offset-left: 20px;',
      '// margin-left: 999px;',
      '/* padding-right: 999px; */',
      '.drawer {',
      '  left: $offset-left !important;',
      '  a:hover {',
      '    margin-right: 8px;',
      '  }',
      '}',
    ].join('\n');

    const audit = auditStylesheet(scss, 'scss');
    expect(audit.compileResult.ok).toBe(true);
    expect(audit.diagnostics).toHaveLength(2);
    expect(audit.diagnostics[0].selector).toBe('.drawer');
    expect(audit.diagnostics[0].suggestedDeclaration).toBe(
      'inset-inline-start: $offset-left !important;',
    );
    expect(audit.diagnostics[1].selector).toBe('.drawer a:hover');
    expect(audit.diagnostics[1].suggestedDeclaration).toBe('margin-inline-end: 8px;');

    const fixed = applyAllFixes(scss, 'scss');
    expect(fixed).toContain('$offset-left: 20px;');
    expect(fixed).toContain('inset-inline-start: $offset-left !important;');
    expect(fixed).toContain('margin-inline-end: 8px;');

    const reAudit = auditStylesheet(fixed, 'scss');
    expect(reAudit.compileResult.ok).toBe(true);
    expect(reAudit.diagnostics).toHaveLength(0);
    expect(reAudit.summary.bidiScore).toBe(100);
  });

  it('applies single fix by ID without altering other diagnostics', () => {
    const scss = `.box {\n  margin-left: 10px;\n  padding-right: 20px;\n}`;
    const initial = auditStylesheet(scss, 'scss');
    expect(initial.diagnostics).toHaveLength(2);

    const updated = applySingleFix(scss, initial.diagnostics[0].id, 'scss');
    expect(updated).toContain('margin-inline-start: 10px;');
    expect(updated).toContain('padding-right: 20px;');
  });

  it('audits and auto-fixes indented .sass syntax while preserving indentation and omitting semicolons', () => {
    const sassCode = [
      '$pad: 18px',
      '.panel',
      '  padding: 10px 14px 10px 26px',
      '  .badge',
      '    right: $pad',
      '    text-align: right',
    ].join('\n');

    const audit = auditStylesheet(sassCode, 'sass');
    expect(audit.compileResult.ok).toBe(true);
    expect(audit.diagnostics).toHaveLength(3);

    const fixedSass = applyAllFixes(sassCode, 'sass');
    expect(fixedSass).not.toContain(';');
    expect(fixedSass).toContain('  padding-block: 10px\n  padding-inline: 26px 14px');
    expect(fixedSass).toContain('    inset-inline-end: $pad');
    expect(fixedSass).toContain('    text-align: end');

    const verifyFixed = auditStylesheet(fixedSass, 'sass');
    expect(verifyFixed.compileResult.ok).toBe(true);
    expect(verifyFixed.diagnostics).toHaveLength(0);
  });

  it('verifies all 4 built-in Sample Fixtures compile cleanly in both .scss and .sass modes', () => {
    expect(SAMPLE_FIXTURES).toHaveLength(4);

    for (const fixture of SAMPLE_FIXTURES) {
      const scssAudit = auditStylesheet(fixture.scss, 'scss');
      expect(scssAudit.compileResult.ok).toBe(true);

      const sassAudit = auditStylesheet(fixture.sass, 'sass');
      expect(sassAudit.compileResult.ok).toBe(true);

      if (fixture.id === 'clean-logical') {
        expect(scssAudit.diagnostics).toHaveLength(0);
        expect(sassAudit.diagnostics).toHaveLength(0);
        expect(scssAudit.summary.bidiScore).toBe(100);
      } else {
        expect(scssAudit.diagnostics.length).toBeGreaterThan(0);
        // Auto-fixed version of every broken fixture must compile cleanly with 0 remaining issues
        const afterFix = auditStylesheet(scssAudit.fixedSource, 'scss');
        expect(afterFix.compileResult.ok).toBe(true);
        expect(afterFix.diagnostics).toHaveLength(0);
      }
    }
  });
});

describe('syntaxConverter & reportGenerator', () => {
  it('converts SCSS to indented Sass and back into valid compilable SCSS', () => {
    const scss = `.header {\n  margin-left: 12px;\n  .logo {\n    float: left;\n  }\n}\n`;
    const sassSyntax = scssToIndentedSass(scss);
    expect(compileSass(sassSyntax, 'sass').ok).toBe(true);

    const roundTripScss = indentedSassToScss(sassSyntax);
    expect(compileSass(roundTripScss, 'scss').ok).toBe(true);
  });

  it('generates a complete Markdown report with summary, diagnostic table, and fixed code block', () => {
    const scss = `.alert {\n  border-left: 4px solid red;\n  text-align: left;\n}`;
    const result = auditStylesheet(scss, 'scss');
    const report = generateMarkdownReport(result, {
      fixtureName: 'Alert Widget',
      generatedAt: '2026-11-25T12:00:00.000Z',
    });

    expect(report).toContain('# BidiLens Logical CSS Audit Report — Alert Widget');
    expect(report).toContain('2026-11-25T12:00:00.000Z');
    expect(report).toContain('**Physical Direction Issues:** **2**');
    expect(report).toContain('`border-inline-start: 4px solid red;`');
    expect(report).toContain('`text-align: start;`');
    expect(report).toContain('```scss');
  });
});
