# Contratos, Zod, Formularios Y TanStack Mobile

Fuentes ejecutables: `bus-impl/packages/contracts`, `@vigilioyonatan/bus-contracts` y los gates de
contrato/OpenAPI del consumidor. La app no es owner de DTOs HTTP.

## Objetivo

Consumir contratos publicados por el backend sin copiarlos y validar datos no confiables en el borde
HTTP antes de guardarlos en TanStack Query o entregarlos a una screen.

```text
input nativo -> schema de formulario UI -> request DTO publicado -> service HTTP
response unknown -> response schema publicado -> query cache -> screen
```

## Fuente Única Del Contrato

- Fijar una versión exacta de `@vigilioyonatan/bus-contracts` y su integridad en el lockfile.
- Importar request DTOs, response DTOs, enums y schemas runtime desde el paquete publicado.
- No importar `bus-impl/src`, NestJS, repositorios, entidades de base de datos ni adapters cloud.
- No crear `libs/contracts`, `src/contracts` o `types/` como mirror del backend.
- `src/contracts` solo puede contener una proyección/adaptación temporal del borde, documentada con
  owner y condición de eliminación; nunca vuelve a declarar todos los campos.

Una incompatibilidad debe fallar en `ApiClient`/`*.api.ts`, producir telemetría sin payload ni PII y
evitar que datos no confiables lleguen a la UI.

## Derivación De Tipos Sin Duplicación

Los tipos HTTP vienen de `@vigilioyonatan/bus-contracts`. No volver a escribir un DTO, schema, enum
o interface con los mismos campos. Cuando React Native necesita una proyección, derivarla:

```typescript
import type {
  UserPublicSchema,
  UserStoreRequestDto,
} from '@vigilioyonatan/bus-contracts';

type UserRow = Pick<
  UserPublicSchema,
  'id' | 'email' | 'full_name' | 'status'
>;

type UserStoreFormProps = {
  defaults?: Partial<Pick<UserStoreRequestDto, 'role' | 'status'>>;
};

type UserRowWithActions = UserRow & {
  onEdit: (id: UserRow['id']) => void;
};
```

Usar `Pick`, `Omit`, `Partial`, `Readonly`, acceso indexado e intersecciones para props, rows y
ViewModels type-only. Por ejemplo:

```typescript
import type { ProductIndexResponseDto } from '@vigilioyonatan/bus-contracts';

type ProductRow = ProductIndexResponseDto['results'][number];
type ProductRowProps = Readonly<{
  product: Pick<ProductRow, 'id' | 'nombre' | 'precio' | 'status'>;
  onPress: (id: ProductRow['id']) => void;
}>;
```

Estas utilidades TypeScript no validan runtime. La respuesta completa continúa validándose con el
schema Zod publicado. Crear un ViewModel nuevo solo cuando componga estado exclusivamente visual;
derivarlo del contrato y probar su mapper. No crear `UserDto`, `ProductType`, `UserTest` ni enums
paralelos.

## React Hook Form Y Adaptación Nativa

> [!IMPORTANT]
> **Regla Principal (Caso Estándar):** En la mayoría de los casos **NO SE CREARÁ** un schema de formulario local como `const productStoreFormSchema = z.object({ ... })`. 
> 
> Se debe consumir **directamente el request DTO** publicado desde el paquete de contratos del proyecto (ej. `@vigilioyonatan/bus-contracts` — *nota: el nombre del paquete variará según el proyecto*).

### 1. Caso Estándar (Mayoría de los casos)

Si los controles coinciden con los tipos esperados por el DTO, se pasa directamente el `productStoreRequestDto` al resolver de React Hook Form:

```typescript
import {
  productStoreRequestDto,
  type ProductStoreRequestDto,
} from '@vigilioyonatan/bus-contracts'; // Nota: El paquete de contratos varía según el proyecto
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// MAYORMENTE SERÁ ASÍ: Uso directo del contrato publicado
const productStoreForm = useForm<ProductStoreRequestDto>({
  resolver: zodResolver(productStoreRequestDto),
});
```

### 2. Caso Excepcional (Adaptación Nativa/Local)

Solo cuando un control nativo (`TextInput`) requiera representar números, fechas o `null` temporalmente como texto antes de enviar al backend, se define un schema local intermedio `const productStoreFormSchema = z.object(...)` y su mapper explicito:

```typescript
import {
  type ProductStoreRequestDto,
  productStoreRequestDto,
} from '@vigilioyonatan/bus-contracts'; // Nota: El paquete de contratos varía según el proyecto
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// SOLO CUANDO SE NECESITE ADAPTACIÓN DE TIPOS EN LA UI:
const productStoreFormSchema = z.object({
  descripcion: z.string(),
  nombre: z.string().trim().min(1),
  precio: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  stock: z.string().regex(/^\d+$/),
});

type ProductStoreForm = z.infer<typeof productStoreFormSchema>;

function toProductStoreRequest(value: ProductStoreForm): ProductStoreRequestDto {
  return productStoreRequestDto.parse({
    ...value,
    descripcion: value.descripcion.trim() || null,
    stock: Number(value.stock),
  });
}

const productStoreForm = useForm<ProductStoreForm>({
  resolver: zodResolver(productStoreFormSchema),
});
```

El schema local no puede cambiar required/nullable, límites o reglas de negocio para aceptar algo que el request DTO rechaza. Cada `TextInput` mantiene label accesible, error asociado, teclado adecuado y estado disabled/pending.

## TanStack Query

TanStack Query posee server state. Las keys son factories estables y contienen todo filtro que cambia
el resultado:

```typescript
import type { ProductIndexQueryDto } from '@vigilioyonatan/bus-contracts';

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductIndexQueryDto) => [...productKeys.all, 'list', filters] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
};
```

- Conectar `onlineManager` con NetInfo y `focusManager` con AppState.
- `queryFn` retorna datos ya parseados por el response schema.
- `select` crea proyecciones de lectura; no altera el contrato almacenado sin necesidad.
- Invalidar el scope mínimo afectado por una mutation.
- Reintentar queries solo ante fallos transitorios.
- No reintentar uploads o comandos no idempotentes sin idempotency key y semántica probada.
- No copiar responses completas a Signals, Zustand o AsyncStorage.

## Gates

- Gobierno de versión exacta, integridad y exports del paquete.
- Pruebas de payload válido, inválido y drift del response schema.
- Pruebas del mapper de formulario y de los services `*.api.ts`.
- Pruebas de query/mutation, retry e invalidación.
- Typecheck sin `any`, `as unknown as` ni casts que oculten incompatibilidades.
- Diff OpenAPI/contratos en CI cuando el backend publique una versión nueva.

## No Hacer

- Copiar DTOs en screen, service, hook, fixture o `libs/contracts`.
- Usar response DTO como formulario cuando la representación nativa es distinta.
- Inventar defaults para campos ausentes del backend.
- Enviar una URI local del dispositivo como si fuese el contenido del archivo.
- Probar solo el happy path del schema o del mapper.
