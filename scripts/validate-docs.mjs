#!/usr/bin/env node
/**
 * Valida la documentacion antes de publicarla.
 *
 * Comprobaciones:
 * 1. Enlaces internos rotos
 * 2. Cobertura del sidebar
 * 3. Colision de numeracion
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXCLUDED = new Set(['.git', '.github', '_site', 'node_modules', 'scripts']);

async function markdownFiles(directory = ROOT, collected = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await markdownFiles(fullPath, collected);
    } else if (entry.name.endsWith('.md')) {
      collected.push(fullPath);
    }
  }

  return collected;
}

const relative = (file) => path.relative(ROOT, file).split(path.sep).join('/');

async function validateInternalLinks(files) {
  const errors = [];
  const existing = new Set(files.map(relative));

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const directory = path.dirname(relative(file));

    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];

      if (!target || /^(https?:|mailto:|#)/.test(target)) continue;

      const [linkPath] = target.split('#');
      if (!linkPath || !linkPath.endsWith('.md')) continue;

      const resolved = path
        .normalize(path.join(directory === '.' ? '' : directory, linkPath))
        .split(path.sep)
        .join('/');

      if (!existing.has(resolved)) {
        errors.push(`${relative(file)}: enlace interno roto -> ${target}`);
      }
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
