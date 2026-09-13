# Golden Path de Feature - `bus-impl`

Este es el flujo oficial para una feature CRUD normal en `bus-impl`.

```text
schema Zod -> request/response DTO -> controller -> service -> repository port -> Drizzle repository
```

## Regla principal

Para CRUD simple no crear `domain/entities`. La entity de dominio solo existe si hay comportamiento real como transiciones de estado, reglas complejas, eventos de dominio o invariantes que no son solo validacion de entrada.

## Estructura por feature

```text
src/product/
|-- application/
|   |-- constants/
|   |   `-- product-limits.constant.ts
|   |-- schemas/
|   |   `-- product.schema.ts
|   |-- dtos/
|   |   |-- product-index.request.dto.ts
|   |   |-- product-index.response.dto.ts
|   |   |-- product-store.request.dto.ts
|   |   |-- product-store.response.dto.ts
|   |   |-- product-update.request.dto.ts
|   |   `-- product-update.response.dto.ts
|   |-- repositories/
|   |   |-- product.repository.interface.ts
|   |   `-- product.repository.token.ts
|   |-- service/
|   |   `-- product.application-service.ts
|   `-- types/
|       `-- product-filter.type.ts
`-- infrastructure/
    |-- http/
    |   |-- controllers/
    |   |   `-- product.controller.ts
    |   `-- dtos/ # contratos puros *.dto.ts y adaptadores Nest/OpenAPI *.doc.ts
    `-- persistence/
        `-- drizzle/
            |-- schema.ts
            `-- product.repository.ts
```

## Convenciones obligatorias

- Controllers y services usan `index`, `show`, `store`, `update`, `destroy`.
- Request DTO: `product-store.request.dto.ts`, `product-update.request.dto.ts`, `product-index.request.dto.ts`.
- Response DTO: `product-index.response.dto.ts`, `product-store.response.dto.ts`.
- Doc DTO Swagger: vive en el archivo hermano `*.request.doc.ts` o `*.response.doc.ts` cuando hace falta.
- Services y controllers retornan `ResponseDto`, no filas crudas de Drizzle.
- Drizzle vive solo en `infrastructure/persistence/drizzle`.
- El repository port vive en `application/repositories`.
- Los tipos propios viven en `types/` dentro de su feature y capa.
- Las constantes propias viven en `constants/` dentro de su feature y capa.
- Controllers y services no declaran tipos o constantes arriba de la clase.
- Los tipos Zod inferidos permanecen junto al schema propietario.

Bien:

```ts
// application/types/product-filter.type.ts
export type ProductFilter = { status?: ProductStatus };

// application/constants/product-limits.constant.ts
export const PRODUCT_PAGE_LIMIT = 100;
```

Mal:

```ts
type ProductFilter = { status?: string };
const LIMIT = 100;
export class ProductController {}
```

## Cuando si usar `domain/`

Usar `domain/` cuando la feature tenga:

- estados con transiciones reales, por ejemplo `aprobar`, `anular`, `rechazar`
- invariantes que deben cumplirse aunque cambie HTTP, worker o DB
- eventos de dominio antes del outbox
- politicas de negocio reutilizadas por varios casos de uso

Si no existe eso, mantener CRUD simple.

## Checklist 10/10 antes del PR

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:coverage`
- `pnpm openapi:export`
- `pnpm openapi:diff`
- DTOs derivados de schemas con `pick`, `omit`, `partial` o `extend`
- Query validada con `ZodQueryPipe`
- Body validado con `ZodPipe`
- OpenAPI/Scalar actualizado
- Repository testeado con PostgreSQL real si toca Drizzle
- Sin secretos, `any`, imports relativos largos ni log de payload sensible
