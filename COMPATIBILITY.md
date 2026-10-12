# Matriz De Compatibilidad De Plataforma

Esta página describe el snapshot cross-repo verificado. La fuente machine-readable es
[`compatibility.json`](./compatibility.json) y CI comprueba que no diverja de
`vigilio-platform-actions`, `bus-impl` y `web-mfe`.

## Snapshot Activo

| Campo | Valor |
|---|---|
| Fecha de validación | `2026-10-11` |
| Plataforma ejecutable | `VigilioYonatan/vigilio-platform-actions` |
| Commit inmutable | `ce703f099442e4c113ff76922a6c4895de899d7c` |
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
| `@vigilioyonatan/devsecops-evidence` | `0.3.0` |
| `@vigilioyonatan/devsecops-governance` | `0.5.0` |
| `@vigilioyonatan/node-nest-tooling` | `0.3.0` |
| `@vigilioyonatan/prompt-builder` | `0.6.2` |
| `@vigilioyonatan/vigilio-skills` | `0.6.2` |

## Baseline Verificado En Consumidores

La versión instalada por un consumidor puede ser posterior al package source del snapshot de
plataforma. Esto se registra explícitamente; no se oculta ni se presenta como una única release.

| Consumidor | Evidencia fijada | Paquetes verificados |
|---|---|---|
| `bus-impl` | `864da70374b936decfd69ae40117f6a8384be0f8` | governance/evidence/skills `0.2.0`; node tooling `0.3.0` |
| `web-mfe` | `f2f15e0c9f77103be44f8ff3edb696c511c74139` | N/A (sin dependencias directas de plataforma) |

La diferencia entre source packages y paquetes ya consumidos es una brecha de trazabilidad de
release que debe reconciliarse en `vigilio-platform-actions` antes de la próxima publicación. Los
proyectos no deben degradar una dependencia únicamente para hacer coincidir números.

## Perfiles De Skills En La Fuente Actual

| Perfil | Skills |
|---|---|
| `core` | `shared-technologies`, `commit-ai-change`, `coderabbit-compliance`, `codebase-context-efficiency`, `diagnosing-bugs`, `grill-me`, `improve-codebase-architecture`, `architecture-traceability`, `review-code-change`, `token-context-compression` |
| `node-nest` | `backend-engineering-quality`, `node-nest-technologies`, `node-nest-build-feature`, `node-nest-realtime`, `node-nest-async-workers`, `node-nest-persistence`, `node-nest-security-aws`, `platform-observability-sre`, `node-nest-testing` |
| `openspec` | `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-propose`, `openspec-sync-specs`, `openspec-update-change` |

Los perfiles publicados adicionales se resuelven desde `skill-profiles.json`. No declarar una skill
como instalada en un consumidor hasta que este use una release compatible y ejecute `skills:sync` y
`skills:check`.

## Documentos Canónicos

- [Backend Golden Path](./backend-node-nest/21-golden-path-feature.md)
- [Contratos API backend](./software-factory/backend-api-contracts.md)
- [Testing backend por riesgo](./software-factory/backend-testing-strategy.md)
- [Datos y SQL backend](./software-factory/backend-data-sql.md)
- [Calidad y comentarios de revisión](./software-factory/code-review-quality.md)
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
