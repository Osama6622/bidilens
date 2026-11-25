import { compileSass } from './sassCompiler.js';
import { parseDeclarations, type ParsedDeclaration } from './parser.js';
import { evaluateDeclarationRule } from './rules.js';
import type {
  AuditCategory,
  AuditDiagnostic,
  AuditResult,
  AuditSummary,
  LogicalReplacement,
  SyntaxMode,
} from './types.js';

export function formatDeclarationReplacement(
  replacements: LogicalReplacement[],
  important: boolean,
  syntax: SyntaxMode,
  indentation: string,
  hasSemicolon: boolean,
  inlineBlock: boolean,
): string {
  const importantSuffix = important ? ' !important' : '';
  const semi = syntax === 'sass' ? '' : hasSemicolon ? ';' : ';';

  const formattedLines = replacements.map(
    (rep) => `${rep.property}: ${rep.value}${importantSuffix}${semi}`,
  );

  if (formattedLines.length === 1) {
    return formattedLines[0];
  }

  if (syntax === 'scss' && inlineBlock) {
    return formattedLines.join(' ');
  }

  return formattedLines.join(`\n${indentation}`);
}

/**
 * Fast static declaration scanner (zero Dart Sass compilation overhead) ideal for
 * real-time editor linting in VS Code / Cursor and Vite build plugin transforms.
 */
export function scanStylesheetDeclarations(
  code: string,
  syntax: SyntaxMode = 'scss',
  origin: 'source' | 'compiled' = 'source',
): { diagnostics: AuditDiagnostic[]; totalDeclarations: number } {
  const parsed = parseDeclarations(code, syntax);
  const diagnostics: AuditDiagnostic[] = [];

  parsed.forEach((decl: ParsedDeclaration, index: number) => {
    const match = evaluateDeclarationRule(decl.property, decl.value);
    if (!match) return;

    const importantSuffix = decl.important ? ' !important' : '';
    const semi = syntax === 'sass' ? '' : ';';
    const originalDeclaration = `${decl.property}: ${decl.value}${importantSuffix}${semi}`;
    const suggestedDeclaration = formatDeclarationReplacement(
      match.replacements,
      decl.important,
      syntax,
      decl.indentation,
      decl.hasSemicolon,
      decl.inlineBlock,
    );

    diagnostics.push({
      id: `${origin}-${decl.line}-${decl.column}-${match.ruleId}-${index}`,
      ruleId: match.ruleId,
      category: match.category,
      severity: 'warning',
      selector: decl.selector,
      line: decl.line,
      column: decl.column,
      endLine: decl.endLine,
      endColumn: decl.endColumn,
      property: decl.property,
      value: decl.value,
      important: decl.important,
      originalDeclaration,
      suggestedDeclaration,
      replacements: match.replacements,
      message: match.message,
      whyItMatters: match.whyItMatters,
      origin,
      syntax,
      range: { start: decl.start, end: decl.end },
      indentation: decl.indentation,
      hasSemicolon: decl.hasSemicolon,
      inlineBlock: decl.inlineBlock,
    });
  });

  return { diagnostics, totalDeclarations: parsed.length };
}

/**
 * Applies a subset or all fixable source diagnostics to the original code
 * in reverse offset order so character indices stay exact.
 */
export function applyDiagnosticsToCode(
  source: string,
  diagnostics: AuditDiagnostic[],
  defaultSyntax: SyntaxMode = 'scss',
): string {
  const fixable = diagnostics
    .filter((d) => d.origin === 'source' && d.range)
    .slice()
    .sort((a, b) => b.range!.start - a.range!.start);

  let output = source;
  for (const diag of fixable) {
    const range = diag.range!;
    const syntax = diag.syntax ?? defaultSyntax;
    const replacement = formatDeclarationReplacement(
      diag.replacements,
      diag.important,
      syntax,
      diag.indentation ?? '',
      diag.hasSemicolon ?? syntax === 'scss',
      diag.inlineBlock ?? false,
    );
    output = output.slice(0, range.start) + replacement + output.slice(range.end);
  }
  return output;
}

export function applySingleFix(
  source: string,
  diagnosticId: string,
  syntax: SyntaxMode = 'scss',
): string {
  const { diagnostics } = scanStylesheetDeclarations(source, syntax, 'source');
  const target = diagnostics.find((d) => d.id === diagnosticId);
  if (!target) return source;
  return applyDiagnosticsToCode(source, [target], syntax);
}

export function applyAllFixes(source: string, syntax: SyntaxMode = 'scss'): string {
  const { diagnostics } = scanStylesheetDeclarations(source, syntax, 'source');
  if (diagnostics.length === 0) return source;
  return applyDiagnosticsToCode(source, diagnostics, syntax);
}

export function transformCssToLogical(css: string): string {
  return applyAllFixes(css, 'scss');
}

/**
 * Full workbench pipeline: compiles SCSS/Sass with Dart Sass, audits physical directional
 * declarations, computes Bidi Readiness Score, and produces both fixed source and fixed compiled CSS.
 */
export function auditStylesheet(source: string, syntax: SyntaxMode = 'scss'): AuditResult {
  const compileResult = compileSass(source, syntax);
  const { diagnostics: sourceDiagnostics, totalDeclarations } = scanStylesheetDeclarations(
    source,
    syntax,
    'source',
  );

  const fixedSource = applyDiagnosticsToCode(source, sourceDiagnostics, syntax);

  let compiledCss = '';
  let fixedCompiledCss = '';
  const allDiagnostics: AuditDiagnostic[] = [...sourceDiagnostics];

  if (compileResult.ok) {
    compiledCss = compileResult.css;
    const fixedCompile = compileSass(fixedSource, syntax);
    const intermediateFixedCss = fixedCompile.ok ? fixedCompile.css : compiledCss;

    const { diagnostics: remainingCompiledDiagnostics } = scanStylesheetDeclarations(
      intermediateFixedCss,
      'scss',
      'compiled',
    );
    if (remainingCompiledDiagnostics.length > 0) {
      allDiagnostics.push(...remainingCompiledDiagnostics);
    }

    fixedCompiledCss = transformCssToLogical(intermediateFixedCss);
  }

  const summary = computeSummary(allDiagnostics, totalDeclarations);

  return {
    syntax,
    compileResult,
    compiledCss,
    fixedSource,
    fixedCompiledCss,
    diagnostics: allDiagnostics,
    summary,
  };
}

function computeSummary(diagnostics: AuditDiagnostic[], totalDeclarations: number): AuditSummary {
  const byCategory: Record<AuditCategory, number> = {
    'box-model': 0,
    positioning: 0,
    'alignment-float': 0,
    'corner-radius': 0,
    shorthand: 0,
  };

  let fixableIssues = 0;
  for (const diag of diagnostics) {
    byCategory[diag.category] = (byCategory[diag.category] ?? 0) + 1;
    if (diag.origin === 'source' && diag.range) {
      fixableIssues++;
    }
  }

  const totalIssues = diagnostics.length;
  const denominator = Math.max(totalDeclarations, totalIssues, 1);
  const cleanCount = Math.max(0, denominator - totalIssues);
  const bidiScore =
    totalDeclarations === 0 && totalIssues === 0
      ? 100
      : Math.round((cleanCount / denominator) * 100);

  return {
    totalDeclarations,
    totalIssues,
    fixableIssues,
    bidiScore,
    byCategory,
  };
}
