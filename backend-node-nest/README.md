# Documentacion Arquitectonica - `bus-impl` 2026

Este directorio contiene la documentacion de arquitectura del `bus-impl` actualizado a 2026:

- DDD pragmatico por modulo, sin entities obligatorias en CRUD simple.
- NestJS como framework principal.
- Zod en lugar de Joi.
- Swagger/OpenAPI generado desde Nest usando DTOs Zod + Scalar como UI de documentacion.
- Drizzle ORM + PostgreSQL.
- Vitest + Playwright.
- Biome en lugar de ESLint + Prettier.
- pnpm + GitHub Actions + AWS CDK.

Para la vision transversal de seguridad, escalamiento, testing y costos entre todos los proyectos, revisar [docs globales](../../docs/01-escalamiento-seguridad-testing-2026.md).

La fuente de verdad ejecutable para versiones es
`@vigilioyonatan/devsecops-governance/policies/platform/node-backend-2026.json`, publicada desde
`vigilio-platform-actions`. Cada backend valida ese baseline con
`vigilio-governance validate-platform-baseline`; este repositorio explica las decisiones, pero no
reemplaza la politica central.

Fuentes de verdad, en orden:

1. codigo, tests y configuracion ejecutable del proyecto consumidor;
2. policies, CLIs, actions, reusable workflows y skills de `vigilio-platform-actions`;
3. ADRs y documentos de `vigilio-docs`.

En `bus-impl`, los modulos actuales del template son `auth`, `user`, `product`, `health`, `upload`
y `ai-chat`.
Los nombres `endoso`, `renovacion`, `emision`, `constancia` y `learn-aws` se conservan en algunos
documentos como ejemplos referenciales de negocio o aprendizaje. No son modulos obligatorios ni
implican que existan en el codigo actual.

## Indice

1. [Estructura de archivos](./1-estructura-archivos.md): arbol actualizado del repo y organizacion por bounded context.
2. [Arquitectura](./2-arquitectura.md): DDD, NestJS, Drizzle, PostgreSQL, eventos AWS, Swagger, Scalar y versiones verificadas.
3. [Ambientes de trabajo](./3-ambientes-trabajo.md): ambientes, desarrollo local, previews de PR y despliegue por stage.
4. [DevSecOps](./4-devsecops.md): GitHub Actions, OIDC, scans, quality gates y CDK.
5. [Buenas practicas](./5-buenas-practicas.md): reglas de arquitectura, tipado, validacion, repositorios y observabilidad.
6. [Ejemplos de codigo](./6-ejemplos-codigo.md): controller Zod + Swagger/Scalar, application service, repository port y repositorio Drizzle.
7. [Pruebas Vitest + Playwright](./7-pruebas-vitest-playwright.md): testing 2026 con Vitest, Playwright y PostgreSQL real.
8. [Bootstrap HTTP y workers](./8-bootstrap-http-workers.md): bootstrap moderno para HTTP y workers async sobre AWS Lambda.
9. [Cache](./9-cache.md): cache de aplicacion y runtime con Lambda, Valkey/ElastiCache, TTLs e invalidacion.
10. [Optimizacion de costos AWS](./10-optimizacion-costos-recursos-aws.md): ahorro de servidor, AWS, logs, DB y DevSecOps.
11. [Logging Pino](./11-logging-pino.md): logging estructurado con Pino, NestJS, redaction, request context y CloudWatch.
12. [AuthZ y seguridad](./12-authz-security.md): AuthN/AuthZ, RBAC/ABAC, `@Public`, permisos por endpoint y controles runtime.
13. [Data governance](./13-data-governance.md): PII, auditoria, retencion, masking y aislamiento por tenant.
14. [Resilience y eventos](./14-resilience-events.md): outbox, inbox, idempotencia, DLQ, replay y versionado de eventos.
15. [Migraciones DB](./15-migrations-db.md): migraciones PostgreSQL/Drizzle seguras, expand-contract, backfills y rollback.
16. [Observability y SLO](./16-observability-slo.md): SLIs, SLOs, error budgets, dashboards, alertas y runbooks.
17. [Backup, restore y DR](./17-backup-restore-dr.md): RTO/RPO, backups, restore drills, DR y recuperacion operativa.
18. [ADR y threat model](./18-adr-threat-model.md): ADRs, threat modeling, riesgos, excepciones y decision records.
19. [Evidencia operacional](./19-evidencia-operacional.md): evidencia CI/CD antes de llamar production-ready a la arquitectura.
20. [Reglas senior de codigo](./20-reglas-senior-codigo.md): DTOs Zod, Drizzle, cache, seeders, uploads, logger y Zod v4.
21. [Golden path feature](./21-golden-path-feature.md): feature CRUD copi/pega con reglas de domain, DTOs, repository, tests y PR checklist.
22. [Cucumber BDD](./22-cucumber-bdd.md): acceptance tests de negocio con Gherkin, DTOs Zod y application services.
23. [Seguridad y hardening](./23-seguridad-hardening.md): checklist senior de seguridad runtime, supply chain, secrets, datos, resiliencia e incident response.
24. [Roadmap 10/10](./24-roadmap-10-10.md): estado real, contras y mejoras para llegar a production-ready enterprise.
25. [CDK e IaC AWS](./25-cdk-iac-aws.md): stacks CDK reales, stages, seguridad, cdk-nag, CI y reglas de deploy.
26. [Seeders en DDD](./26-seeders-ddd.md): ubicacion correcta, reglas, comandos e idempotencia para datos base.
27. [DTOs request/response](./27-dtos-request-response.md): convencion de 2 archivos por caso de uso, request y response.
28. [CI/CD AWS stages y observabilidad](./28-cicd-aws-stages-observability.md): deploy por environments, OIDC, canary y CloudWatch costo-eficiente.
29. [Configuracion NestJS con Zod y AWS](./29-config-nest-zod-aws.md): `ConfigModule`, `ConfigService`, validacion Zod y variables por stage.
30. [Referencia AWS y FinOps](./30-learn-aws-finops.md): catalogo archivado de aprendizaje; no describe endpoints activos del template.
31. [AI Chat con Amazon Bedrock](./31-ai-chat-bedrock-ddd.md): endpoint HTTP protegido para chatbot IA sin WebSockets, con DDD pragmatico, Zod, IAM y control de costos.
32. [Uploads S3 con presigned URLs](./32-uploads-s3-presigned.md): endpoint reusable para subir archivos directo a S3, con validacion Zod, cache, seguridad y ahorro de costos.
33. [Guia GitHub, Jira, AWS y CI/CD 2026](./33-guia-github-jira-aws-cicd-2026.md): setup paso a paso de repositorio, roles, branch protection, Jira, OIDC, environments, deploy y rollback.
34. [Dependabot y Repository Policy](./34-dependabot-repository-policy.md): PRs automaticos de dependencias y validacion de archivos criticos de gobierno.
34. [Gestion de configuracion hibrida](./34-gestion-configuracion-hibrida-2026.md): `.env` local, SSM, Secrets Manager y validacion Zod por stage.
35. [Trunk-Based + Environments Protegidos 2026](./35-branching-release-flow-2026.md): flujo `feature -> main -> staging QA -> production manual`, sin Git Flow pesado.
35. [Versionamiento basado en commits](./35-versionamiento-basado-en-commits-2026.md): tags, releases y trazabilidad desde commits validados.
36. [Deuda Tecnica DevSecOps](./36-deuda-tecnica.md): deudas conscientes, decisiones aceptadas y plan para cerrar brechas enterprise.
37. [Resumen de jobs CI/CD](./37-cicd-jobs-resumen.md): jobs actuales de `ci.yml`, gates y artefactos.
38. [Estrategia de testing 2026](./38-estrategia-testing-2026.md): cobertura real, suites, gates CI, seguridad negativa, flakiness y siguientes controles.
39. [Skills IA del proyecto](./39-skills-ia-proyecto.md): skills especializados para features, persistencia/cache, testing y seguridad/AWS.
40. [Operacion de produccion](./40-operacion-produccion.md): health/readiness, RBAC, migraciones, restore drill, carga, alertas y gate de release.
41. [Agent stack](./agent-stack-guide.md): estado de OpenCode/OmO y diferencia frente a las skills activas.

## Contratos generados

El contrato OpenAPI vivo se genera y versiona en `docs/openapi/openapi.json` dentro de cada
servicio. `vigilio-docs` documenta la practica, pero no cachea contratos de proyectos.

## Template de proyecto

`bus-impl` es un template NestJS listo para clonar:

- Configuracion base: `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `playwright.config.ts`, `drizzle.config.ts`.
- Estructura de tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/bdd/` y `tests/factories/`.
- Scripts propios del proyecto y tooling compartido publicado desde `vigilio-platform-actions`.
- Skills Vigilio sincronizados via `pnpm skills:sync`.
