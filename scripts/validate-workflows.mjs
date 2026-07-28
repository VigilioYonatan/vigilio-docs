#!/usr/bin/env node
/**
 * Aplica la politica de workflows de la plataforma a este repositorio.
 *
 * `vigilio-docs` era el unico repo fuera de gobernanza: sus cuatro actions
 * estaban por tag movil en un workflow con `pages: write` e `id-token: write`.
 * Comprometer un tag de cualquiera de ellas permitia publicar contenido
 * arbitrario en el sitio de documentacion de la organizacion.
 *
 * Se ejecuta el paquete publicado en vez de reimplementar las reglas, para que
 * este repo herede cualquier regla nueva sin tocar nada aqui.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const GOVERNANCE_PACKAGE = '@vigilioyonatan/devsecops-governance@0.2.0';
const LOCAL_GOVERNANCE_CLI = path.resolve(
  ROOT,
  '../vigilio-platform-actions/packages/devsecops-governance/dist/cli.js',
);

const validationArguments = [
  'validate-workflows',
  '--workflows-dir',
  path.join(ROOT, '.github/workflows'),
  '--profile',
  'consumer',
];

try {
  if (existsSync(LOCAL_GOVERNANCE_CLI)) {
    execFileSync(process.execPath, [LOCAL_GOVERNANCE_CLI, ...validationArguments], {
      stdio: 'inherit',
    });
  } else {
    execFileSync('npx', ['--yes', GOVERNANCE_PACKAGE, ...validationArguments], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
  }
  console.log('OK  Politica de workflows');
} catch {
  console.error(
    '\nFAIL Politica de workflows. Si el fallo es por actions sin pinear, resolver los SHA con:\n' +
      "  gh api repos/actions/configure-pages/commits/v5      --jq '.sha'\n" +
      "  gh api repos/actions/upload-pages-artifact/commits/v3 --jq '.sha'\n" +
      "  gh api repos/actions/deploy-pages/commits/v4         --jq '.sha'\n",
  );
  process.exit(1);
}
