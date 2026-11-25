import { build, context } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

const options = {
  entryPoints: [join(__dirname, '..', 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: join(__dirname, '..', 'dist', 'extension.js'),
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
