import { cp, mkdir, readdir, rm } from 'node:fs/promises';

await rm('assets', { recursive: true, force: true });
await mkdir('assets', { recursive: true });
await cp('dist/assets', 'assets', { recursive: true });
for (const file of ['index.html', 'favicon.svg', 'FONT-LICENSE.txt', '.nojekyll']) {
  await cp('dist/' + file, file);
}
console.log('Published dist/ to the repository root for branch-based GitHub Pages.');
