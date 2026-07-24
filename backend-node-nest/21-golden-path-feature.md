# Golden Path de Feature - `bus-impl`

Este es el flujo oficial para una feature CRUD normal en `bus-impl`.

```text
schema Zod -> request/response DTO -> controller -> service -> repository port -> Drizzle repository
```

## Regla principal

Para CRUD simple no crear `domain/entities`. La entity de dominio solo existe si hay comportamiento real como transiciones de estado, reglas complejas, eventos de dominio o invariantes que no son solo validacion de entrada.

## Estructura por feature

```text
src/endoso/
|-- application/
|   |-- schemas/
|   |   `-- endoso.schema.ts
|   |-- dtos/
|   |   |-- endoso-index.request.dto.ts
|   |   |-- endoso-index.response.dto.ts
|   |   |-- endoso-store.request.dto.ts
|   |   |-- endoso-store.response.dto.ts
|   |   |-- endoso-update.request.dto.ts
|   |   `-- endoso-update.response.dto.ts
|   |-- repositories/
|   |   |-- endoso.repository.interface.ts
|   |   `-- endoso.repository.token.ts
|   `-- service/
|       `-- endoso.application-service.ts
`-- infrastructure/
    |-- http/
    |   |-- controllers/
    |   |   `-- endoso.controller.ts
    |   `-- dtos/ # solo adaptadores excepcionales; por defecto createZodDto vive en application/dtos
    `-- persistence/
        `-- drizzle/
            |-- schema.ts
            `-- endoso.repository.ts
```

## Convenciones obligatorias

- Controllers y services usan `index`, `show`, `store`, `update`, `destroy`.
- Request DTO: `endoso-store.request.dto.ts`, `endoso-update.request.dto.ts`, `endoso-index.request.dto.ts`.
- Response DTO: `endoso-index.response.dto.ts`, `endoso-store.response.dto.ts`.
- Class DTO Swagger: vive dentro del request/response DTO cuando hace falta.
- Services y controllers retornan `ResponseDto`, no filas crudas de Drizzle.
- Drizzle vive solo en `infrastructure/persistence/drizzle`.
- El repository port vive en `application/repositories`.

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
