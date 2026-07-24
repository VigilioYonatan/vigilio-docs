# Estrategia de testing 2026

## Estado implementado

- Unit: application services y DTOs de auth, users, products, AI, uploads y health.
- Security unit: JWT guard, RBAC, Google ID token, token service y validacion de environment.
- Config unit: environment schema y resolucion segura de URL de base de datos.
- Adapters unit: Amazon Bedrock y S3 con errores normalizados y cierre de clientes.
- Integration: repositories PostgreSQL reales y S3 local.
- BDD: health/readiness disponible y rechazo cuando dependencias no estan listas.
- E2E API: auth, refresh, products, users, OpenAPI y rutas negativas de seguridad.
- Contract: artefacto OpenAPI, endpoints obligatorios y esquema Bearer.

La cobertura incluye explicitamente codigo critico aunque ningun test lo importe. El gate actual es:

| Metrica | Minimo |
| --- | ---: |
| Lines | 85% |
| Statements | 85% |
| Functions | 85% |
| Branches | 80% |

Los porcentajes se publican como artefacto de CI. La documentacion no fija un valor historico como
si fuera el resultado actual.

## Comandos

```bash
pnpm test:unit
pnpm test:coverage
pnpm test:integration
pnpm test:bdd
pnpm test:e2e:api
pnpm test:e2e:security
pnpm test:all
```

## Gates por etapa

| Etapa | Obligatorio | Objetivo |
| --- | --- | --- |
| Pre-commit | Biome + unit afectados | feedback menor a 30 s |
| Pull request | typecheck + unit coverage + BDD + OpenAPI diff | bloquear regresiones |
| Merge a main | integration + E2E API | validar PostgreSQL y contratos HTTP |
| Staging | smoke + critical + security | validar artefacto desplegado |
| Programado | suite completa, dependency scan y performance | detectar degradacion acumulada |

## Reglas senior

1. Un test unitario no usa red, reloj real ni base compartida.
2. Integration usa PostgreSQL/S3 reales o emulados, con datos unicos y limpieza determinista.
3. E2E prueba comportamiento observable: status, schema y autorizacion; no detalles internos.
4. Todo bug de produccion agrega primero un test de regresion.
5. No se desactiva un test flaky: se aisla, se corrige y se registra causa raiz.
6. Retries solo en CI y solo para generar evidencia; un resultado flaky sigue siendo deuda.
7. Secretos, tokens, hashes y PII nunca aparecen en snapshots ni reportes.

## Flakiness SLO

- Objetivo: menos de `0.5%` de ejecuciones flaky por semana.
- Cuarentena maxima: 5 dias habiles, con owner y ticket.
- Semillas, fechas, UUID y puertos deben ser controlables.
- Publicar JUnit, traces de Playwright y reportes Cucumber solo como artefactos privados con retencion limitada.

## Siguientes gates

- Mutation testing en services de auth, users y products; objetivo inicial `70%` mutation score.
- Contract testing consumidor/proveedor si aparecen consumidores independientes del OpenAPI.
- Carga con k6 para login, listado y alta; definir p95 y tasa de error desde los SLO del servicio.
- Test de restore PostgreSQL y smoke post-restore en el ejercicio de DR.

Estas capacidades se agregan cuando exista infraestructura y ownership; no deben simularse con un script que siempre retorna verde.
