# Tiempo Real En Web MFE

## Selección

Usa HTTP para consultas y comandos normales.

Usa SSE para actualizaciones unidireccionales.

Usa Socket.IO cuando necesites rooms, acknowledgements o comunicación bidireccional.

## Estructura

```text
src/features/chat/
|-- constants/chat-events.constant.ts
|-- types/chat-connection.type.ts
|-- services/chat-realtime.service.ts
|-- hooks/use-chat-realtime.ts
`-- components/chat-panel.tsx
```

- Coloca tipos propios en `types/` dentro de la feature.
- Coloca eventos y límites en `constants/` dentro de la feature.
- Mantén transporte dentro de `services/`.
- Mantén ciclo de vida dentro de hooks.
- Mantén componentes sin sockets globales.
- Reutiliza tipos contractuales del backend.
- Evita copiar DTOs y eventos.

## Reglas

- Crea una conexión por sesión y propósito.
- Cierra conexiones durante logout y desmontaje.
- Usa backoff exponencial con jitter.
- Evita reintentos infinitos.
- Deduplica eventos mediante identificadores estables.
- Invalida TanStack Query tras eventos confirmados.
- Evita duplicar datos remotos en stores globales.
- Muestra estados conectado, reconectando y degradado.
- Detén reconexiones cuando la pestaña permanezca oculta.
- Registra métricas sin payloads sensibles.

## Ejemplos

### Bien: servicio aislado

```ts
export function createChatSocket(config: RealtimeConfig) {
  return io(config.url, {
    auth: { token: config.accessToken },
    transports: ['websocket'],
  });
}
```

### Mal: conexión durante render

```tsx
export function ChatPanel() {
  const socket = io(import.meta.env.VITE_API_URL);
  return <section />;
}
```

### Bien: cleanup

```ts
useEffect(() => {
  const socket = realtime.connect();
  return () => socket.disconnect();
}, [realtime]);
```

### Mal: listeners duplicados

```ts
socket.on('message', updateMessages);
```

### Bien: SSE con reanudación

```ts
const source = new EventSource(url, { withCredentials: true });
source.addEventListener('message', handleMessage);
```

### Mal: token en URL

```ts
new EventSource(`${url}?token=${accessToken}`);
```

## Accesibilidad Y Degradación

- Anuncia mensajes relevantes mediante regiones vivas.
- Evita robar focus durante eventos entrantes.
- Mantén lectura HTTP cuando falle tiempo real.
- Informa pérdida de conexión sin bloquear navegación.

## Pruebas Mínimas

- Prueba conexión única y cleanup.
- Prueba deduplicación y orden.
- Prueba backoff y límite de reintentos.
- Prueba actualización del cache.
- Prueba modo degradado mediante HTTP.
- Prueba anuncios accesibles.
