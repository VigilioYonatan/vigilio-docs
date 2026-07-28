# Golden Path De Feature, Componentes Y Hooks

## Objetivo

Implementar una feature HTTP completa sin duplicar contratos, estado o responsabilidades.

`apps/salud/backoffice` es solo una instancia. Aplicar este golden path en `apps/{dominio-o-producto}/{aplicacion}` según el producto, por ejemplo `apps/invoices/admin` o `apps/orders/portal`.

## Secuencia

1. Confirmar caso de uso, permisos y estados UX.
2. Confirmar request/response publicados por `bus-impl`.
3. Crear o reutilizar la función `*.api.ts` de la operación HTTP.
4. Crear query/mutation hooks solo cuando aportan una API estable.
5. Construir formulario, tabla o componentes con tipos derivados.
6. Cubrir loading, refresh, empty, error, success y sesión expirada.
7. Agregar pruebas por riesgo.
8. Ejecutar gates y actualizar documentación/telemetría si cambió el estándar.

## Estructura completa de ejemplo

```text
apps/{dominio-o-producto}/{aplicacion}/src/
|-- features/
|   `-- catalog/
|       |-- products/
|       |   |-- pages/
|       |   |   |-- products-index.tsx
|       |   |   `-- products-index.test.tsx
|       |   |-- components/
|       |   |   |-- products-store.tsx
|       |   |   |-- products-store.test.tsx
|       |   |   `-- ui/
|       |   |       |-- product-price.tsx
|       |   |       `-- product-price.test.tsx
|       |   |-- hooks/
|       |   |   |-- use-products-index-query.ts
|       |   |   |-- use-products-index-query.test.ts
|       |   |   |-- use-products-store-mutation.ts
|       |   |   `-- use-products-store-mutation.test.ts
|       |   |-- services/
|       |   |   |-- products-index.api.ts
|       |   |   |-- products-index.api.test.ts
|       |   |   |-- products-store.api.ts
|       |   |   `-- products-store.api.test.ts
|       |   |-- constants/
|       |   |   |-- products-query-keys.constants.ts
|       |   |   `-- products-query-keys.constants.test.ts
|       |   |-- types/
|       |   |   `-- product-row.types.ts
|       |   |-- libs/
|       |   |   |-- format-product-price.ts
|       |   |   `-- format-product-price.test.ts
|       |   `-- mocks/
|       |       |-- products.handlers.ts
|       |       `-- products.fixtures.ts
|       |-- categories/
|       |   |-- pages/
|       |   |   |-- categories-index.tsx
|       |   |   `-- categories-index.test.tsx
|       |   |-- components/
|       |   |   |-- categories-table.tsx
|       |   |   `-- categories-table.test.tsx
|       |   |-- hooks/
|       |   |   |-- categories-index.hooks.ts
|       |   |   `-- categories-index.hooks.test.tsx
|       |   |-- services/
|       |   |   |-- categories-index.api.ts
|       |   |   `-- categories-index.api.test.ts
|       |   |-- constants/
|       |   |   |-- categories-query-keys.constants.ts
|       |   |   `-- categories-query-keys.constants.test.ts
|       |   |-- types/
|       |   |   `-- category-row.types.ts
|       |   `-- mocks/
|       |       |-- categories.handlers.ts
|       |       `-- categories.fixtures.ts
|       |-- brands/
|       |   |-- pages/
|       |   |   |-- brands-index.tsx
|       |   |   `-- brands-index.test.tsx
|       |   |-- components/
|       |   |   |-- brands-table.tsx
|       |   |   `-- brands-table.test.tsx
|       |   |-- hooks/
|       |   |   |-- brands-index.hooks.ts
|       |   |   `-- brands-index.hooks.test.tsx
|       |   |-- services/
|       |   |   |-- brands-index.api.ts
|       |   |   `-- brands-index.api.test.ts
|       |   |-- constants/
|       |   |   |-- brands-query-keys.constants.ts
|       |   |   `-- brands-query-keys.constants.test.ts
|       |   |-- types/
|       |   |   `-- brand-row.types.ts
|       |   `-- mocks/
|       |       |-- brands.handlers.ts
|       |       `-- brands.fixtures.ts
|       `-- shared/
|           |-- components/
|           |   |-- catalog-filters.tsx
|           |   `-- catalog-filters.test.tsx
|           |-- hooks/
|           |   |-- catalog-search.hooks.ts
|           |   `-- catalog-search.hooks.test.tsx
|           |-- constants/
|           |   |-- catalog-routes.constants.ts
|           |   `-- catalog-routes.constants.test.ts
|           |-- types/
|           |   `-- catalog-option.types.ts
|           |-- libs/
|           |   |-- normalize-catalog-search.ts
|           |   `-- normalize-catalog-search.test.ts
|           `-- mocks/
|               `-- catalog.fixtures.ts
`-- services/
    |-- http/
    |   |-- api-client.ts
    |   `-- api-client.test.ts
    |-- forms/
    |   |-- nullable-zod-resolver.ts
    |   `-- nullable-zod-resolver.test.ts
    `-- validation/
        |-- zod-locale.ts
        `-- zod-locale.test.ts
```

`catalog/` es un ejemplo de nombre agregador; usar el nombre real del bounded context. No crear
`products/products/`. Si solo existe `products`, usar `features/products/` directamente. Si existen
`products`, `categories` y `brands` como capacidades hermanas, usar un padre genérico y dar a cada
hija sus propios `pages/`, `components/`, `hooks/`, `services/`, `constants/`, `types/`, `libs/` y
`mocks/` según necesidad. No crear carpetas vacías.

`catalog/shared/` contiene únicamente piezas consumidas por al menos dos hijas. `src/shared/` se
reserva para reutilización real entre features de primer nivel, y `libs/ui` para primitivas visuales
agnósticas compartidas entre aplicaciones. Ningún nivel `shared/` puede convertirse en un cajón
genérico.

## API HTTP

```typescript
// features/catalog/products/services/products-store.api.ts
export function productsStoreApi(body: ProductStoreRequestDto) {
  return apiClient.requestJson({
    body,
    method: 'POST',
    path: '/products',
    responseSchema: productStoreResponseDto,
  });
}
```

El archivo `*.api.ts` conoce transporte y contratos. No contiene JSX, notificaciones, TanStack Query ni estado visual.

Las APIs de dominio viven en `features/{feature}/services/{operacion}.api.ts`, junto a sus hooks,
componentes y tests. `src/services/` conserva únicamente infraestructura transversal como el cliente
HTTP, auth, config, formularios, validación y observabilidad. Los componentes no importan
`apiClient`, `fetch` ni detalles de transporte.

## Constants y query keys

Las constantes runtime tienen nombres de dominio, `as const` cuando aporta inferencia y una prueba adyacente. Las query keys se centralizan para que index, detail, mutation e invalidación usen la misma jerarquía:

```typescript
// features/users/constants/users-query-keys.constants.ts
import type { UserIndexQueryDto } from '@vigilioyonatan/bus-contracts';

export const usersQueryKeys = {
  all: ['users'] as const,
  indexes: () => [...usersQueryKeys.all, 'index'] as const,
  index: (query: UserIndexQueryDto) =>
    [...usersQueryKeys.indexes(), query] as const,
};
```

```typescript
// features/users/constants/users-query-keys.constants.test.ts
describe('usersQueryKeys', () => {
  it('incluye todos los filtros efectivos en la key de index', () => {
    const query = {
      limit: 20,
      offset: 0,
      search: 'ana',
      sort_by: 'created_at',
      sort_dir: 'desc',
    } as const;

    expect(usersQueryKeys.index(query)).toEqual([
      'users',
      'index',
      query,
    ]);
  });
});
```

- No guardar runtime config, tokens, datos mutables ni respuestas HTTP en `constants/`.
- No copiar enums del backend; importarlos desde `@vigilioyonatan/bus-contracts` cuando forman parte del contrato.
- Una factory de query keys sí es código runtime y debe probar estabilidad, filtros y ausencia de colisiones.
- Un valor solo usado dentro de un archivo permanece local; no crear `constants/` por reflejo.

## Ejemplo `users-index`

```typescript
// features/users/services/users-index.api.ts
import {
  type UserIndexQueryDto,
  userIndexResponseDto,
} from '@vigilioyonatan/bus-contracts';

export function usersIndexApi(query: UserIndexQueryDto) {
  return apiClient.requestJson({
    path: '/users',
    query,
    responseSchema: userIndexResponseDto,
  });
}
```

```typescript
// features/users/hooks/users-index.hooks.ts
export function useUsersIndexQuery(query: UserIndexQueryDto) {
  return useQuery({
    queryKey: usersQueryKeys.index(query),
    queryFn: () => usersIndexApi(query),
  });
}
```

```text
features/users/pages/users-index.tsx
  -> features/users/hooks/users-index.hooks.ts
    -> features/users/services/users-index.api.ts
      -> GET /users
```

## Ejemplo `users-store`

```typescript
// features/users/services/users-store.api.ts
import {
  type UserStoreRequestDto,
  userStoreResponseDto,
} from '@vigilioyonatan/bus-contracts';

export function usersStoreApi(body: UserStoreRequestDto) {
  return apiClient.requestJson({
    body,
    method: 'POST',
    path: '/users',
    responseSchema: userStoreResponseDto,
  });
}
```

```typescript
// features/users/hooks/users-store.hooks.ts
export function useUsersStoreMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersStoreApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: usersQueryKeys.indexes(),
      });
    },
  });
}
```

```typescript
// features/users/components/users-store.tsx
import { nullableZodResolver } from '@/services/forms/nullable-zod-resolver';

const form = useForm<UserStoreRequestDto>({
  mode: 'onChange',
  reValidateMode: 'onChange',
  resolver: nullableZodResolver(userStoreRequestDto),
});

const usersStoreMutation = useUsersStoreMutation();

function handleUsersStore(body: UserStoreRequestDto) {
  usersStoreMutation.mutate(body);
}
```

```text
features/users/components/users-store.tsx
  -> features/users/hooks/users-store.hooks.ts
    -> features/users/services/users-store.api.ts
      -> POST /users
        -> invalidar users-index
```

El componente usa el request schema con React Hook Form, muestra pending/error/success y mantiene accesibilidad. El hook orquesta TanStack Query e invalidación. La API ejecuta y valida HTTP.

Pruebas mínimas del componente:

```typescript
// features/users/components/users-store.test.tsx
it('envía el UserStoreRequestDto válido y muestra éxito', async () => {
  renderWithAppProviders(<UsersStore />);

  await user.type(screen.getByLabelText(/correo/i), 'ana@example.com');
  await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Pérez');
  await user.type(screen.getByLabelText(/contraseña/i), 'Password-2026!');
  await user.click(screen.getByRole('button', { name: /crear usuario/i }));

  expect(await screen.findByText(/usuario creado/i)).toBeVisible();
});
```

La prueba usa MSW para observar el body HTTP a través de la integración real componente → hook → API. Agregar también el caso pending/doble submit. Además deben existir pruebas aisladas de la API para contrato inválido y del hook para invalidación de caché.

## Formulario

```typescript
import { nullableZodResolver } from '@/services/forms/nullable-zod-resolver';

const form = useForm<ProductStoreRequestDto>({
  mode: 'onChange',
  reValidateMode: 'onChange',
  resolver: nullableZodResolver(productStoreRequestDto),
});
```

- Usar el request DTO, no el response.
- Respetar `nullable`, `optional` y tipos exactos.
- Importar `nullableZodResolver` desde el adapter común de la aplicación cuando el backend espera
  `null` para controles vacíos; no inventar defaults que no existan en el contrato.
- La normalización es recursiva antes de Zod; los campos requeridos siguen rechazando `null`.
- Asociar label, error y descripción accesible.
- Deshabilitar submit solo por una razón observable.

## Query

```typescript
const productsQuery = useQuery({
  queryKey: productKeys.list(filters),
  queryFn: () => productsIndexApi(filters),
  staleTime: 30_000,
});
```

La key incluye todo filtro efectivo. `select` transforma un response ya validado; no reemplaza el parse contractual.

## Mutation

```typescript
const mutation = useMutation({
  mutationFn: productsStoreApi,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.all });
  },
});
```

Optimistic update solo con snapshot y rollback deterministas. No reintentar escrituras sin idempotencia backend.

## Estado cliente con Signals

Para código Preact nuevo, preferir `useSignal` sobre introducir `useState` por costumbre cuando el
valor sea estado UI local y reactivo. No usar Signals para datos remotos, formularios completos,
filtros navegables o configuración runtime: esos estados pertenecen a TanStack Query, React Hook
Form, URL/router y config respectivamente.

```tsx
import { useComputed, useSignal } from '@preact/signals';

const purpose = useSignal<UploadPurposeSchema>('document');
const file = useSignal<File | null>(null);
const hasFile = useComputed(() => file.value !== null);

function selectFile(nextFile: File | null) {
  file.value = nextFile;
}
```

Para colecciones, reemplazar la referencia:

```tsx
const messages = useSignal<AiChatMessageSchema[]>([]);

function appendMessage(message: AiChatMessageSchema) {
  messages.value = [...messages.value, message];
}
```

- Mantener el signal cerca de su consumidor; elevarlo solo cuando exista estado compartido real.
- Derivar con `useComputed`; no duplicar `hasFile`, contadores o flags sincronizados manualmente.
- No mezclar un mismo dato entre `useState`, Signal y Zustand.
- Conservar `useState` únicamente cuando una API de terceros lo exija o una migración no aporte una
  mejora verificable.
- Probar cambios visibles, actualización inmutable y reset de signals compartidos.

## Componentes

- Page: integración con ruta y layout.
- Section/container: composición del caso de uso.
- Component: presentación e interacción acotada.
- API: transporte e integración externa.
- Hook: reutilización de estado/comportamiento, no simple ocultamiento de líneas.

Nombrar por dominio y acción observable:

- `users-store.tsx`: formulario o interacción para registrar usuarios.
- `users-update.tsx`: edición de usuarios.
- `users-index.tsx`: listado o página principal de usuarios.
- `products-table.tsx`: representación tabular de productos.
- `product-form.tsx` solo cuando el mismo formulario sirve realmente para más de una operación; de lo contrario preferir `products-store.tsx` o `products-update.tsx`.

Evitar nombres sin contexto como `form.tsx`, `table.tsx`, `modal.tsx`, `panel.tsx`, `helpers.ts` o `utils.ts`.

Promover a `libs/ui` solamente cuando existen dos consumidores reales, API agnóstica de dominio y pruebas de comportamiento cuando hay lógica.

## Tablas

Una tabla pequeña puede usar HTML semántico. Usar TanStack Table para sorting, filtering, selección, paginación, columnas configurables o virtualización justificada.

```typescript
type ProductRow = ProductIndexResponseDto['results'][number];
const columns: ColumnDef<ProductRow>[] = [];
```

Las columnas no ejecutan HTTP ni mutan caché. Dinero exacto permanece `string`; presentación lo formatea.

## Hooks reutilizables

Un hook sano:

- encapsula una responsabilidad reconocible;
- tiene API pequeña y estable;
- no duplica capacidades de Query, Form o router;
- limpia listeners/timers;
- funciona con SSR/test cuando aplique;
- se prueba si contiene lógica o side effects.

Evitar wrappers de un solo `useQuery`, hooks genéricos con flags y almacenamiento de tokens en hooks de storage.

## Pruebas junto al archivo

Todo archivo ejecutable con comportamiento se acompaña con una prueba adyacente y el mismo nombre base:

```text
users-update.tsx
users-update.test.tsx

users-index.hooks.ts
users-index.hooks.test.tsx

users-store.api.ts
users-store.api.test.ts

users-query-keys.constants.ts
users-query-keys.constants.test.ts
```

Excepciones justificadas:

- `*.types.ts`: se valida mediante `typecheck`, porque no existe en runtime.
- CSS y declaraciones: se validan mediante build, visual regression y gates específicos.
- código generado: se valida en su generador y no se edita manualmente.
- test setup, fixtures y handlers MSW sin transformación: deben ser ejercitados por la suite consumidora; si contienen lógica, llevan prueba propia.

Todo `.ts`/`.tsx` escrito a mano que produzca JavaScript debe tener cobertura identificable. Esto incluye APIs, hooks, componentes, páginas, constantes runtime, query-key factories, mappers, config y adapters. Evitar tests vacíos destinados únicamente a aumentar el porcentaje.

La colocación adyacente facilita ownership, refactor y eliminación segura. Los E2E y visuales continúan en suites de nivel aplicación porque cubren journeys y rutas, no un único archivo.

## Estados obligatorios

- loading inicial;
- refresh en segundo plano;
- empty;
- error recuperable;
- error no recuperable mediante boundary;
- éxito y feedback de mutation;
- permisos insuficientes;
- sesión expirada.

## Definition of Done

- Sin DTOs/interfaces espejo.
- Sin `fetch` directo en componentes.
- Componentes accesibles por teclado y nombre.
- Error contractual controlado.
- Pruebas del happy path y del fallo de mayor riesgo.
- Archivos con comportamiento y sus pruebas permanecen juntos.
- Cada archivo runtime nuevo o modificado tiene prueba y cobertura de branches relevantes.
- No existen carpetas vacías, placeholders ni tests sin assertions útiles.
- Lint, typecheck, contratos, tests, build y budget verdes.
