# Golden Path De Una Feature Mobile

## Objetivo

Implementar una capacidad HTTP completa en Expo/React Native sin duplicar contratos, estado o
responsabilidades. `products` es un ejemplo reemplazable por el dominio real.

## Secuencia

1. Confirmar caso de uso, permisos nativos/backend y estados UX.
2. Confirmar request/response publicados y la versión exacta del paquete de contratos.
3. Crear o reutilizar una función `*.api.ts` por operación HTTP.
4. Crear query/mutation hooks cuando aporten cache, invalidación o una API reusable.
5. Construir formulario, lista y rows con tipos derivados del contrato.
6. Componer la screen y registrar una route delgada.
7. Cubrir loading, refresh, empty, error, offline, denied, success y sesión expirada cuando apliquen.
8. Agregar pruebas por riesgo y ejecutar gates; Maestro solo con target real disponible.

No “agregar DTOs/schemas” del backend dentro de mobile. Solo se permite un schema local de
formulario cuando la representación del control nativo difiere del request DTO; la conversión termina
en el contrato publicado.

## Estructura Completa De Ejemplo

```text
src/
|-- features/
|   `-- catalog/
|       `-- products/
|           |-- components/
|           |   |-- products-index.tsx
|           |   |-- products-index.test.tsx
|           |   |-- products-store.tsx
|           |   |-- products-store.test.tsx
|           |   `-- ui/
|           |       |-- product-row.tsx
|           |       `-- product-row.test.tsx
|           |-- hooks/
|           |   |-- use-products-index-query.ts
|           |   |-- use-products-index-query.test.ts
|           |   |-- use-products-store-mutation.ts
|           |   `-- use-products-store-mutation.test.ts
|           |-- services/
|           |   |-- products-index.api.ts
|           |   |-- products-index.api.test.ts
|           |   |-- products-store.api.ts
|           |   `-- products-store.api.test.ts
|           |-- schemas/
|           |   |-- product-store-form.schema.ts
|           |   `-- product-store-form.schema.test.ts
|           |-- constants/
|           |   |-- products-query-keys.constants.ts
|           |   `-- products-query-keys.constants.test.ts
|           |-- types/
|           |   `-- product-row.types.ts
|           |-- libs/
|           |   |-- to-product-store-request.ts
|           |   `-- to-product-store-request.test.ts
|           `-- index.ts
|-- screens/
|   |-- products-screen.tsx
|   `-- products-screen.test.tsx
`-- services/
    |-- files/
    `-- http/
app/
`-- (app)/
    `-- products.tsx
tests/
`-- e2e/
    `-- products-critical.yaml
```

No crear todas las carpetas por anticipado. `schemas/` solo existe si hay representación UI propia;
`libs/` solo si hay un mapper/formatter real; `ui/` solo si al menos dos componentes de la feature
consumen esa primitiva privada.

## API De Dominio

Cada archivo representa una operación. El service conoce transporte y schemas; no conoce hooks ni
JSX:

```typescript
import {
  type ProductIndexQueryDto,
  productIndexResponseDto,
} from '@vigilioyonatan/bus-contracts';
import { apiClient } from '@/services/http/api';

export function productsIndexApi(query: ProductIndexQueryDto) {
  return apiClient.requestJson({
    method: 'GET',
    path: '/products',
    query,
    responseSchema: productIndexResponseDto,
  });
}
```

- Usar `products-index.api.ts`, no un `product.service.ts` con todo el CRUD.
- El response comienza como `unknown` y se valida una sola vez en el borde.
- Headers de sesión, timeout, correlation ID y normalización de errores pertenecen al ApiClient.
- El adapter de picker/filesystem pertenece a `src/services/files`, no a la feature de negocio.

## Hooks TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';
import type { ProductIndexQueryDto } from '@vigilioyonatan/bus-contracts';
import { sessionStateSignal } from '@/services/auth/auth-token.store';
import { productsQueryKeys } from '../constants/products-query-keys.constants';
import { productsIndexApi } from '../services/products-index.api';

export function useProductsIndexQuery(query: ProductIndexQueryDto) {
  return useQuery({
    queryKey: productsQueryKeys.list(query),
    queryFn: () => productsIndexApi(query),
    enabled: sessionStateSignal.value === 'authenticated',
  });
}
```

- La key incluye cada filtro que modifica el resultado.
- Una mutation invalida el scope mínimo afectado.
- Un optimistic update requiere snapshot y rollback probado; no es el default.
- No ocultar cada `useQuery` detrás de un hook si no añade una API estable, defaults o composición.
- No copiar el resultado a Signals, Zustand o estado local.

## Tipos Derivados Y Formularios

Props, rows y ViewModels se derivan con `Pick`, `Omit`, `Partial`, acceso indexado e intersecciones.
Los ejemplos canónicos y la diferencia entre derivación type-only y validación runtime están en
[Contratos, Zod, formularios y TanStack](./1-contratos-zod-formularios-tanstack.md#derivación-de-tipos-sin-duplicación).

El mapper de un formulario nativo debe retornar el request DTO publicado y probar nullability,
números, fechas y valores vacíos. La UI nunca cambia el contrato para acomodar un `TextInput`.

## Componentes Y Screen

- Route: selecciona la screen y metadata; no ejecuta HTTP.
- Screen: compone feature, safe area, error boundary y navegación.
- Container: conecta hooks y modela estados visibles.
- Form/list/row: recibe props derivadas y callbacks; no conoce fetch.
- Primitiva de design system: no importa services, contratos de negocio ni features.

Las listas potencialmente grandes usan `FlatList`/virtualización, key estable, paginación y
pull-to-refresh. No usar `.map()` ilimitado dentro de `ScrollView`. Memoizar solo tras identificar un
render costoso medible.

## CRUD Y Upload

- Create invalida las listas afectadas y evita doble submit.
- Update conserva el ID contractual y actualiza detail/list de forma controlada.
- Delete exige confirmación cuando es destructivo y trata 404 según la idempotencia del contrato.
- Upload valida metadata local para UX, solicita presigned URL y sube directo con los headers
  devueltos; no manda base64 por el API JSON ni registra la URL temporal.
- Permisos y picker se solicitan al usarse y modelan cancelación/denegación como estados explícitos.

## Pruebas Adyacentes

- `*.api.test.ts`: success, error HTTP y response incompatible.
- `*.schema.test.ts`: valores nativos válidos/inválidos y mapping al request DTO.
- `use-*.test.ts`: key, enabled, retry, invalidación y rollback si existe.
- `*.test.tsx`: interacción por role/label, accesibilidad y estados visibles.
- `products-screen.test.tsx`: composición, navegación y error boundary.
- Maestro: journey crítico sobre binario instalado y backend controlado.

Fixtures usan tipos/schemas publicados o builders tipados; no redefinen interfaces de producción.
Un render Jest/RNTL no se reporta como E2E.

## API Pública

`index.ts` exporta únicamente componentes, hooks o tipos que otra capa realmente consume. No usar un
barrel para exponer internals ni permitir deep imports entre features. Si solo la screen consume la
feature, no es obligatorio crear el barrel.

## Definition Of Done

- Sin DTOs, schemas, enums o interfaces espejo.
- Una operación HTTP por `*.api.ts`, con parsing runtime y prueba adyacente.
- Sin `fetch` directo en components, screens o routes.
- Estados nativos y sesión expirada cubiertos de forma proporcional al riesgo.
- Accesibilidad, back/deep link y lifecycle probados cuando aplican.
- Sin secretos, PII, payloads ni presigned URLs en logs.
- Cada archivo runtime tiene prueba identificable; no hay carpetas vacías ni placeholders.
- Lint, typecheck, contratos, tests, Expo checks, export y budget quedan verdes.
