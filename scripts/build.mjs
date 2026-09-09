import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm, cp } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { CATEGORIES } from '../src/categories.js';
import { STAGE_1_VOTES, STAGE_2_VOTES, processData, getFilteredStage1Data, getHonorableMentionsList } from '../src/data.js';

const nominations = processData(STAGE_1_VOTES);
const ceremony = {
  nominees: Object.fromEntries(CATEGORIES.map(category => [category.id, getFilteredStage1Data(nominations[category.id])])),
  final: processData(STAGE_2_VOTES, true),
  honorable: getHonorableMentionsList(),
};
// Ballots and normalization run once at build time; only the display data ships.
const ceremonyData = {
  name: 'ceremony-data',
  setup(builder) {
    builder.onResolve({ filter: /^ceremony-data$/ }, () => ({ path: 'ceremony-data', namespace: 'ceremony' }));
    builder.onLoad({ filter: /.*/, namespace: 'ceremony' }, () => ({ contents: JSON.stringify(ceremony), loader: 'json' }));
  },
};

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await mkdir('.cache', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('node_modules/@fontsource-variable/noto-sans-arabic/LICENSE', 'dist/FONT-LICENSE.txt');

const client = await build({
  entryPoints: ['src/main.jsx'],
  outdir: 'dist/assets',
  entryNames: '[name]-[hash]',
  chunkNames: '[name]-[hash]',
  assetNames: '[name]-[hash]',
  bundle: true,
  splitting: true,
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  minify: true,
  metafile: true,
  loader: { '.woff2': 'file' },
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [ceremonyData],
  logLevel: 'info',
});

// Render the real welcome screen so text does not wait for JavaScript.
await build({
  entryPoints: ['scripts/prerender.jsx'],
  outfile: '.cache/prerender.mjs',
  platform: 'node',
  format: 'esm',
  bundle: true,
  packages: 'external',
  jsx: 'automatic',
  plugins: [ceremonyData],
});
const { renderWelcome } = await import(pathToFileURL(resolve('.cache/prerender.mjs')).href);
const [entry, details] = Object.entries(client.metafile.outputs).find(([, output]) => output.entryPoint === 'src/main.jsx');
const font = Object.keys(client.metafile.outputs).find(path => path.endsWith('.woff2'));
const relative = path => './' + path.replace(/^dist\//, '');
const assets = [
  '<link rel="preload" href="' + relative(font) + '" as="font" type="font/woff2" crossorigin>',
  '<link rel="stylesheet" href="' + relative(details.cssBundle) + '">',
  ...details.imports.filter(item => item.kind === 'import-statement').map(item => '<link rel="modulepreload" href="' + relative(item.path) + '">'),
  '<script type="module" src="' + relative(entry) + '"></script>',
].join('\n    ');
const template = await readFile('index.html', 'utf8');
await writeFile('dist/index.html', template.replace('<!--app-assets-->', assets).replace('<!--app-html-->', renderWelcome()));
await writeFile('.cache/build-meta.json', JSON.stringify(client.metafile, null, 2));
console.log('Built a static, prerendered ceremony in dist/.');
