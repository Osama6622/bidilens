import type { AuditCategory, AuditResult } from './types';

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  'box-model': 'Box Model (`margin` / `padding` / `border`)',
  positioning: 'Positioning (`left` / `right`)',
  'alignment-float': 'Alignment & Float (`text-align` / `float` / `clear`)',
  'corner-radius': 'Corner Radii (`border-*-radius`)',
  shorthand: 'Directional Shorthands (4-value asymmetric)',
};

export interface ReportOptions {
  fixtureName?: string;
  generatedAt?: string;
}

/**
 * Generates a structured, copy-ready Markdown audit report summarizing Bidi readiness,
 * line-by-line physical-to-logical diagnostics, and the auto-fixed stylesheet.
 */
export function generateMarkdownReport(
  result: AuditResult,
  options: ReportOptions = {},
): string {
  const timestamp = options.generatedAt ?? new Date().toISOString();
  const titleSuffix = options.fixtureName ? ` — ${options.fixtureName}` : '';
  const lines: string[] = [];

  lines.push(`# BidiLens Logical CSS Audit Report${titleSuffix}`);
  lines.push('');
  lines.push(`- **Generated:** ${timestamp}`);
  lines.push(`- **Syntax Mode:** \`.${result.syntax}\``);
  lines.push(
    `- **Compiler Status:** ${result.compileResult.ok ? 'Compiled Successfully' : 'Compilation Failed'}`,
  );
  lines.push(`- **Bidi Readiness Score:** **${result.summary.bidiScore}%**`);
  lines.push(`- **Physical Direction Issues:** **${result.summary.totalIssues}**`);
  lines.push('');

  if (!result.compileResult.ok && result.compileResult.error) {
    lines.push('## Sass Compiler Error');
    lines.push('');
    const loc = result.compileResult.error.line
      ? ` (Line ${result.compileResult.error.line}, Col ${result.compileResult.error.column ?? 1})`
      : '';
    lines.push(`> **Error${loc}:** ${result.compileResult.error.message}`);
    lines.push('');
  }

  lines.push('## Summary by Category');
  lines.push('');
  lines.push('| Category | Issues |');
  lines.push('| :--- | ---: |');
  (Object.keys(CATEGORY_LABELS) as AuditCategory[]).forEach((cat) => {
    lines.push(`| ${CATEGORY_LABELS[cat]} | ${result.summary.byCategory[cat]} |`);
  });
  lines.push('');

  if (result.diagnostics.length === 0) {
    lines.push('## Diagnostics');
    lines.push('');
    lines.push('No physical directional CSS issues detected. Component is **100% Bidi-Ready** for LTR and RTL.');
    lines.push('');
  } else {
    lines.push('## Detailed Diagnostics');
    lines.push('');
    lines.push('| Line | Selector | Physical Rule | Logical Replacement | Impact in RTL |');
    lines.push('| ---: | :--- | :--- | :--- | :--- |');

    for (const diag of result.diagnostics) {
      const escapedSelector = escapePipe(diag.selector);
      const orig = escapePipe(diag.originalDeclaration.replace(/\n\s*/g, ' '));
      const fixed = escapePipe(diag.suggestedDeclaration.replace(/\n\s*/g, ' '));
      const why = escapePipe(diag.whyItMatters);
      lines.push(
        `| ${diag.line}:${diag.column} | \`${escapedSelector}\` | \`${orig}\` | \`${fixed}\` | ${why} |`,
      );
    }
    lines.push('');
  }

  lines.push(`## Auto-Fixed Logical Output (\`.${result.syntax}\`)`);
  lines.push('');
  lines.push(`\`\`\`${result.syntax}`);
  lines.push(result.fixedSource.trimEnd());
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function escapePipe(value: string): string {
  return value.replace(/\|/g, '\\|');
}
