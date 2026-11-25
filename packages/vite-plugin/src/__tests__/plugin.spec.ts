import { describe, expect, it, vi } from 'vitest';
import { bidilensPlugin } from '../index.js';

function invokeTransform(
  plugin: ReturnType<typeof bidilensPlugin>,
  code: string,
  id: string,
  context?: { error?: (err: unknown) => never },
) {
  const hook = plugin.transform;
  const fn = typeof hook === 'function' ? hook : hook?.handler;
  return fn?.call((context ?? {}) as never, code, id);
}

describe('vite-plugin-bidilens', () => {
  it('logs actionable terminal warnings with file paths and line numbers for .scss and .vue files', () => {
    const warnSpy = vi.fn();
    const collected: Array<{ file: string; count: number }> = [];

    const plugin = bidilensPlugin({
      failOnError: false,
      onDiagnostics: (file, diags) => collected.push({ file, count: diags.length }),
    });

    const configHook = plugin.configResolved;
    const configFn = typeof configHook === 'function' ? configHook : configHook?.handler;
    configFn?.call({} as never, {
      root: '/workspace',
      logger: { warn: warnSpy, error: vi.fn() },
    } as never);

    invokeTransform(
      plugin,
      `.header {\n  margin-left: 14px;\n  float: right;\n}`,
      '/workspace/src/styles/header.scss',
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const firstLog = String(warnSpy.mock.calls[0][0]);
    expect(firstLog).toContain('src/styles/header.scss:2:3');
    expect(firstLog).toContain('margin-inline-start: 14px;');

    const vueCode = [
      '<template><nav class="bar" /></template>',
      '<style scoped lang="scss">',
      '.bar {',
      '  border-left: 2px solid blue;',
      '}',
      '</style>',
    ].join('\n');

    invokeTransform(plugin, vueCode, '/workspace/src/components/NavBar.vue');
    // Virtual ?vue sub-request should be skipped to prevent duplicate warnings
    invokeTransform(
      plugin,
      '.bar { border-left: 2px solid blue; }',
      '/workspace/src/components/NavBar.vue?vue&type=style&index=0&lang.scss',
    );

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(String(warnSpy.mock.calls[1][0])).toContain('src/components/NavBar.vue:4:3');
    expect(collected).toEqual([
      { file: 'src/styles/header.scss', count: 2 },
      { file: 'src/components/NavBar.vue', count: 1 },
    ]);
  });

  it('respects include/exclude filters and ignores node_modules by default', () => {
    const onDiagnostics = vi.fn();
    const plugin = bidilensPlugin({
      include: ['src/**/*.scss'],
      exclude: ['**/legacy/**'],
      onDiagnostics,
    });

    invokeTransform(plugin, '.a { left: 4px; }', 'node_modules/pkg/index.scss');
    invokeTransform(plugin, '.a { left: 4px; }', 'src/legacy/old.scss');
    invokeTransform(plugin, '.a { margin-inline-start: 4px; }', 'src/clean.scss');
    expect(onDiagnostics).not.toHaveBeenCalled();

    invokeTransform(plugin, '.a { right: 8px; }', 'src/modern/card.scss');
    expect(onDiagnostics).toHaveBeenCalledTimes(1);
  });

  it('fails the build when failOnError: true and physical CSS rules exist', () => {
    const plugin = bidilensPlugin({ failOnError: true });
    const errorContext = {
      error: (err: { message: string }) => {
        throw new Error(err.message);
      },
    };

    expect(() =>
      invokeTransform(plugin, '.btn { padding-left: 10px; }', 'src/button.css', errorContext),
    ).toThrow(/Physical CSS regression in src\/button\.css:1:8/);
  });
});
