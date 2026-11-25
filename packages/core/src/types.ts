export type SyntaxMode = 'scss' | 'sass';

export type AuditCategory =
  | 'box-model'
  | 'positioning'
  | 'alignment-float'
  | 'corner-radius'
  | 'shorthand';

export type AuditSeverity = 'warning' | 'info';

export interface CompilerErrorInfo {
  message: string;
  line?: number;
  column?: number;
  spanText?: string;
  formatted: string;
}

export interface SassCompileResult {
  ok: boolean;
  css: string;
  error: CompilerErrorInfo | null;
  durationMs: number;
}

export interface SourceRange {
  start: number;
  end: number;
}

export interface LogicalReplacement {
  property: string;
  value: string;
}

export interface AuditDiagnostic {
  id: string;
  ruleId: string;
  category: AuditCategory;
  severity: AuditSeverity;
  selector: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  property: string;
  value: string;
  important: boolean;
  originalDeclaration: string;
  suggestedDeclaration: string;
  replacements: LogicalReplacement[];
  message: string;
  whyItMatters: string;
  origin: 'source' | 'compiled';
  syntax?: SyntaxMode;
  range?: SourceRange;
  indentation?: string;
  hasSemicolon?: boolean;
  inlineBlock?: boolean;
}

export interface AuditSummary {
  totalDeclarations: number;
  totalIssues: number;
  fixableIssues: number;
  bidiScore: number;
  byCategory: Record<AuditCategory, number>;
}

export interface AuditResult {
  syntax: SyntaxMode;
  compileResult: SassCompileResult;
  compiledCss: string;
  fixedSource: string;
  fixedCompiledCss: string;
  diagnostics: AuditDiagnostic[];
  summary: AuditSummary;
}

export interface SampleFixture {
  id: string;
  name: string;
  badge: string;
  description: string;
  html: string;
  scss: string;
  sass: string;
}

export interface VueStyleBlock {
  content: string;
  syntax: SyntaxMode;
  contentStartOffset: number;
  contentEndOffset: number;
  startLine: number;
  startColumn: number;
}
