# Estructura de Archivos - `bus-impl` 2026

Este documento actualiza la estructura de `bus-impl` manteniendo el mismo enfoque DDD por modulo, pero con un stack 2026 orientado a NestJS, Zod, Drizzle, PostgreSQL, CDK y GitHub Actions.

---

## Arbol de directorios propuesto

```text
bus-impl/
|
|-- src/
|   |-- shared/
|   |   |-- application/
|   |   |   |-- schemas/                       # query, paginator, timestamp
|   |   |   `-- dtos/                          # DTOs transversales
|   |   |-- infrastructure/
|   |   |   |-- aws/                           # clientes y configuracion AWS local
|   |   |   |-- config/                        # carga y validacion de environment
|   |   |   |-- database/                      # DatabaseModule, DRIZZLE_DB y seed runner
|   |   |   |-- docs/                          # Swagger/OpenAPI
|   |   |   |-- env/                           # lectura segura de process.env
|   |   |   |-- http/
|   |   |   |   |-- decorators/
|   |   |   |   `-- pipes/                     # ZodPipe, ZodQueryPipe
|   |   |   |-- persistence/
|   |   |   |   `-- drizzle/
|   |   |   |       `-- custom-types/           # numeric exacto
|   |   |   `-- security/                      # guards, decorators y request autenticado
|   |
|   |-- product/                                # ejemplo completo de modulo CRUD
|   |   |-- application/
|   |   |   |-- schemas/                       # product.schema.ts, schemas Zod base
|   |   |   |-- dtos/                          # request/response derivados del schema
|   |   |   |-- repositories/                  # puertos usados por application
|   |   |   `-- service/
|   |   `-- infrastructure/
|   |       |-- http/
|   |       |   |-- controllers/
|   |       |   `-- dtos/                      # clases HTTP solo si Swagger las requiere
|   |       `-- persistence/
|   |           `-- drizzle/
|   |               |-- schema.ts
|   |               |-- product.repository.ts
|   |               `-- product.seeder.ts
|   |
|   |-- user/                                   # repite solo las carpetas que necesite
|   |-- auth/
|   |-- health/
|   |-- upload/
|   `-- ai-chat/
|
|-- cdk/
|   |-- bin/
|   |   `-- app.ts                             # entrada CDK
|   |-- lib/
|   |   |-- config/                            # lectura de stage, tags, naming
|   |   |-- stacks/
|   |   |   |-- api.stack.ts
|   |   |   |-- database.stack.ts
|   |   |   |-- network.stack.ts
|   |   |   `-- observability.stack.ts
|   |   `-- tags/
|   `-- assets/
|
|-- tests/
|   |-- unit/
|   |   |-- auth/
|   |   |-- config/
|   |   |-- health/
|   |   |-- user/
|   |   |-- product/
|   |   |-- upload/
|   |   `-- ai-chat/
|   |-- integration/
|   |   |-- repositories/
|   |   `-- aws/
|   |-- bdd/
|   |   `-- health/
|   |-- e2e/
|   |   |-- auth/
|   |   |-- openapi/
|   |   `-- security/
|   |-- fixtures/
|   `-- helpers/
|
|-- scripts/
|   |-- export-openapi.ts
|   |-- load-test.ts
|   |-- run-floci-tests.ts
|   |-- seed-local-db.ts
|   |-- smoke-endpoints.ts
|   `-- start-prod-like-local.ts
|
|-- docs/
|   `-- openapi/
|       `-- openapi.json
|
|-- openspec/                                  # specs y cambios del proyecto
|-- .opencode/
|   `-- skills/                                # copia gestionada para OpenCode
|-- .agents/
|   `-- skills/                                # copia gestionada para Codex/otros agentes
|-- .agent-stack/                              # integracion OmO experimental; hoy pausada
|
|-- .github/
|   |-- evidence-policy.json
|   |-- governance-policy.json
|   |-- repository-policy.json
|   `-- workflows/
|       |-- ci.yml
|       |-- preview.yml
|       |-- release-artifact.yml
|       |-- security-nightly.yml
|       |-- secure-deploy-cdk.yml
|       |-- deploy-development.yml
|       |-- deploy-staging.yml
|       |-- deploy-production.yml
|       |-- dora-metrics.yml
|       |-- governance-audit.yml
|       `-- jira-release.yml
|
|-- package.json
|-- pnpm-lock.yaml
|-- biome.json
|-- tsconfig.json
|-- vitest.config.ts
|-- vitest.integration.config.ts
|-- playwright.config.ts
|-- drizzle.config.ts
|-- cdk.json
`-- README.md
```

La automatizacion compartida no se copia dentro de `scripts/`. `bus-impl` consume los ejecutables
`vigilio-governance`, `vigilio-evidence`, `vigilio-node` y `vigilio-skills` desde paquetes publicados
por `vigilio-platform-actions`. `scripts/` conserva solamente logica propia del servicio.

Las carpetas `.opencode/skills/` y `.agents/skills/` son destinos generados por
`pnpm skills:sync`; la fuente editable vive en `vigilio-platform-actions/skills/`.

---

## Regla para organizar tests

La convencion recomendada es **tipo de prueba primero, modulo despues**:

```text
tests/
|-- unit/
|   |-- auth/
|   |   |-- auth.application-service.test.ts
|   |   `-- google-id-token.verifier.test.ts
|   |-- config/
|   |   `-- environment.schema.test.ts
|   |-- health/
|   |   `-- health.application-service.test.ts
|   |-- user/
|   |   `-- user-store.dto.test.ts
|   |-- product/
|   |   `-- product-store.dto.test.ts
|   |-- upload/
|   |   |-- upload.application-service.test.ts
|   |   `-- upload.dto.test.ts
|   `-- ai-chat/
|       `-- ai-chat.application-service.test.ts
|-- integration/
|   |-- repositories/
|   |   `-- repositories.integration.test.ts
|   `-- aws/
|       `-- s3.local.integration.test.ts
|-- e2e/
|   |-- auth/
|   |   `-- auth-products-users.api.spec.ts
|   |-- openapi/
|   |   `-- openapi.api.spec.ts
|   `-- security/
|       `-- security-negative.api.spec.ts
|-- bdd/
|   `-- health/
|       |-- health-readiness.feature
|       `-- health-readiness.steps.ts
`-- factories/                                  # solo si varias suites reutilizan datos
```

Reglas:

- `unit`, `integration`, `e2e` y `bdd` siguen siendo el primer nivel porque CI/CD ejecuta por tipo.
- Cada bounded context o modulo vive dentro de su carpeta: `auth`, `user`, `product`, `upload`.
- No dejar archivos sueltos en `tests/unit` cuando pertenecen a un modulo.
- Usar `@tests/*` para imports compartidos y evitar rutas relativas fragiles.

## Decision de estructura

### 1. Modulos por capacidad, DDD proporcional

Cada capacidad del sistema vive en un modulo propio. Para un CRUD clasico como `product` o `user`,
la estructura base es:

- `application/`
- `infrastructure/`

No crear carpetas vacias para anticipar complejidad. Agregar:

- `domain/` solo cuando existan invariantes, entidades, value objects, eventos o servicios de dominio.
- `commands/` y `queries/` solo cuando CQRS aporte una separacion real.
- `events/`, `bootstrap/` o workers solo cuando el modulo consuma o publique eventos.
- `step-functions/` solo cuando exista una orquestacion AWS implementada.
- un scheduler dentro del modulo propietario o en infraestructura compartida; no como bounded context
  vacio por defecto.

Dentro de `infrastructure/`, usar `http/` para controllers y `persistence/` para Drizzle/PostgreSQL.
Los demas adaptadores se agregan cuando el caso de uso los exige.

### 2. Zod vive en application e infrastructure, no en domain

Se recomienda usar:

- `application/schemas/` para schemas Zod base del modulo, por ejemplo `productSchema`
- `application/dtos/` para contratos Zod de request y response derivados con `pick`, `omit`, `extend` o `partial`
- los `*.dto.ts` son contratos Zod puros; las clases `createZodDto` viven en archivos hermanos `*.doc.ts`
- convencion de nombres:
  - `product-index.request.dto.ts` para query/params de `index`
  - `product-index.response.dto.ts` para response exitoso y errores de `index`
  - `product-store.request.dto.ts` para body/query/params de `store`
  - `product-store.response.dto.ts` para response exitoso y errores de `store`
  - no crear `*.query.dto.ts` o `*.params.dto.ts`; crear `.doc.ts` solo si NestJS/OpenAPI necesita una clase
- `infrastructure/persistence/drizzle/` y `drizzle-zod` para insert/select schemas de base de datos

El `domain/` debe seguir libre de Nest, Zod HTTP y detalles de base de datos.

### 2.1 Cache vive en application e infrastructure, no en domain

Se recomienda usar:

- `shared/application/cache/` para puertos como `cache.port.ts` y builders de keys
- `shared/infrastructure/cache/` para adapters reales como Valkey/ElastiCache o `noop`
- la decision de cachear una query vive en `application/`
- la implementacion concreta vive en `infrastructure/`

Evitar:

- meter cache dentro de entidades de `domain/`
- acoplar casos de uso a un cliente concreto de Valkey o Redis
- asumir que memoria local de Lambda es cache compartida

### 3. Swagger se genera desde Nest, no desde YAML manual

La documentacion de API ya no depende de un contrato escrito a mano para la capa `impl`. Ahora el source of truth para la implementacion es:

- controller Nest
- DTO Zod puro dentro de `application/dtos/*.request.dto.ts` y `*.response.dto.ts`
- adaptadores `createZodDto` backend-only dentro de `application/dtos/*.request.doc.ts` y `*.response.doc.ts`
- decoradores `@nestjs/swagger`

Luego un script exporta `openapi.json` a `docs/openapi/`.

### 4. CDK reemplaza a Serverless Framework

Los archivos `serverless.yaml`, `functions.cloud.yaml` y `resources.yml` pasan a constructs y stacks de CDK:

- `api.stack.ts`
- `database.stack.ts`
- `network.stack.ts`
- `observability.stack.ts`

Esto reduce plantillas YAML dispersas y centraliza la infraestructura en TypeScript.

---

## Reutilizables compartidos

Estos archivos no pertenecen a un modulo de negocio especifico. Viven en `shared/` para que
`product`, `user` o `upload` no repitan validaciones comunes.

```text
src/shared/
|-- application/
|   |-- schemas/
|   |   |-- query.schema.ts                  # cursor + offset/limit + sort
|   |   |-- paginator.schema.ts              # response paginada
|   |   `-- timestamp.schema.ts              # created_at, updated_at
|   `-- dtos/
|       `-- api-error.response.ts
`-- infrastructure/
    |-- config/
    |   |-- config-loader.ts
    |   `-- environment.schema.ts
    |-- database/                            # modulo, schema, types y seed runner
    |-- docs/
    |   `-- swagger.config.ts
    |-- env/
    |   `-- read-env.ts
    |-- http/
    |   |-- decorators/
    |   `-- pipes/
    |       |-- zod.pipe.ts                  # valida body
    |       `-- zod-query.pipe.ts            # valida query params
    |-- persistence/
    |   `-- drizzle/
    |       `-- custom-types/
    |           `-- numeric-custom-types.ts  # numeric exacto y numeric para metricas
    `-- security/                            # guards, roles, public y request autenticado
```

Reglas:

- `querySchema` se reutiliza para listados con cursor hibrido y `offset/limit`.
- `createPaginatorSchema(itemSchema)` se reutiliza para responses paginadas.
- `timestampSchema` evita repetir `created_at` y `updated_at`.
- `ZodPipe` valida body; `ZodQueryPipe` valida query params.
- `numericStringCustom` se usa para dinero o valores exactos; `numericNumberCustom` solo para metricas no monetarias.
- configuracion, seguridad y persistencia transversal viven en `shared/infrastructure/`.

---

## Ejemplo referencial de una feature de negocio `product`

La idea es que el flujo sea facil de leer:

`product` es un modulo que existe de verdad en `bus-impl`, asi que los ejemplos de abajo se pueden
contrastar con el codigo real en vez de quedarse en una feature imaginaria. No implica que todos los
proyectos necesiten ese modulo ni que un CRUD simple requiera todas sus capas.

```text
schema base -> request/response DTO -> controller -> application service -> repository port -> Drizzle repository
```

### 1. Schema base

```typescript
// src/product/application/schemas/product.schema.ts
import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().int().positive(),
  nro_poliza: z.string().min(1).max(30),
  product_type: z.enum(['inclusion', 'exclusion']),
  fecha_inicio: z.iso.date(),
  broker_id: z.number().int().positive(),
});

export type ProductSchema = z.infer<typeof productSchema>;
```

### 2. DTOs de application

```typescript
// src/product/application/dtos/product-store.request.dto.ts
import { z } from 'zod';
import { productSchema } from '@/product/application/schemas/product.schema';

export const productStoreRequestDto = productSchema.pick({
  nro_poliza: true,
  product_type: true,
  fecha_inicio: true,
  broker_id: true,
});

export type ProductStoreRequestDto = z.infer<typeof productStoreRequestDto>;

```

```typescript
// src/product/application/dtos/product-update.request.dto.ts
import { z } from 'zod';
import { productStoreRequestDto } from './product-store.request.dto';

export const productUpdateRequestDto = productStoreRequestDto.partial();

export type ProductUpdateRequestDto = z.infer<typeof productUpdateRequestDto>;
```

```typescript
// src/product/application/dtos/product-index.request.dto.ts
import { z } from 'zod';
import { querySchema } from '@/shared/application/schemas/query.schema';
import { productSchema } from '@/product/application/schemas/product.schema';

export const productIndexQueryDto = productSchema
  .pick({
    nro_poliza: true,
    product_type: true,
  })
  .partial()
  .extend(querySchema.shape);

export type ProductIndexQueryDto = z.infer<typeof productIndexQueryDto>;

```

```typescript
// src/product/application/dtos/product-index.response.dto.ts
import { z } from 'zod';
import { createPaginatorSchema } from '@/shared/application/schemas/paginator.schema';
import { productSchema } from '@/product/application/schemas/product.schema';

export const productIndexResponseDto = createPaginatorSchema(
  productSchema.pick({
    id: true,
    nro_poliza: true,
    product_type: true,
  }),
);

export type ProductIndexResponseDto = z.infer<typeof productIndexResponseDto>;

```

```typescript
// src/product/application/dtos/product-show.response.dto.ts
import { z } from 'zod';
import { productSchema } from '@/product/application/schemas/product.schema';

export const productShowResponseDto = z.object({
  success: z.literal(true),
  product: productSchema.pick({
    id: true,
    nro_poliza: true,
    product_type: true,
  }),
});

export type ProductShowResponseDto = z.infer<typeof productShowResponseDto>;
```

```typescript
// src/product/application/dtos/product-store.response.dto.ts
import { z } from 'zod';
import { productShowResponseDto } from './product-show.response.dto';

export const productStoreResponseDto = productShowResponseDto;

export type ProductStoreResponseDto = z.infer<typeof productStoreResponseDto>;

```

```typescript
// src/product/application/dtos/product-update.response.dto.ts
import { z } from 'zod';
import { productShowResponseDto } from './product-show.response.dto';

export const productUpdateResponseDto = productShowResponseDto;

export type ProductUpdateResponseDto = z.infer<typeof productUpdateResponseDto>;
```

```typescript
// src/product/application/dtos/product-destroy.response.dto.ts
import { z } from 'zod';

export const productDestroyResponseDto = z.object({
  success: z.literal(true),
  message: z.string(),
});

export type ProductDestroyResponseDto = z.infer<typeof productDestroyResponseDto>;
```

### 3. Doc DTOs backend-only

Si Swagger o Scalar necesitan clases, se declaran en archivos hermanos `.doc.ts`. Estos adaptadores no se exportan en `src/contracts.ts` ni se publican al frontend.

```typescript
// src/product/application/dtos/product-store.request.doc.ts
import { createZodDto } from 'nestjs-zod';
import { productStoreRequestDto } from './product-store.request.dto';

export class ProductStoreRequestDocDto extends createZodDto(productStoreRequestDto) {}
```

```typescript
// src/product/application/dtos/product-index.response.doc.ts
import { createZodDto } from 'nestjs-zod';
import { productIndexResponseDto } from './product-index.response.dto';

export class ProductIndexResponseDocDto extends createZodDto(productIndexResponseDto) {}
```

### 4. Controller

```typescript
// src/product/infrastructure/http/controllers/product.controller.ts
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ProductIndexQueryDocDto } from '@/product/application/dtos/product-index.request.doc';
import {
  productIndexQueryDto,
  type ProductIndexQueryDto,
} from '@/product/application/dtos/product-index.request.dto';
import { ProductStoreRequestDocDto } from '@/product/application/dtos/product-store.request.doc';
import {
  productStoreRequestDto,
  type ProductStoreRequestDto,
} from '@/product/application/dtos/product-store.request.dto';
import { ProductIndexResponseDocDto } from '@/product/application/dtos/product-index.response.doc';
import type { ProductIndexResponseDto } from '@/product/application/dtos/product-index.response.dto';
import { ProductStoreResponseDocDto } from '@/product/application/dtos/product-store.response.doc';
import type { ProductStoreResponseDto } from '@/product/application/dtos/product-store.response.dto';
import { ProductApplicationService } from '@/product/application/service/product.application-service';
import { ZodPipe } from '@/shared/infrastructure/http/pipes/zod.pipe';
import { ZodQueryPipe } from '@/shared/infrastructure/http/pipes/zod-query.pipe';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductApplicationService) {}

  @Get()
  @ApiOperation({ summary: 'Indexar products' })
  @ApiQuery({ type: ProductIndexQueryDocDto })
  @ZodResponse({ status: 200, type: ProductIndexResponseDocDto })
  index(
    @Query(new ZodQueryPipe(productIndexQueryDto)) query: ProductIndexQueryDto,
  ): Promise<ProductIndexResponseDto> {
    return this.service.index(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear product' })
  @ApiBody({ type: ProductStoreRequestDocDto })
  @ZodResponse({ status: 201, type: ProductStoreResponseDocDto })
  store(
    @Body(new ZodPipe(productStoreRequestDto)) body: ProductStoreRequestDto,
  ): Promise<ProductStoreResponseDto> {
    return this.service.store(body);
  }
}
```

### 5. Application service

```typescript
// src/product/application/service/product.application-service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ProductIndexQueryDto } from '@/product/application/dtos/product-index.request.dto';
import type { ProductStoreRequestDto } from '@/product/application/dtos/product-store.request.dto';
import type { ProductIndexResponseDto } from '@/product/application/dtos/product-index.response.dto';
import type { ProductStoreResponseDto } from '@/product/application/dtos/product-store.response.dto';
import type { IProductRepository } from '@/product/application/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '@/product/application/repositories/product.repository.token';

@Injectable()
export class ProductApplicationService {
  private readonly logger = new Logger(ProductApplicationService.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: IProductRepository,
  ) {}

  async index(query: ProductIndexQueryDto): Promise<ProductIndexResponseDto> {
    this.logger.log({ action: 'product.index', query }, 'Indexing products');

    return this.repository.index(query);
  }

  async store(body: ProductStoreRequestDto): Promise<ProductStoreResponseDto> {
    this.logger.log({ action: 'product.store', broker_id: body.broker_id }, 'Storing product');

    const persisted = await this.repository.store(body);

    return {
      success: true,
      product: {
        id: persisted.id,
        nro_poliza: persisted.nro_poliza,
        product_type: persisted.product_type,
      },
    };
  }
}
```

Reglas del ejemplo:

- `application/dtos/` usa Zod y `z.infer` para request/response.
- los schemas comunes (`querySchema`, `createPaginatorSchema`, `timestampSchema`) viven en `shared/application/schemas/`.
- las clases `createZodDto` viven en `.doc.ts` y nunca dentro del contrato público.
- `ZodPipe` valida body y `ZodQueryPipe` valida query params.
- el controller no arma respuestas; delega al application service.
- los imports usan aliases absolutos como `@/product/...`.
- el domain no importa Nest, Drizzle ni AWS.
- Para CRUD simple no crear entities de dominio por obligacion; usar DTOs Zod, service y repository.

---

## Archivos raiz obligatorios

| Archivo | Proposito |
|---|---|
| `package.json` | scripts `pnpm`, dependencias y engines |
| `pnpm-lock.yaml` | lockfile canonico |
| `biome.json` | lint, format y organize imports |
| `vitest.config.ts` | tests unitarios base |
| `vitest.integration.config.ts` | tests con PostgreSQL real |
| `playwright.config.ts` | smoke y e2e sobre HTTP/docs |
| `drizzle.config.ts` | generate/migrate/check |
| `cdk.json` | contexto de infraestructura |
| `tsconfig.json` | TypeScript 6 en modo estricto |

---

## Diferencia clave frente al repo original

El `bus-impl` anterior tenia una fuerte mezcla de:

- handlers genericos
- middleware que normalizaba todo
- configuracion serverless en varios YAML

El actualizado separa mejor la entrada:

- HTTP con controllers REST tipados
- workers async con handlers explicitos
- documentacion OpenAPI generada desde Nest
- persistencia relacional via Drizzle
