#!/usr/bin/env node
/**
 * Valida la documentacion antes de publicarla.
 *
 * Comprobaciones:
 * 1. Enlaces internos rotos
 * 2. Cobertura del sidebar
 * 3. Colision de numeracion
 * 4. Estructura Markdown
 * 5. Portal SEO y dependencias CDN versionadas
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXCLUDED = new Set(['.compat', '.git', '.github', '_site', 'node_modules', 'scripts']);
const EXCLUDED_FILES = new Set(['AGENTS.md']);

async function markdownFiles(directory = ROOT, collected = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await markdownFiles(fullPath, collected);
    } else if (entry.name.endsWith('.md') && !EXCLUDED_FILES.has(entry.name)) {
      collected.push(fullPath);
    }
  }

  return collected;
}

const relative = (file) => path.relative(ROOT, file).split(path.sep).join('/');

async function validateInternalLinks(files) {
  const errors = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const directory = path.dirname(relative(file));
    const prose = content.replace(/^```[\s\S]*?^```/gm, '');

    for (const match of prose.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];

      if (!target || /^(https?:|mailto:|#)/.test(target)) continue;

      const [linkPath] = target.split('#');
      if (!linkPath) continue;

      const resolved = path
        .normalize(path.join(directory === '.' ? '' : directory, linkPath))
        .split(path.sep)
        .join('/');

      if (!existsSync(path.join(ROOT, resolved))) {
        errors.push(`${relative(file)}: enlace interno roto -> ${target}`);
      }
    }
  }

  return errors;
}

async function validateMarkdownStructure(files) {
  const errors = [];

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const firstContent = lines.find((line) => line.trim().length > 0);

    if (relative(file) !== '_sidebar.md' && !firstContent?.startsWith('# ')) {
      errors.push(`${relative(file)}: debe iniciar con un titulo H1`);
    }

    const fences = lines.filter((line) => line.trimStart().startsWith('```')).length;
    if (fences % 2 !== 0) {
      errors.push(`${relative(file)}: bloque de codigo sin cerrar`);
    }

    if (/file:\/\//i.test(content)) {
      errors.push(`${relative(file)}: no publicar enlaces file:// locales`);
    }
  }

  return errors;
}

async function validateSidebarCoverage(files) {
  const sidebar = await readFile(path.join(ROOT, '_sidebar.md'), 'utf8');
  const linked = new Set(
    [...sidebar.matchAll(/\]\(([^)]+\.md)\)/g)].map((match) => match[1]),
  );

  return files
    .map(relative)
    .filter((file) => file !== '_sidebar.md' && !linked.has(file))
    .map((file) => `${file}: no es alcanzable desde _sidebar.md`);
}

async function validateSiteShell() {
  const errors = [];
  const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');

  for (const match of html.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/([^/"']+)/g)) {
    const packageReference = match[1];
    if (!packageReference.includes('@')) {
      errors.push(`index.html: dependencia CDN sin version exacta -> ${packageReference}`);
    }
  }

  if (!html.includes('<link rel="canonical"')) {
    errors.push('index.html: falta canonical URL');
  }
  if (!html.includes('id="theme-toggle"') || !html.includes('aria-label=')) {
    errors.push('index.html: el control de tema debe ser accesible');
  }

  return errors;
}

function validateNumbering(files) {
  const bySection = new Map();

  for (const file of files.map(relative)) {
    const match = /^(.*)\/(\d+)-/.exec(file);
    if (!match) continue;

    const [, section, number] = match;
    const key = `${section}/${number}`;
    bySection.set(key, [...(bySection.get(key) ?? []), file]);
  }

  return [...bySection.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([key, entries]) => `numeracion duplicada ${key}: ${entries.join(', ')}`);
}

async function main() {
  const files = await markdownFiles();
  const checks = [
    ['Enlaces internos', await validateInternalLinks(files)],
    ['Cobertura del sidebar', await validateSidebarCoverage(files)],
    ['Numeracion', validateNumbering(files)],
    ['Estructura Markdown', await validateMarkdownStructure(files)],
    ['Portal SEO/supply-chain', await validateSiteShell()],
  ];

  let failed = false;

  for (const [name, errors] of checks) {
    if (errors.length === 0) {
      console.log(`OK  ${name}`);
      continue;
    }

    failed = true;
    console.error(`FAIL ${name} (${errors.length})`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
  }

  console.log(`\n${files.length} documentos analizados`);

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
