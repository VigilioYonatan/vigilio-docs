# Workers, Outbox, SNS, SQS Y DLQ

## Flujo Canónico

```text
API transaction
  -> business data + outbox row
  -> outbox publisher
  -> SNS topic
  -> SQS queue
  -> worker
  -> inbox/deduplication
  -> side effect
  -> DLQ after exhausted retries
```

Publica eventos después del commit mediante outbox transaccional.

No publiques directamente desde controllers o transactions abiertas.

## Procesos

- Ejecuta API, publisher y worker como procesos separados.
- Reutiliza una imagen inmutable.
- Asigna permisos mínimos por proceso.
- Escala workers mediante profundidad y antigüedad de cola.
- Implementa apagado ordenado.
- Detén lecturas antes de terminar el pod.

## Contratos

- Versiona nombres y payloads.
- Valida payloads con Zod.
- Conserva `eventId`, `occurredAt`, `correlationId` y versión.
- Coloca tipos en `types/` dentro del contexto.
- Coloca eventos y límites en `constants/`.
- Mantén handlers libres de tipos declarados arriba.

## Entrega E Idempotencia

- Asume entrega al menos una vez.
- Deduplica mediante `eventId` e inbox persistente.
- Haz idempotente cada efecto externo.
- Confirma mensajes solo después del efecto durable.
- Extiende visibility timeout para tareas largas.
- Aborta tareas que excedan su presupuesto.
- Usa jitter en reintentos transitorios.
- Envía errores permanentes hacia DLQ.

## Poison Messages Y Replay

- Registra clasificación, intento y causa segura.
- Alerta por antigüedad y crecimiento de DLQ.
- Corrige primero la causa.
- Reproduce mediante herramienta auditada.
- Conserva evento original y nuevo identificador de replay.
- Limita velocidad durante replay.

## Ejemplos

### Bien: datos y outbox juntos

```ts
await database.transaction(async (tx) => {
  await orderRepository.store(order, tx);
  await outboxRepository.enqueue(orderPlaced, tx);
});
```

### Mal: dual write

```ts
await orderRepository.store(order);
await sns.send(orderPlaced);
```

### Bien: idempotencia

```ts
if (await inboxRepository.exists(event.id)) return;
await processor.handle(event);
await inboxRepository.markHandled(event.id);
```

### Mal: confirmar antes

```ts
await queue.delete(message);
await processor.handle(message);
```

### Bien: constantes separadas

```ts
// constants/order-events.constant.ts
export const ORDER_EVENTS = { placed: 'order.placed.v1' } as const;
```

### Mal: cadena dispersa

```ts
await publisher.publish('order-created', payload);
```

## Métricas

- Mide profundidad, antigüedad, procesamiento, retries y DLQ.
- Mide outbox pendiente, bloqueada y publicada.
- Correlaciona API, evento y worker.
- Evita identificadores de alta cardinalidad en labels.

## Pruebas Mínimas

- Prueba commit y rollback del outbox.
- Prueba mensajes duplicados.
- Prueba retries transitorios y errores permanentes.
- Prueba visibility timeout.
- Prueba apagado con trabajo activo.
- Prueba replay limitado.
