# Versiones estables y compatibilidad — fuente canónica Vigilio

> **Propietario único de versiones documentales.** Última verificación pública: **2026-10-24**. Esta página determina las líneas de referencia; las versiones realmente instaladas las determinan `pnpm-lock.yaml`, `composer.lock`, manifiestos, CI y la matriz de compatibilidad. **No implica una actualización automática.**

## Versiones y baselines recomendados

| Ecosistema | Referencia estable contrastada | Estado en Vigilio | Fuente oficial |
|---|---|---|---|
| Node.js | **24.22.1 LTS** (línea 24) | Candidato para servicios nuevos; confirmar runtime Lambda/EKS y dependencias | [Node.js releases](https://nodejs.org/en/about/previous-releases) |
| NestJS | **12.2.0** | Candidato; consumidores en 11 no migran sin tests | [NestJS releases](https://github.com/nestjs/nest/releases/tag/v12.2.0) |
| Zod | **4.x** | Schema canónico TS; validar adaptadores OpenAPI y nestjs-zod por lockfile | [Zod](https://zod.dev/) |
| PHP | **8.5.12**; alternativa soportada **8.4.27** | Propuesto Laravel nuevo; validar extensiones y Composer | [PHP downloads](https://www.php.net/downloads.php) |
| Laravel | **13.38.0** (rama 13.x) | Candidato; compatible oficialmente con PHP 8.3–8.5 | [Laravel 13](https://laravel.com/docs/13.x/releases), [releases](https://github.com/laravel/framework/releases/tag/v13.38.0) |
| React Native independiente | **0.88.0**, rama actual verificada | No instalar esta rama directamente sobre Expo sin matriz | [RN releases](https://reactnative.dev/releases/overview) |
| Expo | **SDK 58** + **React Native 0.88 / React 19.3.0** | Conjunto recomendado si lo aprueban pruebas de EAS/native | [Expo SDK 58](https://expo.dev/changelog/sdk-58), [tabla](https://docs.expo.dev/versions/latest/) |
| React/Preact/Vite, Drizzle, PostgreSQL, pgvector, Valkey, Vitest, Pest, PHPStan, Larastan, Scalar y OTel | Versión **resuelta por dependencias y compatibilidad del proyecto** | No declarar último patch sin fuente verificada y pruebas | Manifest y lockfile del consumidor |

## Historial de verificación puntual (no baseline instalado)

- En la revisión de 2026-10-23 se contrastaron las publicaciones PHP 8.5.12, PHP 8.4.27, Node.js 24.22.1 LTS, NestJS 12.2.0 y Laravel 13.38.0. Son **evidencia fechada**, no órdenes de actualización automáticas.
- Las ramas Current de Node.js no equivalen a LTS; un parche liberado tampoco garantiza compatibilidad de los adaptadores, extensiones, plugins o imágenes del consumidor.
- Cuando cambie una versión recomendada, actualizar esta tabla, sus fuentes y el gate de compatibilidad; no propagar el número manualmente a README, skills o controllers.

## Dependencias por stack: única política

- **NestJS:** `@nestjs/*`, `nestjs-zod`, Zod, Drizzle, driver Postgres, Pino, OTel, Vitest; revisar API mayor, OpenAPI/Scalar, workers y capacidad de runtime. Los contratos de respuesta se derivan de Zod `.pick()` y `createPaginatorDto()`.
- **Laravel:** Composer resuelve compatibilidad exacta de `laravel/framework`, Pest/PHPUnit, Larastan/PHPStan, Pint, Sanctum, Horizon y Scalar. Horizon solo aplica a colas Redis; SQS se opera de otra manera.
- **Web MFE:** inspeccionar `package.json`, pnpm lock, toolkit Preact/React/Vite y contratos reales. Alinear UI y state management sin actualizar accidentalmente la pareja backend/cliente.
- **Mobile Expo:** `npx expo install --check` contra SDK elegido; React Native, React, Expo Modules y plugins deben resolver como un conjunto. EAS OTA y builds nativos necesitan comprobación.
- **Plataforma/IA:** versión del cluster, drivers, protocolos y modelo embeddings pertenecen a su compatibilidad; no mezclar modelos/dimensiones vectoriales sin reindexación.

## Gate de actualización reproducible

1. Identificar el **stack y aplicación consumidora** exacta, runtime, `package.json`/`composer.json`, lockfile y adaptadores.
2. Comprobar release estable publicada, soporte de seguridad y matriz de dependencias; si falta evidencia, estado `PROPOSED`.
3. Actualizar un stack a la vez, sin acoplar framework, runtime y plataforma como una sola migración.
4. Ejecutar typecheck, lint, análisis estático, unit, integración, DB/caché, contratos HTTP, authz y trazas según impacto.
5. Comparar OpenAPI antes/después y comprobar frontend, móvil y workers consumidores.
6. Registrar `PASS`, `FAIL`, `BLOCKED` o `NOT_RUN` y aprobar baseline solo cuando exista evidencia reproducible.

✅ Correcto: referenciar **esta página** desde cada stack/skill; mantener snapshots YAML como artefactos de compatibilidad no autoritativos mientras los consumidores dependen de ellos; bloquear cambios incompatibles en CI.

❌ Incorrecto: fijar versiones contradictorias en controllers, README y SKILL.md; actualizar Expo y React Native por separado; afirmar que PHP 8.5 o NestJS 12 ya está desplegado porque aparece aquí; borrar YAML existente sin evaluar su consumidor.

**Compatibilidad existente:** [`backend-nestjs.yaml`](baselines/backend-nestjs.yaml), [`backend-laravel.yaml`](baselines/backend-laravel.yaml), [`compatibility.json`](../compatibility.json). Son snapshots o artefactos de integración, no otra fuente normativa humana. Su retirada requiere migrar primero las herramientas que los leen.

## Dependencia Laravel Data (política única)

- **Spatie Laravel Data:** biblioteca `spatie/laravel-data`, **línea v4** documentada oficialmente; la versión instalada y su soporte efectivo deben verificarse en `composer.lock` y en la matriz real de Laravel/PHP antes de introducirla. No presumir que está instalada por incluir la guía. [Instalación oficial](https://spatie.be/docs/laravel-data/v4/installation-setup/), [rendimiento](https://spatie.be/docs/laravel-data/v4/advanced-usage/performance).
- ✅ Correcto: fijar versión efectiva en Composer lock y ejecutar tests, caching de estructuras y benchmarks.
- ❌ Incorrecto: convertir `Data` en ORM o en entidad de dominio, o copiar números de versión en varias guías.

## Verificación de librerías (25-10-2026) — referencia, no despliegue

**Release comprobada != runtime instalado.** Tabla contrastada contra notas oficiales, con solo la línea o patch que pudo verificarse. Los proyectos deben fijar el resultado en sus lockfiles y aprobar migraciones mayores.

| Librería/herramienta | Referencia documentada | Acción de adopción | Release fuente |
|---|---|---|---|
| TypeScript | 7.0.2 | Propuesta de migración; la skill npm existente usa TS 6.0.3 | [GitHub TS](https://github.com/microsoft/TypeScript/releases/tag/v7.0.2) |
| Tailwind CSS | 4.3.3 | Propuesta web; migrar configuración CSS-first | [GitHub Tailwind](https://github.com/tailwindlabs/tailwindcss/releases) |
| TanStack Query | **5.104.5** | Release estable publicada; patch instalado desde lockfile | [npm releases](https://www.npmjs.com/package/@tanstack/react-query) |
| TanStack Table | **9.3.1** | **Major**; migrar `useReactTable`→`useTable` | [npm releases](https://www.npmjs.com/package/@tanstack/react-table) |
| Vite | 8.3.5 | Propuesta de minor/patch | [Releases Vite](https://github.com/vitejs/vite/releases) |
| Vitest | 5.0.5 | **Major**; skill npm existente usa 4.1.9 | [Migración Vitest](https://vitest.dev/guide/migration/) |
| Zod | 4.6.7 | Propuesta patch si consumers Zod 4 | [Releases Zod](https://github.com/colinhacks/zod/releases) |
| Drizzle ORM | 0.45.4 estable | No adoptar 1.0.0-rc como estable | [Releases Drizzle](https://github.com/drizzle-team/drizzle-orm/releases) |
| Spatie Laravel Data | 4.23.0 | Actualización v4 con tests PHP/Laravel | [Releases Spatie](https://github.com/spatie/laravel-data/releases) |
| Expo | **SDK 58 / RN 0.88 / React 19.3.0** | Nueva release 2026-10-15; evaluar breaking RN y actualizar como conjunto | [Expo 58](https://expo.dev/changelog/sdk-58) |
| Preact | v11 | Major con pruebas de hidratación y compat | [Preact 11](https://preactjs.com/blog/preact-11/) |
| pnpm | 12.15 (major) | No actualizar pnpm 11 sin gate CI/lockfile | [Releases pnpm](https://github.com/pnpm/pnpm/releases) |
| React independiente (web) | **19.3.1** | Comprobar versión del consumidor; Expo usa React 19.3.0 | [Releases React](https://github.com/react/react/releases) |
| PostgreSQL | 18.x | Versión exacta y extensiones por servidor | [PostgreSQL](https://www.postgresql.org/docs/current/) |

La presencia de una librería en `technology/libraries/` **no afirma que Vigilio la utilice** ni que su versión se encuentre instalada. [Catálogo de guías](libraries/README.md). Los pins reales se resuelven en `package.json`/`pnpm-lock.yaml`, `composer.json`/`composer.lock` y manifests de servicio.

## Modelos RAG y motores de evaluación — política de versiones (2026-10-25)

El **modelo de embeddings**, el **reranker** y el **LLM** son artefactos diferentes. No confundir nombre de familia, tag mutable, versión de SDK y digest desplegado.

| Componente | Familia/candidato documentado | Confirmación necesaria en consumidor |
|---|---|---|
| Embeddings | Qwen3-Embedding-0.6B (hasta 1024 dimensiones) | Digest/revisión, dimensión efectiva, normalización, instrucciones |
| Reranking | Qwen3-Reranker-0.6B | Runtime/protocolo compatibles, digest y calidad vs baseline |
| Modelo generativo | Ollama local o API de proveedor | Model ID/revisión, límites, costos, controles de datos |
| Vector/FTS | PostgreSQL 18 + pgvector (extensión real por servidor) | `SELECT extversion`, índices HNSW/GIN, SQL autorizado |
| Observabilidad IA | Langfuse o Phoenix | SDK real por lockfile, privacidad, datos exportados |
| Evals | Ragas opcional / tests propios | Runner Python versionado, import/API en release instalada |
| Agentic | LangGraph **solo si aporta** | Versión del SDK/estado/runner, semántica de checkpoints |

✅ **Correcto:** fijar digest y versión efectivamente usada en cada proyecto y ejecutar pruebas de embeddings/ACL/evals en CI. ❌ **Incorrecto:** asumir que «0.6B» es un número de release inmutable, o promover Python LangGraph y JS LangGraph por igual sin pruebas.

[Modelos y reindexación](../standards/ai/model-lifecycle.md) · [Selección de arquitectura](../foundations/ai/seleccion-arquitectura-2026.md).

## Releases específicas de evaluación y agentes (verificación pública de 2026-10-25)

| Dependencia | Release estable públicamente contrastada | Adopción en Vigilio | Fuente |
|---|---|---|---|
| `@langchain/langgraph` (JavaScript) | **1.5.2** publicada en npm | **Opcional**; verificar versión real de `@langchain/core` y el checkpointer; `1.5.x` documentada | [npm LangGraph](https://www.npmjs.com/package/@langchain/langgraph) |
| `ragas` (Python runner) | **0.4.3** en PyPI | **Opcional**; evaluación offline con SDK y juez autorizados | [PyPI Ragas](https://pypi.org/project/ragas/) |
| `Qwen3-Embedding-0.6B` | **Modelo, no semver de librería** | Fijar digest/revisión efectiva; medir dimensiones y recall | [Qwen](https://github.com/QwenLM/Qwen3-Embedding) |
| `Qwen3-Reranker-0.6B` | **Modelo, no semver de librería** | Fijar revisión y runner CrossEncoder/otro compatible, sin API Ollama ficticia | [Model card](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B) |

Los números son referencias **documentales**, no prueba de instalación. Antes de cambiar una dependencia ejecutar gate de la [política de adopción](libraries/README.md#protocolo-de-adopción-y-actualización).
