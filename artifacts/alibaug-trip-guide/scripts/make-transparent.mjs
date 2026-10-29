#!/usr/bin/env node
/**
 * Flood-fill cream backgrounds from the image corners and save transparent
 * WebP variants. Usage: node scripts/make-transparent.mjs
 * Requires sharp (optional build-time utility): pnpm add -D sharp
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'public/graphics/characters');
const outputDir = path.join(root, 'public/graphics/characters/transparent');
const names = ['looking', 'lessgoo', 'happy', 'kiss', 'driving', 'parked'];
const tolerance = 42;
let sharp;
try { sharp = (await import('sharp')).default; }
catch { console.error('Optional dependency "sharp" is unavailable; source PNGs remain intact.'); process.exitCode = 0; }
if (sharp) {
  await fs.mkdir(outputDir, { recursive: true });
  for (const name of names) {
    const input = path.join(sourceDir, `${name}.png`);
    try {
      const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const visited = new Uint8Array(info.width * info.height);
      const queue = new Int32Array(info.width * info.height);
      let head = 0, tail = 0;
      const corners = [0, info.width - 1, (info.height - 1) * info.width, info.width * info.height - 1];
      const colorAt = i => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
      const bg = colorAt(corners[0]);
      for (const c of corners) { if (!visited[c]) { visited[c] = 1; queue[tail++] = c; } }
      while (head < tail) {
        const p = queue[head++], x = p % info.width, y = Math.floor(p / info.width);
        const [r,g,b] = colorAt(p);
        if (Math.max(Math.abs(r-bg[0]),Math.abs(g-bg[1]),Math.abs(b-bg[2])) > tolerance) continue;
        data[p*4+3] = 0;
        for (const n of [x ? p-1 : -1, x+1<info.width ? p+1 : -1, y ? p-info.width : -1, y+1<info.height ? p+info.width : -1]) {
          if (n >= 0 && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
        }
      }
      for (const scale of [1, 2]) {
        const image = sharp(data, { raw: info });
        if (scale === 1) await image.webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(outputDir, `${name}.webp`));
        else await image.resize(info.width * 2, info.height * 2).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(outputDir, `${name}@2x.webp`));
      }
      console.log(`Created transparent ${name} WebP variants`);
    } catch (error) { console.warn(`Skipped ${name}:`, error.message); }
  }
}
