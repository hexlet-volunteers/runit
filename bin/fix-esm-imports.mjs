#!/usr/bin/env node
// Пост-обработка сборки: добавляет расширения в относительные импорты dist/.
//
// Зачем. В рантайме Node работает как чистый ESM (в package.json "type": "module"),
// а ESM требует явного расширения в спецификаторе. TypeScript расширения не
// дописывает, поэтому `node dist/server.js` падал с ERR_MODULE_NOT_FOUND —
// то есть прод-сборка была неработоспособна.
//
// Почему так, а не бандлером: структура каталогов dist/ сохраняется, поэтому
// продолжает работать поиск миграций (path.join(__dirname, '../../drizzle')),
// и не нужно править импорты в самих исходниках.

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');

/** Импорты и реэкспорты с относительным путём без расширения. */
const SPECIFIER = /(\bfrom\s+|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;

const resolveSpecifier = async (fileDir, spec) => {
  if (/\.(js|mjs|cjs|json|node)$/.test(spec)) return spec;

  const asFile = path.resolve(fileDir, `${spec}.js`);
  if (await exists(asFile)) return `${spec}.js`;

  const asIndex = path.resolve(fileDir, spec, 'index.js');
  if (await exists(asIndex)) return `${spec}/index.js`;

  return spec;
};

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
};

const main = async () => {
  if (!(await exists(DIST))) {
    console.error('[fix-esm-imports] dist/ не найден — сначала соберите проект');
    process.exit(1);
  }

  const files = await walk(DIST);
  let patched = 0;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const dir = path.dirname(file);

    const replacements = [];
    for (const match of source.matchAll(SPECIFIER)) {
      replacements.push({ match, resolved: await resolveSpecifier(dir, match[3]) });
    }

    let result = source;
    let changed = false;
    for (const { match, resolved } of replacements.reverse()) {
      if (resolved === match[3]) continue;
      const [full, prefix, quote] = match;
      result =
        result.slice(0, match.index) +
        `${prefix}${quote}${resolved}${quote}` +
        result.slice(match.index + full.length);
      changed = true;
    }

    if (changed) {
      await writeFile(file, result);
      patched += 1;
    }
  }

  console.log(`[fix-esm-imports] обработано файлов: ${files.length}, исправлено: ${patched}`);
};

main();
