# Design System, NativeWind Y Tokens Mobile

## Objetivo

Separar primitives reutilizables de componentes de dominio. NativeWind acelera composición, pero los
tokens —no clases arbitrarias repetidas— representan la identidad y accesibilidad del producto.

## Capas

```text
tokens (color, spacing, typography, motion)
  -> primitives (Text, Button, Input, Card, Modal)
    -> patterns (FormField, EmptyState, ErrorState)
      -> feature components (ProductForm, UploadCard)
        -> screens
```

## Tokens semánticos

Usar nombres como `surface`, `content-primary`, `content-muted`, `action-primary`, `danger` y
`focus`; no `gray-700` como API de producto. Light/dark/high contrast conservan significado. Spacing,
radii, typography y elevation se limitan a escalas revisadas.

## NativeWind

Las clases viven cerca del componente; combinaciones recurrentes se encapsulan como variant de una
primitive. No construir clases dinámicas que el extractor no pueda detectar. Estilos dependientes de
mediciones, animaciones o APIs nativas pueden usar StyleSheet/Reanimated detrás de un componente.

## API de componentes

```tsx
<Button
  accessibilityLabel="Guardar producto"
  loading={mutation.isPending}
  variant="primary"
  onPress={submit}
>
  Guardar
</Button>
```

Disabled, loading, pressed, focus/error y tamaños son variants explícitas. Una primitive no importa
services ni contratos de negocio.

## Mobile-first real

- SafeArea y teclado considerados por layout.
- Target táctil y feedback háptico/visual coherentes.
- Texto dinámico y traducción no rompen el componente.
- Dark mode sigue preferencia del sistema salvo decisión de producto.
- Motion respeta reduce motion y evita bloquear interacción.

## Accesibilidad y pruebas

Primitives tienen pruebas de roles, labels, states y contraste de tokens. Story/catalog visual cubre
variants y plataformas; screenshots no sustituyen VoiceOver/TalkBack.

## Versionado

Cambios breaking del design system se publican/migran de forma controlada. Una app no copia el botón
para evitar actualizarlo; solicita una variant o documenta la excepción.

## Definition of Done

Tokens semánticos, variants completos, accesibilidad, pruebas y documentación de uso; sin colores,
espaciados o tipografía de marca dispersos por features.
