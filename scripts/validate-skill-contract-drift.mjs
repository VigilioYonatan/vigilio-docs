#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const contractPath = path.join(ROOT, 'standards', 'platform', 'common-operational-contract.md');
const platformActionsSkillsDir = path.resolve(ROOT, '..', 'platform-actions', 'packages', 'vigilio-skills', 'skills');

const errors = [];
const contract = await readFile(contractPath, 'utf8');

const requiredHeadings = [
  '# Contrato Operativo Común De Plataforma',
  '## Contexto Antes De Decidir',
  '## Invariantes Compartidos',
  '## Evidencia Mínima',
  '## Excepciones',
  '## Manejo De Código Existente',
  '## Validación Del Contexto',
  '## ✅ Correcto / ❌ Incorrecto',
];

for (const heading of requiredHeadings) {
  if (!contract.includes(heading)) {
    errors.push(`common-operational-contract.md: falta seccion obligatoria '${heading}'`);
  }
}

for (const invariant of ['.vigilio/platform-context.yaml', 'NOT_RUN', 'FAIL', 'BLOCKED', 'platform-context.schema.json']) {
  if (!contract.includes(invariant)) {
    errors.push(`common-operational-contract.md: falta invariante compartido '${invariant}'`);
  }
}

try {
  const entries = await readdir(platformActionsSkillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMd = path.join(platformActionsSkillsDir, entry.name, 'SKILL.md');
    try {
      const text = await readFile(skillMd, 'utf8');
      if (/(?:glpat-|ghp_[A-Za-z0-9]{20,}|BEGIN [A-Z ]*PRIVATE KEY)/.test(text)) {
        errors.push(`skill '${entry.name}': contiene patron de secreto literal prohibido`);
      }
      if (/git\s+push\s+--force\b|git\s+reset\s+--hard\b/.test(text) && !/prohib|never|nunca|avoid|no\s+usar|do\s+not/i.test(text)) {
        errors.push(`skill '${entry.name}': instruccion destructiva sin guarda explicita`);
      }
    } catch {
      // Optional skill folder without SKILL.md
    }
  }
} catch {
  // platform-actions checkout is optional when running isolated docs check
}

if (errors.length > 0) {
  console.error('FAIL Drift entre contrato comun y skills:');
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log('OK  Contrato operativo comun y skills sin drift contradictorio');
