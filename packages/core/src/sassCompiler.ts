import * as sass from 'sass';
import type { CompilerErrorInfo, SassCompileResult, SyntaxMode } from './types.js';

interface SassExceptionLike {
  message?: string;
  sassMessage?: string;
  span?: {
    start?: {
      line?: number;
      column?: number;
    };
    text?: string;
  };
}

/**
 * Compiles SCSS or indented Sass strings into standard CSS using Dart Sass (`sass.compileString`).
 * Surfaces structured 1-based line/column error metadata when compilation fails.
 */
export function compileSass(source: string, syntax: SyntaxMode = 'scss'): SassCompileResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!source.trim()) {
    return {
      ok: true,
      css: '',
      error: null,
      durationMs: 0,
    };
  }

  try {
    const result = sass.compileString(source, {
      syntax: syntax === 'sass' ? 'indented' : 'scss',
      style: 'expanded',
    });

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    return {
      ok: true,
      css: result.css,
      error: null,
      durationMs: Math.max(0, Number((endTime - startTime).toFixed(2))),
    };
  } catch (err: unknown) {
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const errorInfo = extractSassError(err);

    return {
      ok: false,
      css: '',
      error: errorInfo,
      durationMs: Math.max(0, Number((endTime - startTime).toFixed(2))),
    };
  }
}

function extractSassError(err: unknown): CompilerErrorInfo {
  if (err && typeof err === 'object') {
    const sassErr = err as SassExceptionLike;
    const rawMessage = typeof sassErr.message === 'string' ? sassErr.message : String(err);
    const cleanMessage =
      typeof sassErr.sassMessage === 'string'
        ? sassErr.sassMessage
        : rawMessage.split('\n')[0] || 'Invalid Sass syntax';

    const zeroBasedLine = sassErr.span?.start?.line;
    const zeroBasedColumn = sassErr.span?.start?.column;

    const line = typeof zeroBasedLine === 'number' ? zeroBasedLine + 1 : undefined;
    const column = typeof zeroBasedColumn === 'number' ? zeroBasedColumn + 1 : undefined;
    const spanText = sassErr.span?.text;

    return {
      message: cleanMessage,
      line,
      column,
      spanText,
      formatted: rawMessage,
    };
  }

  const fallback = String(err);
  return {
    message: fallback,
    formatted: fallback,
  };
}
