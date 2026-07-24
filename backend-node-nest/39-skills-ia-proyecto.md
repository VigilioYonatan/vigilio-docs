# Skills IA del Proyecto

La fuente editable de skills vive en `vigilio-platform-actions/skills/`. Los proyectos consumidores
reciben copias gestionadas por `@vigilioyonatan/vigilio-skills`.

Destinos:

```text
.opencode/skills/ -> OpenCode
.agents/skills/   -> Codex y runtimes compatibles
```

No se editan manualmente las copias sincronizadas. El manifest SHA-256 permite detectar conflictos
y retirar solamente archivos previamente gestionados por el paquete.

## Jerarquia de fuentes

Cuando una skill trabaja sobre un proyecto:

1. lee codigo, tests, CDK, configuracion y workflows ejecutables;
2. aplica policies y tooling central de `vigilio-platform-actions`;
3. usa ADRs y `vigilio-docs` para contexto y decisiones;
4. si hay contradiccion, reporta y alinea la documentacion con la implementacion verificada.

Las skills no operan solamente sobre `docs/`.

## Perfiles actuales

### `core`

- `diagnosing-bugs`
- `grill-me`
- `improve-codebase-architecture`
- `token-context-compression`

### `node-nest`

- `node-nest-build-feature`
- `node-nest-persistence`
- `node-nest-security-aws`
- `node-nest-testing`

### `openspec`

- `openspec-explore`
- `openspec-propose`
- `openspec-apply-change`
- `openspec-update-change`
- `openspec-sync-specs`
- `openspec-archive-change`

Los unicos perfiles publicados son `core`, `node-nest` y `openspec`.

## Sincronizacion

En `bus-impl`:

```bash
pnpm skills:sync
pnpm skills:check
```

Equivalente explicito:

```bash
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile openspec
pnpm exec vigilio-skills sync --target .agents/skills --profile core --profile node-nest --profile openspec
pnpm exec vigilio-skills check --profile core --profile node-nest --profile openspec
pnpm exec vigilio-skills check --target .agents/skills --profile core --profile node-nest --profile openspec
```

La instalacion del paquete no escribe en el consumidor. La sincronizacion siempre es explicita.

## Uso diario

Ejemplos:

```text
Usa $node-nest-build-feature para agregar un caso de uso protegido.
Usa $node-nest-persistence para revisar transaccion, constraints y cache-aside.
Usa $node-nest-testing para cubrir un bug con unit, integration y E2E por riesgo.
Usa $node-nest-security-aws para revisar JWT, IAM, secretos y CDK.
Usa $openspec-propose para preparar un cambio antes de implementarlo.
```

El nombre de negocio es intercambiable. `endoso`, `renovacion`, `product` o `user` pueden aparecer
en ejemplos; la skill aplica el patron al modulo real del proyecto.

## Cobertura

- DDD pragmatico y capas proporcionales;
- Zod, DTOs request/response y OpenAPI;
- repository ports, Drizzle, PostgreSQL y migraciones;
- cache-aside, idempotencia, outbox e inbox;
- unit, integration, BDD, Playwright, contratos y quality gates;
- AuthN/AuthZ, secretos, IAM, AWS, CDK y observabilidad;
- OpenSpec para propuesta, aplicacion, sincronizacion y archivo de cambios;
- reduccion de logs y contexto sin perder la fuente original.

## Mantenimiento

- cambiar primero codigo/tests o ADR;
- actualizar la skill central una sola vez;
- publicar una version nueva de `@vigilioyonatan/vigilio-skills`;
- actualizar la version exacta en consumidores;
- ejecutar `pnpm skills:sync` y `pnpm skills:check`;
- no usar junctions o symlinks como mecanismo de produccion;
- no usar `--force` sin revisar previamente el conflicto.
