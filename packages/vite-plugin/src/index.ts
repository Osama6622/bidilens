import path from 'node:path';
import pc from 'picocolors';
import {
  createFilter,
  type FilterPattern,
  type Logger,
  type Plugin,
  type ResolvedConfig,
} from 'vite';
import {
  inferDocumentKind,
  scanDocumentForPhysicalCss,
  type AuditDiagnostic,
} from '@bidilens/core';

export type { FilterPattern };

export interface BidiLensPluginOptions {
  /**
   * When `true`, physical CSS violations fail the Vite/Rollup build (ideal for CI).
   * Defaults to `false` (emits actionable terminal warnings).
   */
  failOnError?: boolean;
  /**
   * Glob or RegExp patterns of files to include.
   * Defaults to `['**\/*.css', '**\/*.scss', '**\/*.sass', '**\/*.vue']`.
   */
  include?: FilterPattern;
  /**
   * Glob or RegExp patterns of files to exclude.
   * Defaults to `['**\/node_modules/**', '**\/dist/**']`.
   */
  exclude?: FilterPattern;
  /**
   * Optional callback invoked whenever physical CSS diagnostics are detected in a file.
   */
  onDiagnostics?: (filePath: string, diagnostics: AuditDiagnostic[]) => void;
}

export function formatTerminalDiagnostics(
  displayPath: string,
  diagnostics: AuditDiagnostic[],
): string {
  const count = diagnostics.length;
  const header = `${pc.cyan('[bidilens]')} ${pc.yellow(
    `Physical directional CSS in ${pc.bold(displayPath)} (${count} ${count === 1 ? 'issue' : 'issues'}):`,
  )}`;

  const details = diagnostics.map((diag) => {
    const loc = pc.dim(`${displayPath}:${diag.line}:${diag.column}`);
    const orig = pc.red(diag.originalDeclaration.replace(/\n\s*/g, ' '));
    const suggested = pc.green(diag.suggestedDeclaration.replace(/\n\s*/g, ' '));
    return `  ${loc}  ${orig} ${pc.dim('->')} ${suggested}`;
  });

  return [header, ...details].join('\n');
}

export function bidilensPlugin(options: BidiLensPluginOptions = {}): Plugin {
  const {
    failOnError = false,
    include = ['**/*.css', '**/*.scss', '**/*.sass', '**/*.vue'],
    exclude = ['**/node_modules/**', '**/dist/**'],
    onDiagnostics,
  } = options;

  const filter = createFilter(include, exclude, { resolve: false });

  let rootDir = process.cwd();
  let logger: Pick<Logger, 'warn' | 'error'> = console;

  return {
    name: 'vite-plugin-bidilens',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      rootDir = config.root;
      logger = config.logger;
    },

    transform(code: string, id: string) {
      if (!id || id.startsWith('\0')) return null;

      const [cleanPath, query = ''] = id.split('?');
      if (query.includes('vue')) return null;

      const kind = inferDocumentKind(cleanPath);
      if (!kind) return null;

      const relPath = path.isAbsolute(cleanPath)
        ? path.relative(rootDir, cleanPath).replace(/\\/g, '/')
        : cleanPath.replace(/\\/g, '/');

      if (!filter(relPath) && !filter(cleanPath)) {
        return null;
      }

      const diagnostics = scanDocumentForPhysicalCss(code, cleanPath);
      if (diagnostics.length === 0) {
        return null;
      }

      const displayPath = relPath.startsWith('..') ? cleanPath : relPath;
      onDiagnostics?.(displayPath, diagnostics);

      const formattedMessage = formatTerminalDiagnostics(displayPath, diagnostics);

      if (failOnError) {
        const plainSummary = `[bidilens] Physical CSS regression in ${displayPath}:${diagnostics[0].line}:${diagnostics[0].column} (${diagnostics.length} ${diagnostics.length === 1 ? 'issue' : 'issues'}).\n${formattedMessage}`;
        if (this && typeof this.error === 'function') {
          this.error({
            message: plainSummary,
            id: cleanPath,
            loc: {
              file: cleanPath,
              line: diagnostics[0].line,
              column: diagnostics[0].column,
            },
          });
        } else {
          throw new Error(plainSummary);
        }
      } else {
        logger.warn(formattedMessage);
      }

      return null;
    },
  };
}

export default bidilensPlugin;
