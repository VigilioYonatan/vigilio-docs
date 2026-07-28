# Contratos DTO, Zod, React Hook Form Y TanStack

Fuentes ejecutables: `bus-impl/packages/contracts`, `@vigilioyonatan/bus-contracts` y los gates `governance:contracts`/OpenAPI del consumidor.

## Objetivo

Consumir en frontend los contratos HTTP definidos por `bus-impl` sin copiar DTOs y manteniendo validacion runtime en el navegador.

```text
*.request.dto.ts
  -> payload de formulario/query/mutation

*.response.dto.ts
  -> validacion de respuesta HTTP

*.request.doc.ts / *.response.doc.ts
  -> solo NestJS/OpenAPI; prohibido en frontend
```

El paquete publico es `@vigilioyonatan/bus-contracts`. Debe contener solo Zod, tipos inferidos y modulos browser-safe.

## React Hook Form

La aplicación configura el locale oficial de Zod 4.4 una sola vez en el bootstrap:

```typescript
// services/validation/zod-locale.ts
import { z } from 'zod';

z.config(z.locales.es());
```

La carga se hace antes de montar la aplicación y también en el setup de Vitest. Por eso un error
como `Too small: expected string to have >=12 characters` se muestra como:
`Demasiado pequeño: se esperaba que texto tuviera >=12 caracteres`.
Los mensajes personalizados definidos explícitamente en un schema no son reemplazados por el locale.

Usar el request schema como resolver y su tipo inferido como modelo del formulario. En este proyecto
se usa `nullableZodResolver` como adapter local para convertir controles vacios del navegador en
`null` antes de delegar al resolver oficial de Zod:

```typescript
import {
  productStoreRequestDto,
  type ProductStoreRequestDto,
} from '@vigilioyonatan/bus-contracts';
import { useForm } from 'react-hook-form';
import { nullableZodResolver } from '@/services/forms/nullable-zod-resolver';

const productStoreForm = useForm<ProductStoreRequestDto>({
  mode: 'onChange',
  reValidateMode: 'onChange',
  resolver: nullableZodResolver(productStoreRequestDto),
});
```

Reglas:

- No usar response DTO como schema de formulario.
- Respetar `nullable`, `optional`, defaults y coerciones del contrato.
- No crear otra interface para los mismos campos.
- Reglas exclusivamente visuales pueden vivir en frontend; no reemplazan validacion/autorizacion backend.

### Normalizacion `""` a `null`

`nullableZodResolver` ejecuta esta secuencia por cada validacion de React Hook Form:

```text
valores del formulario -> normalizacion recursiva -> schema Zod -> errores RHF
```

Implementación compartida y prueba adyacente:

```text
apps/{dominio-o-producto}/{aplicacion}/src/services/forms/
|-- nullable-zod-resolver.ts
`-- nullable-zod-resolver.test.ts
```

- `""` se convierte en `null` antes de validar.
- Arrays y objetos planos se recorren recursivamente.
- `File`, `Blob`, `Date` y otras instancias se preservan.
- El estado visual del `<input>` sigue siendo `""`; no se escribe `null` en el control.
- Un campo requerido que no acepta `null` sigue fallando, correctamente.
- El dato recibido por `handleSubmit` ya es el resultado validado por Zod.
- No copiar el parser interno de `@hookform/resolvers`; el adapter solo normaliza y delega.

No usar `z.preprocess` directamente con `useForm` para este caso: en Zod 4 puede convertir el
input del resolver en `unknown` y romper la inferencia de React Hook Form. La conversion queda
aislada en el boundary tipado del adapter.

## Derivación de tipos sin duplicación

Los tipos HTTP vienen de `@vigilioyonatan/bus-contracts`. No volver a escribir un DTO, schema,
enum o interface con los mismos campos. Cuando la UI necesita una proyección, derivarla:

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

Usar `Pick`, `Omit`, `Partial`, `Readonly` e intersecciones (`A & B`) para props, rows,
ViewModels y composiciones type-only. `interface X extends Y` también es válido cuando expresa una
relación clara; no usar herencia para esconder campos repetidos.

Si la UI recibe datos externos nuevos, `Pick<>` u `Omit<>` no validan runtime. La respuesta debe
seguir teniendo un `response.dto.ts`/schema Zod en `bus-impl`, y el frontend debe importar ese
schema publicado. Cuando la UI solo necesita formatear presentación, consumir el campo contractual
directamente:

```typescript
type ProductRow = ProductIndexResponseDto['results'][number];

function formatProductPrice(product: ProductRow): string {
  return formatMoney(product.precio);
}
```

No crear `UserTest`, `ProductType`, `UserDto` ni campos como `formattedPrice` repitiendo o
transformando datos del backend dentro del objeto de respuesta. Crear un ViewModel solo cuando
exista una composición real de UI que no pueda expresarse en la presentación; derivarlo con
`Pick`/`Omit` y probar el mapping.

## Borde HTTP

El dato de red comienza como `unknown`. El cliente HTTP lo valida antes de devolverlo:

```typescript
// features/products/services/products-index.api.ts
export function productsIndexApi(query: ProductIndexQueryDto) {
  return apiClient.requestJson({
    path: '/products',
    query,
    responseSchema: productIndexResponseDto,
  });
}
```

No parsear repetidamente en cada componente. El boundary correcto es `ApiClient`/`*.api.ts`.

Una incompatibilidad Zod debe producir un error controlado, telemetria sin payload/PII e impedir que datos no confiables lleguen a estado o UI.

## TanStack Query

El `queryFn` retorna datos ya validados:

```typescript
const productsQuery = useQuery({
  queryKey: ['products', filters],
  queryFn: () => productsIndexApi(filters),
  staleTime: 30_000,
});
```

- La key incluye todo filtro que cambia el resultado.
- No copiar server state a Zustand/signals.
- `select` transforma datos ya validados.
- Retry solo para operaciones idempotentes y errores recuperables.

## TanStack Mutation

```typescript
const storeMutation = useMutation({
  mutationFn: (input: ProductStoreRequestDto) => productsStoreApi(input),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});
```

- Payload tipado por request DTO.
- Response validado por response DTO.
- Invalidacion/actualizacion de cache explicita.
- Optimistic update solo con rollback determinista.
- No reintentar escrituras sin idempotencia.

## Convención API, hook y componente

```text
features/users/services/users-index.api.ts
  -> features/users/hooks/users-index.hooks.ts
    -> features/users/pages/users-index.tsx

features/users/services/users-store.api.ts
  -> features/users/hooks/users-store.hooks.ts
    -> features/users/components/users-store.tsx
```

- `*.api.ts` importa contratos, ejecuta HTTP y valida responses.
- `*.hooks.ts` importa la API y configura `useQuery`/`useMutation`.
- El componente importa el hook y controla React Hook Form, accesibilidad y estados visibles.
- Una mutation exitosa invalida las query keys relacionadas; `users-store` invalida `users-index`.
- Cada archivo runtime tiene una prueba adyacente con el mismo nombre base, incluidas las factories de query keys en `constants/`.

## Componentes

Los componentes reciben datos validados o un ViewModel:

```typescript
type Product = ProductIndexResponseDto['results'][number];

interface ProductCardProps {
  readonly product: Product;
}
```

Crear un ViewModel solo si la UI combina datos de varias fuentes o necesita un modelo de interacción
propio. Formatear `precio`, fechas y labels en la celda/componente sin agregar campos al response.

## TanStack Table

```typescript
type ProductRow = ProductIndexResponseDto['results'][number];

const columns: ColumnDef<ProductRow>[] = [
  { accessorKey: 'nombre', header: 'Producto' },
  {
    accessorKey: 'precio',
    header: 'Precio',
    cell: ({ getValue }) => formatMoney(getValue<string>()),
  },
];
```

- La tabla consume tipos del response.
- Las columnas no llaman HTTP ni mutan cache.
- Dinero exacto permanece `string`; presentacion lo formatea sin perder precision.
- Sorting/filtering server-side se expresa mediante request/query DTOs.
- Virtualizar solo con volumen medido.

## Desarrollo y produccion

```bash
# bus-impl
pnpm dev:contracts

# web-mfe
pnpm dev
```

El link local permite feedback rapido, pero CI/produccion debe instalar una version exacta publicada. Nunca depender de rutas hermanas en un pipeline independiente.

## Gates

```bash
pnpm governance:contracts
pnpm typecheck
pnpm test
pnpm build
pnpm bundle:budget
```

El bundle debe rechazar `nestjs-zod`, `@nestjs/`, `node:` y adaptadores `*.doc.ts`.

## No hacer

- Copiar DTOs a `libs/contracts`.
- Definir interfaces espejo del backend.
- Confiar solo en TypeScript para datos de red.
- Importar el barrel backend completo esperando que tree-shaking elimine NestJS.
- Parsear response en JSX.
- Enviar credenciales de Grafana/CloudWatch desde el browser.

## Documentos relacionados

- [Arquitectura y ownership de estado](./3-arquitectura-estructura-estado.md).
- [Integración BFF, HTTP y autenticación](./5-bff-http-runtime-auth.md).
- [Golden path de feature](./6-golden-path-feature-componentes-hooks.md).
- [Testing](./7-testing-vitest-msw-playwright.md).
