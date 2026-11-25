import type { SyntaxMode } from './types.js';

export interface ParsedDeclaration {
  selector: string;
  property: string;
  value: string;
  important: boolean;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  start: number;
  end: number;
  indentation: string;
  hasSemicolon: boolean;
  inlineBlock: boolean;
}

/**
 * Extracts CSS/SCSS/Sass property declarations with exact character offsets,
 * 1-based start/end line & column coordinates, and selector context while ignoring
 * comments, strings, Sass variables (`$var`), and at-rule headers.
 */
export function parseDeclarations(source: string, syntax: SyntaxMode): ParsedDeclaration[] {
  if (!source.trim()) return [];
  return syntax === 'sass' ? parseIndentedSassDeclarations(source) : parseScssDeclarations(source);
}

export function buildLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

export function offsetToPosition(
  lineStarts: number[],
  offset: number,
): { line: number; column: number; lineStartOffset: number } {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const lineIndex = Math.max(0, high);
  const lineStartOffset = lineStarts[lineIndex];
  return {
    line: lineIndex + 1,
    column: offset - lineStartOffset + 1,
    lineStartOffset,
  };
}

function resolveSelectorChain(stack: string[]): string {
  const filtered = stack.filter((s) => s && !s.startsWith('@'));
  if (filtered.length === 0) return ':root';

  let current = '';
  for (const rawPart of filtered) {
    const part = rawPart.replace(/\s+/g, ' ').trim();
    if (!current) {
      current = part;
    } else if (part.includes('&')) {
      current = part.replace(/&/g, current);
    } else {
      current = `${current} ${part}`;
    }
  }
  return current;
}

function splitImportant(rawValue: string): { value: string; important: boolean } {
  const match = rawValue.match(/^(.*?)\s*!important\s*$/i);
  if (match) {
    return { value: match[1].trim(), important: true };
  }
  return { value: rawValue.trim(), important: false };
}

function parseScssDeclarations(source: string): ParsedDeclaration[] {
  const declarations: ParsedDeclaration[] = [];
  const lineStarts = buildLineStarts(source);
  const blockStack: Array<{ header: string; openBraceOffset: number }> = [];

  let tokenStart = 0;
  let i = 0;
  let parenDepth = 0;
  let interpDepth = 0;

  const tryRecordDeclaration = (stmtStart: number, stmtEnd: number, hasSemicolon: boolean) => {
    let start = stmtStart;
    while (start < stmtEnd && /\s/.test(source[start])) {
      start++;
    }
    let end = stmtEnd;
    while (end > start && /\s/.test(source[end - 1])) {
      end--;
    }
    if (start >= end) return;

    const rawStmt = source.slice(start, end);
    if (rawStmt.startsWith('$') || rawStmt.startsWith('@')) {
      return;
    }

    let colonIndex = -1;
    let pDepth = 0;
    let qChar: string | null = null;
    for (let k = 0; k < rawStmt.length; k++) {
      const ch = rawStmt[k];
      if (qChar) {
        if (ch === qChar && rawStmt[k - 1] !== '\\') qChar = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        qChar = ch;
        continue;
      }
      if (ch === '(') pDepth++;
      else if (ch === ')') pDepth = Math.max(0, pDepth - 1);
      else if (ch === ':' && pDepth === 0) {
        colonIndex = k;
        break;
      }
    }

    if (colonIndex <= 0) return;

    const propPart = rawStmt.slice(0, colonIndex).trim();
    const valPart = rawStmt.slice(colonIndex + 1).trim();

    if (!/^-?[a-zA-Z][a-zA-Z0-9-]*$/.test(propPart) || !valPart) {
      return;
    }

    const { value, important } = splitImportant(valPart);
    if (!value) return;

    const startPos = offsetToPosition(lineStarts, start);
    const rangeEnd = hasSemicolon ? stmtEnd + 1 : end;
    const endPos = offsetToPosition(lineStarts, rangeEnd);

    const lineLeadingSlice = source.slice(startPos.lineStartOffset, start);
    const indentMatch = lineLeadingSlice.match(/^[ \t]*/);
    const indentation = indentMatch ? indentMatch[0] : '';

    const enclosing = blockStack[blockStack.length - 1];
    const inlineBlock = enclosing
      ? offsetToPosition(lineStarts, enclosing.openBraceOffset).line === startPos.line
      : false;

    declarations.push({
      selector: resolveSelectorChain(blockStack.map((b) => b.header)),
      property: propPart,
      value,
      important,
      line: startPos.line,
      column: startPos.column,
      endLine: endPos.line,
      endColumn: endPos.column,
      start,
      end: rangeEnd,
      indentation,
      hasSemicolon,
      inlineBlock,
    });
  };

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (ch === '/' && next === '/') {
      if (tokenStart === i) {
        while (i < source.length && source[i] !== '\n') i++;
        tokenStart = i + 1;
      } else {
        while (i < source.length && source[i] !== '\n') i++;
      }
      continue;
    }

    if (ch === '/' && next === '*') {
      const wasAtStart = tokenStart === i;
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        i++;
      }
      i += 2;
      if (wasAtStart) {
        tokenStart = i;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < source.length) {
        if (source[i] === quote && source[i - 1] !== '\\') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === '#' && next === '{') {
      interpDepth++;
      i += 2;
      continue;
    }
    if (interpDepth > 0 && ch === '}') {
      interpDepth--;
      i++;
      continue;
    }

    if (ch === '(') {
      parenDepth++;
      i++;
      continue;
    }
    if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      i++;
      continue;
    }

    if (parenDepth === 0 && interpDepth === 0) {
      if (ch === '{') {
        const rawHeader = stripComments(source.slice(tokenStart, i)).trim();
        blockStack.push({ header: rawHeader, openBraceOffset: i });
        i++;
        tokenStart = i;
        continue;
      }

      if (ch === ';') {
        tryRecordDeclaration(tokenStart, i, true);
        i++;
        tokenStart = i;
        continue;
      }

      if (ch === '}') {
        tryRecordDeclaration(tokenStart, i, false);
        blockStack.pop();
        i++;
        tokenStart = i;
        continue;
      }
    }

    i++;
  }

  return declarations;
}

function parseIndentedSassDeclarations(source: string): ParsedDeclaration[] {
  const declarations: ParsedDeclaration[] = [];
  const lines = source.split('\n');
  const selectorStack: Array<{ indent: number; selector: string }> = [];

  let offset = 0;
  let inBlockComment = false;
  let blockCommentIndent = -1;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const lineLengthWithNewline = rawLine.length + (idx < lines.length - 1 ? 1 : 0);
    const lineWithoutCr = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    const indentMatch = lineWithoutCr.match(/^[ \t]*/);
    const indentation = indentMatch ? indentMatch[0] : '';
    const indentWidth = indentation.replace(/\t/g, '  ').length;
    const trimmed = lineWithoutCr.trim();

    if (!trimmed) {
      offset += lineLengthWithNewline;
      continue;
    }

    if (inBlockComment) {
      if (trimmed.includes('*/') || indentWidth <= blockCommentIndent) {
        if (trimmed.includes('*/')) {
          inBlockComment = false;
          blockCommentIndent = -1;
          offset += lineLengthWithNewline;
          continue;
        }
        inBlockComment = false;
        blockCommentIndent = -1;
      } else {
        offset += lineLengthWithNewline;
        continue;
      }
    }

    if (trimmed.startsWith('//')) {
      offset += lineLengthWithNewline;
      continue;
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
        blockCommentIndent = indentWidth;
      }
      offset += lineLengthWithNewline;
      continue;
    }

    while (
      selectorStack.length > 0 &&
      selectorStack[selectorStack.length - 1].indent >= indentWidth
    ) {
      selectorStack.pop();
    }

    const codePart = stripTrailingLineComment(lineWithoutCr.slice(indentation.length));
    const trimmedCode = codePart.trimEnd();

    if (
      trimmedCode.startsWith('$') ||
      trimmedCode.startsWith('@') ||
      trimmedCode.startsWith('+') ||
      trimmedCode.startsWith('=')
    ) {
      if (trimmedCode.startsWith('@media') || trimmedCode.startsWith('@supports')) {
        selectorStack.push({ indent: indentWidth, selector: trimmedCode });
      }
      offset += lineLengthWithNewline;
      continue;
    }

    const declMatch = trimmedCode.match(/^(-?[a-zA-Z][a-zA-Z0-9-]*)\s*:\s+(.+)$/);
    if (declMatch) {
      const propPart = declMatch[1];
      const valPart = declMatch[2].trim();
      const { value, important } = splitImportant(valPart);

      const declStart = offset + indentation.length;
      const declEnd = declStart + trimmedCode.length;
      const startCol = indentation.length + 1;
      const endCol = startCol + trimmedCode.length;

      declarations.push({
        selector: resolveSelectorChain(selectorStack.map((s) => s.selector)),
        property: propPart,
        value,
        important,
        line: idx + 1,
        column: startCol,
        endLine: idx + 1,
        endColumn: endCol,
        start: declStart,
        end: declEnd,
        indentation,
        hasSemicolon: false,
        inlineBlock: false,
      });
    } else {
      selectorStack.push({ indent: indentWidth, selector: trimmedCode });
    }

    offset += lineLengthWithNewline;
  }

  return declarations;
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function stripTrailingLineComment(line: string): string {
  let quoteChar: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoteChar) {
      if (ch === quoteChar && line[i - 1] !== '\\') quoteChar = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quoteChar = ch;
      continue;
    }
    if (ch === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }
  return line;
}
