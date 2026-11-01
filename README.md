# vigilio-docs

Documentacion de arquitectura centralizada para proyectos Vigilio.

### 📚 Secciones de Arquitectura

- 🚧 **[Backend Node / NestJS](stacks/backend/nestjs/references/README.md)**: Prácticas, DDD, CDK, FinOps y DevSecOps.
- 💻 **[Frontend Web MFE](stacks/frontend/web-mfe/README.md)**: Preact, Vite, Preact Signals, BFF y TanStack Query.
- 📱 **[Frontend Mobile MFE](stacks/mobile/expo/README.md)**: React Native, Expo, Preact Signals y EAS Build (17 capítulos).
- 🦄 **[Decisiones de Arquitectura (ADR)](adr/README.md)**: Registros de arquitectura (ADRs) y patrones de diseño.
- 🔒 **[Modelos de Amenaza (Threat Model)](threat-model/README.md)**: Análisis de riesgos y mitigaciones de seguridad.
- ⚙️ **[Plataforma Runtime](platform-runtime/README.md)**: Observabilidad, EKS/GitOps, trazabilidad y eficiencia de contexto.

Consulta también:

- [modelo operativo](OPERATING-MODEL.md): responsabilidades y flujo docs → plataforma → consumidor;
- [compatibilidad](COMPATIBILITY.md): SHAs, versiones y consumidores verificados;
- [`compatibility.json`](compatibility.json): snapshot machine-readable validado en CI.
- [Relaciones polimórficas con integridad](standards/data/polymorphic-relations.md): FK segura, tenant, Drizzle/Eloquent y pruebas negativas.
- [Trazabilidad proporcional de casos de uso](standards/engineering/use-case-traceability.md): negocio → HTTP → SQL → UI → evidencia, sin CRUD legacy.
- [Planes de ejecución y context locks](platform-runtime/5-execution-plans-and-context-locks.md): especificación **TARGET**, no runner productivo.

El antiguo Master Software Factory se retiró de fuentes normativas y conserva una sola copia íntegra en `historical-reports/2026-10/` fuera del sitio y del bundle de skills. **No usar sus ejemplos `index/show/store` como política actual.**

## Fuentes de verdad

- `vigilio-docs`: explica decisiones, practicas, operacion y ejemplos.
- `vigilio-platform-actions`: contiene policies, CLIs, actions, reusable workflows y skills
  ejecutables compartidos.
- cada proyecto consumidor, como `bus-impl`: contiene codigo, tests, configuracion, wrappers CI/CD
  y excepciones propias.

Cuando exista una contradiccion, manda primero el comportamiento ejecutable del proyecto y la
policy central; despues se corrige esta documentacion.

Los nombres de negocio usados en ejemplos, como `product`, `renovacion`, `emision` o `constancia`,
no representan modulos obligatorios ni garantizan que existan en un proyecto consumidor.

Publicado en GitHub Pages: https://vigilioyonatan.github.io/vigilio-docs

## Validación local

```bash
node scripts/validate-docs.mjs
node scripts/validate-workflows.mjs
node scripts/validate-compatibility.mjs
node scripts/build-site.mjs
```

La validación de compatibilidad usa por defecto los repositorios hermanos del workspace. En CI se
descargan commits exactos dentro de `.compat/`.

## Arquitectura multistack (incorporación aditiva 2026-10-23)

La nueva estructura [Foundations](foundations/README.md), [Standards](standards/README.md), [Technology/Baselines](technology/README.md), [Stacks](stacks/README.md), [Platform](platform/README.md) y [Playbooks](playbooks/README.md) complementa los capítulos históricos. Los 49 capítulos históricos se reubicaron íntegros por responsabilidad; ver `stacks/backend/nestjs/migration-content-map.md`.

Guía PHP/Laravel 13: [implementación y golden path](stacks/backend/laravel/README.md), baseline `technology/baselines/backend-laravel.yaml` propuesto (no aprobado sin Composer/CI de consumidor). Las skills Laravel nuevas son un snapshot pendiente de publicación en el paquete npm.

## ✅ Correcto / ❌ Incorrecto: revisión 2026

- ✅ **Correcto:** Leer contexto real, seguir normas canónicas y documentar precondiciones, ejemplos, contraejemplos y verificación.
- ❌ **Incorrecto:** Copiar snippets sin imports, asumir versiones instaladas o declarar pruebas `PASS` sin ejecutarlas.
- **Al recibir código existente:** primero caracterizar el comportamiento, después refactorizar en pasos comprobables. [Guía canónica de modernización](standards/engineering/refactoring-existing-code.md).

## Auditoría técnica 2026 y actualización incremental de código heredado

- [Refactorización existente con ✅ Correcto / ❌ Incorrecto](standards/engineering/refactoring-existing-code.md)
- [Colecciones y concurrencia: `map` vs `for...of` vs `for` vs `foreach`](standards/engineering/collections-and-iteration.md)
- [NestJS existente](stacks/backend/nestjs/quality/refactoring-examples.md) y [Laravel existente](stacks/backend/laravel/quality/refactoring-examples.md).

Estos documentos son **guías adicionales**; no reemplazan ADR, capítulos anteriores, reglas humanas ni autorizan upgrades automáticos de dependencias.

## IA / RAG / LLMOps / FinOps — incorporación conservadora (2026-10-23)

El playbook recibido se distribuye en [fundamentos IA](foundations/ai/README.md), [estándares IA](standards/ai/README.md), [plataforma IA](platform/ai/README.md), [baseline económico propuesto](technology/baselines/ai-rag-stack-economico.md), [NestJS](stacks/backend/nestjs/ai-rag-architecture.md), [Laravel](stacks/backend/laravel/ai-rag-architecture.md) y [playbooks de release](playbooks/ai-rag/README.md).

⚠️ Material de **referencia y arquitectura objetivo**; no certifica ejecución productiva. SQL sin ACL por documento, JSONL sin runner y YAML FinOps sin enforcement. La skill `ai-rag-llmops-finops` coordina las guías por perfil `ai-rag` y no sustituye otras skills de backend/testing/security.


## Migración NestJS sin pérdida de contenido (2026-10-24)

Los 49 documentos originales de la anterior agrupación `backend-node-nest/` se trasladaron completos a rutas por responsabilidad. Para desarrollo nuevo empezar por [NestJS canónico](stacks/backend/nestjs/README.md) y para auditoría de las fuentes consultar [Mapa verificable de 49 documentos](stacks/backend/nestjs/migration-content-map.md). Laravel comparte los estándares, sin copiar las reglas NestJS.

✅ **Correcto:** `foundations/` y `standards/` como normas únicas y `stacks/backend/nestjs/` como implementación.

❌ **Incorrecto:** mantener dos carpetas principales que compitan por autoridad o borrar ejemplos extensos por considerarlos existente.

> **Versiones estables:** consultar el [registro único](technology/versions.md); no copiar números de versiones desde ejemplos históricos.

## Política transversal de trabajo completo

- [Complete Work: auditoría y cobertura por archivo](governance/complete-work-coverage-policy.md) — alcance, fuente canónica, cambios y evidencia.
- [Testing E2E: 56 controles compartidos](standards/testing/e2e-quality-gates.md) — adaptar sin duplicar por framework.
- [IA/RAG: 32 controles de evaluación](standards/ai/matriz-calidad-rag.md)
- [Seguridad: matriz de autorización](standards/security/authorization-verification-matrix.md)
- [Observabilidad: matriz de operación](standards/observability/operational-verification-matrix.md) — corpus, retrieval, grounding, seguridad y FinOps.

✅ Correcto: guías operativas completas y referencias a estándares; ❌ Incorrecto: índices inflados o tutoriales reducidos a tres consejos.



## Actualización canónica de DDD/DRY y SQL

[Convención transversal nombres/DDD](standards/engineering/naming-and-boundaries.md) · [schemas/DTOs NestJS](stacks/backend/nestjs/http/semantic-dtos-and-pagination.md) · [DTOs Laravel/Spatie](stacks/backend/laravel/http/semantic-spatie-contracts.md) · [SQL performance](standards/data/sql-performance.md)

✅ Seguir rutas canónicas para implementar nuevos casos de uso. ❌ Copiar nombres CRUD o schemas duplicados desde ejemplos históricos sin revisión.

- **Fronteras HTTP normativas:** [DTOs HTTP unificados (Zod + tipo), modelos `*Schema`](standards/api/http-dtos-and-contracts.md) — separa Zod de entidad y Drizzle SQL; `OrderEntity.cancel()` mantiene invariantes.

## Navegación DRY para autores y skills

Consultar [política de propiedad única, enlaces relativos y rótulos ✅ Correcto / ❌ Incorrecto](governance/documentation-dry-and-ownership.md). Las copias de `_site` y `assets/docs` son derivadas y se mantienen por distribución.

## Hybrid RAG + reranking + evaluación (2026-10-25)

El diseño empresarial se decide en [selección de arquitectura IA](foundations/ai/seleccion-arquitectura-2026.md), implementa recuperación autorizada en [Hybrid RAG PostgreSQL](standards/ai/hybrid-rag-postgresql.md), considera [reranking](standards/ai/reranking.md) solo si el benchmark mejora y controla migraciones desde [model lifecycle](standards/ai/model-lifecycle.md). Las APIs de Qwen3/Ragas/LangGraph se consultan en [catálogo por librería](technology/libraries/README.md), **sin copiar reglas entre NestJS, Laravel y las skills**.

✅ **Correcto:** SQL/API para datos transaccionales, RRF para documentos con IDs + semántica, pruebas cross-user y citas verificables. ❌ **Incorrecto:** usar embeddings para todo, confiar en `tenant_id` como ACL documental o asumir que hay tests reales por existir documentos.

## Vigilio Auto-Senior (propuesta 2026)

- [Orquestación automática de skills](standards/ai/skill-orchestration-policy.md)
- [Playbook de nueva feature](playbooks/auto-senior-feature-workflow.md)
- [Evidencia y meta 10/10](governance/implementation-readiness-2026.md)

- [stacks/rust/README.md](stacks/rust/README.md) — guía vigente y especialización bajo demanda.

- [stacks/cpp/README.md](stacks/cpp/README.md) — guía vigente y especialización bajo demanda.

- [standards/ai/dynamic-capability-discovery.md](standards/ai/dynamic-capability-discovery.md) — guía vigente y especialización bajo demanda.

## Godot videojuegos 2D y 3D

Vigilio incorpora [Godot 4](stacks/godot/README.md), juegos offline/online, gameplay, animación, audio, UI, backend opcional y pipelines verificados. La [selección de motor](playbooks/game-development-solution-design.md) es contextual y no obliga Godot antes de conocer plataforma/género.
