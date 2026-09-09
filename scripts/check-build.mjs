import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const metadata = JSON.parse(readFileSync('.cache/build-meta.json', 'utf8'));
const html = readFileSync('dist/index.html', 'utf8');
const outputs = metadata.outputs;
const entry = Object.keys(outputs).find(path => outputs[path].entryPoint === 'src/main.jsx');
const awardEntry = Object.keys(outputs).find(path => outputs[path].entryPoint === 'src/Awards.jsx');
assert.ok(entry && awardEntry, 'The welcome entry and deferred ceremony chunk must exist.');
assert.match(html, /<html lang="ar" dir="rtl">/);
assert.match(html, /id="screen-title"/);
assert.match(html, /ابدأ العرض/);
assert.ok(!html.includes('<!--app-'), 'The welcome screen must be prerendered.');
assert.doesNotMatch(html, /text\/babel|cdn\.tailwindcss|unpkg\.com|fonts\.googleapis|\.gif/i);
assert.ok(!html.includes(awardEntry.replace('dist/', '')), 'The ceremony must remain deferred until needed.');

for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (reference.startsWith('#')) continue;
  assert.ok(reference.startsWith('./'), 'Asset must work under /farqiayh/: ' + reference);
  assert.ok(existsSync(resolve('dist', reference)), 'Missing HTML asset: ' + reference);
}
for (const [path, output] of Object.entries(outputs)) {
  assert.ok(existsSync(path), 'Missing generated file: ' + path);
  for (const imported of output.imports) {
    assert.ok(!imported.external, 'Unexpected external runtime dependency: ' + imported.path);
    assert.ok(existsSync(imported.path), 'Missing generated dependency: ' + imported.path);
  }
  if (path.endsWith('.js')) execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' });
  if (path.endsWith('.css')) {
    const css = readFileSync(path, 'utf8');
    assert.match(css, /prefers-reduced-motion/);
    assert.match(css, /font-display:swap/);
    assert.doesNotMatch(css, /backdrop-filter|blur\(|https?:\/\//);
    for (const [, reference] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      assert.ok(existsSync(resolve(dirname(path), reference)), 'Missing CSS asset: ' + reference);
    }
  }
}

const eager = new Set();
function visit(path) {
  if (eager.has(path)) return;
  eager.add(path);
  for (const dependency of outputs[path].imports) {
    if (dependency.kind === 'import-statement' && dependency.path.endsWith('.js')) visit(dependency.path);
  }
}
visit(entry);
const totalBytes = paths => paths.reduce((total, path) => total + readFileSync(path).length, 0);
const gzipBytes = paths => paths.reduce((total, path) => total + gzipSync(readFileSync(path)).length, 0);
const scripts = Object.keys(outputs).filter(path => path.endsWith('.js'));
const css = Object.keys(outputs).filter(path => path.endsWith('.css'));
assert.ok(totalBytes([...eager]) < 180_000, 'Initial JavaScript budget: 180 kB uncompressed.');
assert.ok(totalBytes(scripts) < 215_000, 'Total JavaScript budget: 215 kB uncompressed.');
assert.ok(totalBytes(css) < 25_000, 'CSS budget: 25 kB uncompressed.');
assert.ok(readdirSync('dist').every(name => !['src', 'tests', '.github', 'node_modules'].includes(name)), 'Ship only public artifacts.');
console.log(JSON.stringify({
  initialJavaScript: { bytes: totalBytes([...eager]), gzipBytes: gzipBytes([...eager]) },
  totalJavaScript: { bytes: totalBytes(scripts), gzipBytes: gzipBytes(scripts) },
  css: { bytes: totalBytes(css), gzipBytes: gzipBytes(css) },
  htmlBytes: Buffer.byteLength(html),
  fontBytes: totalBytes(Object.keys(outputs).filter(path => path.endsWith('.woff2'))),
  status: 'Static paths, dependency graph, syntax, prerendering and size budgets passed.',
}, null, 2));
