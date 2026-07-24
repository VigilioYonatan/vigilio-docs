# DTOs Request y Response - Convencion 2 Archivos

Nueva regla del proyecto:

```text
Por cada accion/caso de uso debe haber maximo 2 archivos DTO:

feature-action.request.dto.ts
feature-action.response.dto.ts
```

Ejemplo:

```text
user-store.request.dto.ts
user-store.response.dto.ts
user-index.request.dto.ts
user-index.response.dto.ts
user-show.request.dto.ts
user-show.response.dto.ts
```

## 1. Que vive en `*.request.dto.ts`

Todo lo que entra al endpoint:

- `body`.
- `query`.
- `params`.
- tipos inferidos del request.
- class DTOs de request para Swagger cuando hacen falta.
- schemas derivados del endpoint usando el schema base de `application/schemas`.

Ejemplo:

```typescript
// src/user/application/dtos/user-store.request.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { userSchema } from '../schemas/user.schema';

export const userStoreBodyDto = userSchema.pick({
  email: true,
  full_name: true,
  password: true,
  role: true,
  status: true,
});

export const userStoreQueryDto = z.object({});

export const userStoreParamsDto = z.object({});

export type UserStoreBodyDto = z.infer<typeof userStoreBodyDto>;
export type UserStoreQueryDto = z.infer<typeof userStoreQueryDto>;
export type UserStoreParamsDto = z.infer<typeof userStoreParamsDto>;

export class UserStoreBodyClassDto extends createZodDto(userStoreBodyDto) {}
```

Para `index`, el query tambien vive en request:

```typescript
// src/user/application/dtos/user-index.request.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { querySchema } from '@/shared/application/schemas/query.schema';
import { userSchema } from '../schemas/user.schema';

export const userIndexQueryDto = userSchema
  .pick({
    role: true,
    status: true,
    provider: true,
  })
  .partial()
  .extend(querySchema.shape);

export const userIndexParamsDto = z.object({});

export type UserIndexQueryDto = z.infer<typeof userIndexQueryDto>;
export type UserIndexParamsDto = z.infer<typeof userIndexParamsDto>;

export class UserIndexQueryClassDto extends createZodDto(userIndexQueryDto) {}
```

Regla:

- no crear `*.query.dto.ts` separado.
- no crear `*.params.dto.ts` separado.
- no crear `*.body.dto.ts` separado.
- no poner DTOs especificos de endpoint dentro de `application/schemas`.
- `pick`, `omit`, `partial` y `extend` del request viven dentro de `*.request.dto.ts`.
- los schemas derivados reutilizables entre varios endpoints si pueden vivir en `application/schemas`.
- no usar `.default(...)` en request DTO para repetir defaults que ya existen en Drizzle/PostgreSQL.
- si un campo tiene default en Drizzle/PostgreSQL, no incluirlo en el `store.request.dto.ts`.
- si un campo acepta `NULL` y el cliente debe poder dejarlo vacio, usar `nullable` y exigir que envie `null`.
- evitar `.optional()` en body DTOs de `store/create`; reservar omision real para query params, filtros y `partial()` de `update/PATCH`.
- si el endpoint no usa body/query/params, se puede omitir el schema vacio.

## 2. Que vive en `*.response.dto.ts`

Todo lo que sale del endpoint:

- response exitoso.
- responses especiales `3xx` si el endpoint redirige o devuelve accepted/async flow documentado.
- errores esperados del endpoint.
- errores de validacion.
- class DTOs de response para Swagger cuando hacen falta.
- tipos inferidos del response.

Ejemplo:

```typescript
// src/user/application/dtos/user-store.response.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  apiErrorResponseDto,
  apiValidationErrorResponseDto,
} from '@/shared/application/dtos/api-error.response';
import { userPublicSchema } from '../schemas/user.schema';

export const userStoreResponseDto = z.object({
  success: z.literal(true),
  user: userPublicSchema,
});

export const userStoreConflictResponseDto = apiErrorResponseDto.extend({
  statusCode: z.literal(409),
  message: z.literal('El email ya esta registrado'),
});

export const userStoreValidationResponseDto = apiValidationErrorResponseDto;
export const userStoreUnexpectedResponseDto = apiErrorResponseDto.extend({
  statusCode: z.literal(500),
});

export type UserStoreResponseDto = z.infer<typeof userStoreResponseDto>;
export type UserStoreConflictResponseDto = z.infer<typeof userStoreConflictResponseDto>;

export class UserStoreResponseClassDto extends createZodDto(userStoreResponseDto) {}
export class UserStoreConflictResponseClassDto extends createZodDto(userStoreConflictResponseDto) {}
export class UserStoreValidationResponseClassDto extends createZodDto(
  userStoreValidationResponseDto,
) {}
```

Regla:

- no crear `*.response.class.dto.ts` separado por defecto.
- si hay class DTO para Swagger, va dentro del mismo `*.response.dto.ts`.
- responses especiales `3xx` y errores `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500` viven junto al response del caso de uso.
- responses globales reutilizables pueden vivir en `shared/application/dtos/`.

## 3. Naming

Usar nombres de accion:

```text
user-index.request.dto.ts
user-index.response.dto.ts
user-show.request.dto.ts
user-show.response.dto.ts
user-store.request.dto.ts
user-store.response.dto.ts
user-update.request.dto.ts
user-update.response.dto.ts
user-destroy.request.dto.ts
user-destroy.response.dto.ts
```

No usar:

```text
user-index.query.dto.ts
user-store.dto.ts
user-show.response.ts
user-store.response.class.dto.ts
```

## 4. Controller

```typescript
import {
  UserStoreBodyClassDto,
  userStoreBodyDto,
  type UserStoreBodyDto,
} from '@/user/application/dtos/user-store.request.dto';
import {
  UserStoreResponseClassDto,
  userStoreResponseDto,
  type UserStoreResponseDto,
} from '@/user/application/dtos/user-store.response.dto';

@Post()
@ApiBody({ type: UserStoreBodyClassDto })
@ZodResponse({ status: 201, type: UserStoreResponseClassDto })
store(@Body(new ZodPipe(userStoreBodyDto)) body: UserStoreBodyDto): Promise<UserStoreResponseDto> {
  return this.service.store(body);
}
```

## 5. Regla senior

Esta convencion reduce archivos sin perder claridad:

- request agrupa entrada.
- response agrupa salida.
- schemas base siguen en `application/schemas`.
- pipes siguen en `shared/infrastructure/http/pipes`.
- controllers no arman contratos; solo los consumen.
- services retornan `ResponseDto`, nunca `ClassDto`.
