# DTOs públicos y adaptadores de documentación

Convención canónica 2026:

```text
feature-action.request.dto.ts   # Zod puro + tipos inferidos; público y browser-safe
feature-action.request.doc.ts   # createZodDto; solo NestJS/OpenAPI
feature-action.response.dto.ts  # Zod puro + tipos inferidos; público y browser-safe
feature-action.response.doc.ts  # createZodDto; solo NestJS/OpenAPI
```

Los archivos `.doc.ts` se crean solo cuando Swagger/Scalar necesita una clase. No cuentan como
otro contrato: son adaptadores de infraestructura derivados del DTO puro.

## 1. Regla de frontera

- `*.dto.ts` puede importar Zod, schemas y otros contratos públicos.
- `*.dto.ts` no puede importar `nestjs-zod`, `@nestjs/*`, Node built-ins ni infraestructura.
- `*.doc.ts` puede importar `createZodDto` y exactamente el schema del DTO hermano.
- `src/contracts.ts` exporta DTOs/schemas/types, nunca `*.doc.ts`.
- services y controllers retornan tipos `*Dto`; `*DocDto` solo aparece en decoradores.

La separación es obligatoria aunque exista tree shaking. `createZodDto(schema)` se ejecuta al
evaluar el módulo y obliga al bundler a resolver NestJS; tree shaking no es una frontera confiable.

## 2. Request público

Body, query y params del mismo caso de uso viven en un único `*.request.dto.ts`:

```typescript
// src/user/application/dtos/user-store.request.dto.ts
import type { z } from 'zod';
import { userStoreSchema } from '../schemas/user.schema';

export const userStoreRequestDto = userStoreSchema;
export type UserStoreRequestDto = z.infer<typeof userStoreRequestDto>;
```

Adaptador backend:

```typescript
// src/user/application/dtos/user-store.request.doc.ts
import { createZodDto } from 'nestjs-zod';
import { userStoreRequestDto } from './user-store.request.dto';

export class UserStoreRequestDocDto extends createZodDto(userStoreRequestDto) {}
```

Para un listado:

```typescript
// src/user/application/dtos/user-index.request.dto.ts
import type { z } from 'zod';
import { querySchema } from '@/shared/application/schemas/query.schema';
import { userIndexFilterSchema } from '../schemas/user.schema';

export const userIndexQueryDto = userIndexFilterSchema.partial().extend(querySchema.shape);
export type UserIndexQueryDto = z.infer<typeof userIndexQueryDto>;
```

```typescript
// src/user/application/dtos/user-index.request.doc.ts
import { createZodDto } from 'nestjs-zod';
import { userIndexQueryDto } from './user-index.request.dto';

export class UserIndexQueryDocDto extends createZodDto(userIndexQueryDto) {}
```

Reglas:

- no crear `*.query.dto.ts`, `*.params.dto.ts` o `*.body.dto.ts` por defecto;
- derivar con `pick`, `omit`, `partial` y `extend` dentro del DTO del endpoint;
- no duplicar defaults de Drizzle/PostgreSQL en el request;
- usar `nullable()` cuando el cliente debe enviar ausencia explícita;
- reservar `optional()` para query/filtros y PATCH;
- no crear interfaces manuales que dupliquen `z.infer`.

## 2.1 Derivación obligatoria de tipos

La fuente de verdad es el schema base y su tipo inferido. No inventar un tipo paralelo si el dato
ya existe en la feature:

```typescript
export type UserSchema = z.infer<typeof userSchema>;

export type UserIdentity = Pick<
  UserSchema,
  'id' | 'email' | 'full_name'
>;

export type UserWithoutAudit = Omit<
  UserSchema,
  'created_at' | 'updated_at'
>;

export type UserWithProduct = UserPublicSchema & {
  product: Pick<ProductSchema, 'id' | 'nombre' | 'status'>;
};
```

Usar `Pick<T, K>`, `Omit<T, K>`, `Partial<T>`, `Required<T>`, `Readonly<T>` e intersecciones
(`A & { extra: X }`) para proyecciones y composiciones type-only. `interface X extends Y` también
es válido cuando existe una relación clara; no usar herencia solo para esconder una duplicación.

TypeScript desaparece en runtime. Si la forma debe validarse en requests, responses, eventos o
datos externos, derivar primero el schema Zod y luego inferir el tipo:

```typescript
export const userWithProductSchema = userPublicSchema.extend({
  product: productPublicSchema.pick({
    id: true,
    nombre: true,
    status: true,
  }),
});

export type UserWithProduct = z.infer<typeof userWithProductSchema>;
```

`Pick<>` u `Omit<>` solos no sustituyen `.pick()` u `.omit()` cuando se necesita validación. No
repetir manualmente campos de `UserSchema`, `ProductSchema` ni de otro contrato. Si un tipo agrega
formato o datos exclusivos de UI, nombrarlo `*ViewModel` y derivar sus campos de la fuente original.

## 3. Response público

```typescript
// src/user/application/dtos/user-store.response.dto.ts
import { z } from 'zod';
import { userPublicSchema } from '../schemas/user.schema';

export const userStoreResponseDto = z.object({
  success: z.literal(true),
  user: userPublicSchema,
});

export type UserStoreResponseDto = z.infer<typeof userStoreResponseDto>;
```

```typescript
// src/user/application/dtos/user-store.response.doc.ts
import { createZodDto } from 'nestjs-zod';
import { userStoreResponseDto } from './user-store.response.dto';

export class UserStoreResponseDocDto extends createZodDto(userStoreResponseDto) {}
```

Errores transversales reutilizables viven en `shared/application/dtos`; sus adaptadores Swagger
también van en archivos `.doc.ts`. No dupliques el mismo error en cada feature.

## 4. Controller

```typescript
import { UserStoreRequestDocDto } from '@/user/application/dtos/user-store.request.doc';
import {
  userStoreRequestDto,
  type UserStoreRequestDto,
} from '@/user/application/dtos/user-store.request.dto';
import { UserStoreResponseDocDto } from '@/user/application/dtos/user-store.response.doc';
import type { UserStoreResponseDto } from '@/user/application/dtos/user-store.response.dto';

@Post()
@ApiBody({ type: UserStoreRequestDocDto })
@ZodResponse({ status: 201, type: UserStoreResponseDocDto })
store(
  @Body(new ZodPipe(userStoreRequestDto)) body: UserStoreRequestDto,
): Promise<UserStoreResponseDto> {
  return this.service.store(body);
}
```

## 5. Paquete compartido backend/frontend

El backend es dueño del contrato y publica un paquete independiente, por ejemplo
`@vigilioyonatan/bus-contracts`. El paquete contiene únicamente el barrel browser-safe compilado,
declara `sideEffects: false` y depende solo de Zod como runtime/peer dependency.

Desarrollo local:

```powershell
# bus-impl
pnpm dev:contracts

# web-mfe, una vez
pnpm link ..\bus-impl\packages\contracts
```

CI y producción deben instalar una versión publicada exacta. No usar `link:`, `file:`,
`workspace:*` ni `latest` fuera del desarrollo local.

## 6. Definition of Done

- el generador excluye `*.doc.ts`;
- falla si un contrato público importa NestJS;
- el paquete genera `.js` y `.d.ts` válidos;
- un bundle de navegador no contiene `nestjs-zod`, `@nestjs/*` ni Node built-ins;
- backend typecheck/tests/OpenAPI pasan;
- frontend typecheck/tests/build y validación de drift pasan;
- no queda una copia manual de los DTOs en frontend.
