# Design System, UI Y Tokens Frontend

## Objetivo

Definir cómo construir UI consistente, accesible y reutilizable sin mezclar componentes visuales con negocio, APIs o DTOs.

## Dos niveles de UI

```text
features/{feature}/components/ui/
  -> UI privada de una feature

libs/ui/
  -> primitivas compartidas por dos o más features/apps
```

Una pieza empieza dentro de la feature. Solo se promueve a `libs/ui` cuando:

1. existen al menos dos consumidores reales;
2. su API no usa nombres de negocio;
3. no importa servicios, hooks de dominio ni contratos HTTP;
4. tiene estados accesibles de disabled, loading, error y focus cuando aplique;
5. sus pruebas protegen comportamiento observable.

No promover un panel completo, una página, un formulario atado a un DTO ni una tabla acoplada a un response concreto.

## Capas de tokens

```text
primitives
  -> semantic tokens
    -> component tokens
      -> componentes
```

- `primitives`: escalas de color, espacio, tipografía, radius, sombras y motion.
- `semantic`: `surface`, `content`, `border`, `focus`, `danger`, `success` y estados equivalentes.
- `component`: tokens específicos de un componente solo cuando la variación no se expresa con semántica.

Reglas:

- Los componentes consumen tokens semánticos, no hexadecimales dispersos.
- Dark mode o temas cambian tokens, no duplican componentes.
- Los tokens no contienen nombres de backend, marcas de dominio ni URLs.
- Contraste, focus y reduced motion se validan en cada tema soportado.

## Estructura recomendada

```text
libs/ui/src/
|-- tokens/
|   |-- primitives.css
|   |-- semantic.css
|   `-- themes.css
|-- button/
|   |-- button.tsx
|   `-- button.test.tsx
|-- form-field/
|   |-- form-field.tsx
|   `-- form-field.test.tsx
|-- data-table/
|   |-- data-table.tsx
|   `-- data-table.test.tsx
`-- index.ts
```

No crear carpetas vacías. Cada archivo runtime escrito a mano tiene una prueba adyacente; `index.ts` solo reexporta y se verifica mediante el consumo público de la librería. CSS y tokens se verifican con build, contraste y visual regression.

## API de componentes

Una API reusable debe ser pequeña y semántica:

```tsx
<Button
  loading={isSaving}
  onClick={handleSave}
  variant="primary"
>
  Guardar
</Button>
```

Evitar:

- props booleanas combinatorias sin límite;
- nombres de negocio como `isProductStore` en `libs/ui`;
- componentes que llaman HTTP o invalidan caché;
- defaults que ocultan errores de accesibilidad;
- estilos inline repetidos sin token.

## Accesibilidad obligatoria

- Preferir HTML nativo antes que roles manuales.
- Cada control tiene nombre accesible.
- Errores se asocian con `aria-describedby`.
- Focus visible y orden de teclado verificable.
- Dialogs restauran focus y cierran con Escape cuando corresponde.
- Estados no dependen solo del color.
- Touch targets y zoom no se bloquean.
- `prefers-reduced-motion` se respeta.

axe ayuda, pero no reemplaza teclado, lector de pantalla ni revisión humana.

## Formularios y tablas

`libs/ui` puede exponer controles y layout, pero no conoce React Hook Form, DTOs ni TanStack Query. La feature conecta esos adapters:

```text
features/users/components/users-store.tsx
  -> libs/ui/form-field
  -> React Hook Form + userStoreRequestDto
```

Una tabla genérica recibe columnas y filas ya preparados. La feature conserva API, query, filtros e invalidación.

## Tests y evidencia

- Componente runtime: test adyacente de keyboard, focus, estados y eventos.
- Token/tema CSS: build, contraste y visual regression.
- API pública de `libs/ui`: test de comportamiento, no snapshot masivo de DOM.
- Cambios visibles: revisar snapshots manualmente.
- No aprobar una regresión visual solo porque el snapshot fue actualizado.

## Definition of Done

- La pieza está en la feature correcta o cumple criterios de promoción a `libs/ui`.
- No contiene HTTP, DTOs de negocio ni reglas de dominio.
- Tokens semánticos y temas pasan contraste.
- Tiene nombre accesible, teclado, focus y estados definidos.
- Tiene tests útiles y visual evidence cuando el riesgo lo justifica.
- Build, typecheck, lint y bundle budget permanecen verdes.
