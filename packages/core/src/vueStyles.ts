import { buildLineStarts, offsetToPosition } from './parser.js';
import { applyDiagnosticsToCode, scanStylesheetDeclarations } from './transformer.js';
import type { AuditDiagnostic, SyntaxMode, VueStyleBlock } from './types.js';

/**
 * Extracts `<style>` blocks from a Vue Single-File Component (`.vue`) along with
 * exact document character offsets and 1-based line/column positions.
 */
export function extractVueStyleBlocks(vueSource: string): VueStyleBlock[] {
  const blocks: VueStyleBlock[] = [];
  const lineStarts = buildLineStarts(vueSource);
  const styleRegex = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;

  let match: RegExpExecArray | null;
  while ((match = styleRegex.exec(vueSource)) !== null) {
    const attrs = match[1] ?? '';
    const content = match[2] ?? '';
    const openTagLength = match[0].indexOf('>') + 1;
    const contentStartOffset = match.index + openTagLength;
    const contentEndOffset = contentStartOffset + content.length;

    const langMatch = attrs.match(/\blang\s*=\s*["']?([a-zA-Z]+)["']?/i);
    const lang = langMatch ? langMatch[1].toLowerCase() : 'css';
    const syntax: SyntaxMode = lang === 'sass' ? 'sass' : 'scss';

    const startPos = offsetToPosition(lineStarts, contentStartOffset);

    blocks.push({
      content,
      syntax,
      contentStartOffset,
      contentEndOffset,
      startLine: startPos.line,
      startColumn: startPos.column,
    });
  }

  return blocks;
}

/**
 * Infers language mode from a file path, virtual module ID, or VS Code languageId.
 */
export function inferDocumentKind(
  fileIdOrLanguage: string,
): 'vue' | 'sass' | 'scss' | 'css' | null {
  const clean = fileIdOrLanguage.split('?')[0].trim().toLowerCase();
  if (clean === 'vue' || clean.endsWith('.vue')) return 'vue';
  if (clean === 'sass' || clean.endsWith('.sass')) return 'sass';
  if (clean === 'scss' || clean.endsWith('.scss')) return 'scss';
  if (clean === 'css' || clean.endsWith('.css')) return 'css';
  return null;
}

/**
 * Scans `.css`, `.scss`, `.sass`, or `.vue` files and returns `AuditDiagnostic[]`
 * with document-accurate 1-based `line`, `column`, `endLine`, `endColumn`, and character `range`.
 */
export function scanDocumentForPhysicalCss(
  source: string,
  fileIdOrLanguage: string,
): AuditDiagnostic[] {
  const kind = inferDocumentKind(fileIdOrLanguage);
  if (!kind) return [];

  if (kind === 'vue') {
    const lineStarts = buildLineStarts(source);
    const blocks = extractVueStyleBlocks(source);
    const results: AuditDiagnostic[] = [];

    blocks.forEach((block, blockIdx) => {
      const { diagnostics } = scanStylesheetDeclarations(block.content, block.syntax, 'source');
      for (const diag of diagnostics) {
        if (!diag.range) continue;
        const docStart = block.contentStartOffset + diag.range.start;
        const docEnd = block.contentStartOffset + diag.range.end;
        const startPos = offsetToPosition(lineStarts, docStart);
        const endPos = offsetToPosition(lineStarts, docEnd);

        results.push({
          ...diag,
          id: `vue-${blockIdx}-${diag.id}`,
          line: startPos.line,
          column: startPos.column,
          endLine: endPos.line,
          endColumn: endPos.column,
          range: { start: docStart, end: docEnd },
        });
      }
    });

    return results;
  }

  const syntax: SyntaxMode = kind === 'sass' ? 'sass' : 'scss';
  return scanStylesheetDeclarations(source, syntax, 'source').diagnostics;
}

/**
 * Rewrites all physical directional CSS declarations inside a `.css`, `.scss`, `.sass`, or `.vue` document.
 */
export function fixAllInDocument(source: string, fileIdOrLanguage: string): string {
  const diagnostics = scanDocumentForPhysicalCss(source, fileIdOrLanguage);
  if (diagnostics.length === 0) return source;
  const fallbackSyntax: SyntaxMode = inferDocumentKind(fileIdOrLanguage) === 'sass' ? 'sass' : 'scss';
  return applyDiagnosticsToCode(source, diagnostics, fallbackSyntax);
}
