# Matriz De Compatibilidad De Plataforma

Esta página describe el snapshot cross-repo verificado. La fuente machine-readable es
[`compatibility.json`](./compatibility.json) y CI comprueba que no diverja de
`vigilio-platform-actions`, `bus-impl` y `web-mfe`.

## Snapshot Activo

| Campo | Valor |
|---|---|
| Fecha de validación | `2026-07-28` |
| Plataforma ejecutable | `VigilioYonatan/vigilio-platform-actions` |
| Commit inmutable | `b16d086e7af79b1d37a1257527d7388993d5abb7` |
| Node.js | `24.16.0` |
| pnpm | `11.7.0` |

El tag histórico `v2026.1.0` de `vigilio-platform-actions` apunta a un commit anterior. Por eso las
actions de este repositorio consumen el SHA completo mostrado arriba y no presentan ese tag como si
identificara la revisión actual. Una nueva release puede agregar un tag nuevo sin mover el existente.

## Paquetes En La Fuente De Plataforma

Estas son las versiones declaradas por el commit de plataforma validado:

| Paquete | Versión fuente |
|---|---:|
| `@vigilioyonatan/platform-actions` | `0.1.0` |
| `@vigilioyonatan/devsecops-evidence` | `0.2.0` |
| `@vigilioyonatan/devsecops-governance` | `0.2.0` |
| `@vigilioyonatan/node-nest-tooling` | `0.2.0` |
| `@vigilioyonatan/vigilio-skills` | `0.2.0` |

## Baseline Verificado En Consumidores

La versión instalada por un consumidor puede ser posterior al package source del snapshot de
plataforma. Esto se registra explícitamente; no se oculta ni se presenta como una única release.

| Consumidor | Evidencia fijada | Paquetes verificados |
|---|---|---|
| `bus-impl` | `864da70374b936decfd69ae40117f6a8384be0f8` | governance/evidence/skills `0.2.0`; node tooling `0.3.0` |
| `web-mfe` | `f2f15e0c9f77103be44f8ff3edb696c511c74139` | governance/evidence `0.2.0`; skills `0.3.1` |

La diferencia entre source packages y paquetes ya consumidos es una brecha de trazabilidad de
release que debe reconciliarse en `vigilio-platform-actions` antes de la próxima publicación. Los
proyectos no deben degradar una dependencia únicamente para hacer coincidir números.

## Perfiles De Skills En La Fuente Actual

| Perfil | Skills |
|---|---|
| `core` | `coderabbit-compliance`, `diagnosing-bugs`, `grill-me`, `improve-codebase-architecture`, `token-context-compression` |
| `node-nest` | `node-nest-build-feature`, `node-nest-persistence`, `node-nest-security-aws`, `node-nest-testing` |
| `openspec` | `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-propose`, `openspec-sync-specs`, `openspec-update-change` |

El paquete `vigilio-skills@0.3.1` utilizado por `web-mfe` también contiene el perfil publicado
`web-mfe` con cinco skills. No declarar skills adicionales como instaladas hasta que aparezcan en una
fuente/release verificable y el consumidor ejecute `skills:sync` y `skills:check`.

## Documentos Canónicos

- [Backend Golden Path](./backend-node-nest/21-golden-path-feature.md)
- [Frontend Golden Path](./frontend-web-mfe/6-golden-path-feature-componentes-hooks.md)
- [Estrategia de testing backend](./backend-node-nest/38-estrategia-testing-2026.md)
- [Modelo operativo](./OPERATING-MODEL.md)

## Gate Cross-Repo

```bash
node scripts/validate-compatibility.mjs
```

El gate verifica:

- repositorios fijados a SHA completo;
- nombres y versiones de packages fuente;
- dependencias exactas de consumidores;
- existencia de Jira action y reusable workflows requeridos;
- perfiles reales de skills;
- alineación entre manifest, esta página y el workflow de publicación.
