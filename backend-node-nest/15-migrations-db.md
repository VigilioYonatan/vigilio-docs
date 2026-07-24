# Migraciones PostgreSQL y Drizzle - `bus-impl` 2026

Este documento define como migrar base de datos sin romper produccion.

Regla madre:

- en produccion, rollback de aplicacion debe ser posible sin rollback manual de datos

---

## 1. Expand-contract

Para cambios no triviales:

1. Expand: agregar columnas, tablas o indices compatibles.
2. Deploy app compatible con viejo y nuevo schema.
3. Backfill controlado.
4. Cambiar lecturas/escrituras.
5. Contract: retirar columnas viejas en otra release.

Regla:

- cambios destructivos nunca van en la misma release que empieza a depender del nuevo schema

---

## 2. Cambios peligrosos

Requieren review extra:

- drop column
- rename column
- change type
- not null sin default/backfill
- indices grandes sin estrategia
- migraciones con locks largos
- updates masivos

---

## 3. Backfills

Reglas:

- por lotes
- idempotentes
- con checkpoint
- con metricas de progreso
- con pausa/reanudacion

No hacer:

- `UPDATE tabla SET ...` gigante en horario productivo

---

## 4. Indices

Buenas practicas:

- crear indices grandes con estrategia compatible con PostgreSQL
- medir query plans
- validar impacto en writes
- remover indices muertos solo tras observar uso

---

## 5. Drizzle

Reglas:

- migrations versionadas
- no editar migrations ya aplicadas
- generar migration y revisarla manualmente
- `drizzle-kit` no reemplaza revision humana

Pipeline:

```text
generate -> review SQL -> test local -> test integration -> staging -> production
```

---

## 6. Rollback

Regla:

- rollback normal debe ser de aplicacion, no de datos

Por eso:

- app version N y N-1 deben convivir temporalmente con el schema
- migraciones destructivas se separan
- backfills deben ser reentrantes

---

## 7. Testing

Minimo:

- migration forward en PostgreSQL real
- smoke despues de migration
- test de compatibilidad app N-1 con schema expandido
- validar timezone, decimal, collation, constraints e indices

