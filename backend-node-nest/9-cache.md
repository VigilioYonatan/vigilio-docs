# Cache - `bus-impl` 2026

Este documento separa el cache de aplicacion/runtime del cache de CI/CD.

Regla simple:

- el cache de CI acelera pipelines
- el cache de aplicacion acelera lecturas y reduce carga
- no se disenan igual ni se guardan en el mismo documento

---

## 1. Cuando usar cache

Usar cache cuando se cumple al menos una de estas condiciones:

- la lectura es mucho mas frecuente que la escritura
- la consulta pega a PostgreSQL, S3 o un servicio externo costoso
- el dato cambia poco
- el SLA exige latencia baja y estable
- el frontend o BFF repite la misma consulta muchas veces

No usar cache por reflejo.

Si una query no duele en costo, latencia o concurrencia, primero simplificar SQL, indices o modelo de lectura.

---

## 2. Recomendacion base 2026 en AWS

Para este `bus-impl` en AWS la recomendacion base es:

- cache compartida: **Amazon ElastiCache Serverless**
- motor preferido: **Valkey**
- fallback compatible: Redis OSS si el equipo ya depende de algo especifico
- cache local de Lambda: solo para optimizaciones pequenas y no autoritativas

Por que:

- AWS hoy soporta ElastiCache con **Valkey**, **Redis OSS** y **Memcached**
- ElastiCache Serverless entrega un endpoint unico y evita capacity planning manual
- las caches serverless de Valkey/Redis OSS funcionan con **TLS**
- para serverless cache el control de acceso recomendado es **RBAC**

Regla:

- para la mayoria de lecturas compartidas entre Lambdas, usar Valkey/ElastiCache
- no confiar en memoria local de Lambda como cache global

---

## 3. Tipos de cache

### A. Cache local de ejecucion Lambda

Sirve para:

- clientes AWS SDK inicializados fuera del handler
- conexion a base o a cache reutilizada
- archivos estaticos pequenos en `/tmp`
- catalogos o metadata que toleran ser efimeros

No sirve para:

- compartir estado entre invocaciones distintas
- guardar datos criticos de negocio
- coherencia fuerte entre instancias

### B. Cache distribuida compartida

Sirve para:

- query results compartidos entre muchas Lambdas
- catalogos
- permisos precalculados de corta vida
- sesiones tecnicas o tokens tecnicos si el equipo realmente lo necesita
- rate limit counters, locks tecnicos o idempotency windows

Recomendacion:

- usar Valkey/ElastiCache para este tipo

### C. HTTP/CDN cache

Sirve para:

- respuestas publicas o semipublicas muy repetidas
- assets
- docs estaticas

Esto normalmente vive delante del backend, no dentro del bounded context.

---

## 4. Donde vive en DDD

Regla:

- `domain/` no sabe que existe cache
- `application/` decide si una query puede usar cache
- `infrastructure/` implementa Valkey, `noop` u otro adapter

Estructura recomendada:

```text
src/shared/
|-- application/
|   `-- cache/
|       |-- cache.port.ts
|       |-- cache-entry.ts
|       `-- cache-key.ts
`-- infrastructure/
    `-- cache/
        |-- cache.module.ts
        |-- valkey-cache.adapter.ts
        |-- noop-cache.adapter.ts
        `-- cache-metrics.ts
```

Reglas:

- repositorios no deben esconder cache sin que `application/` lo sepa
- queries de lectura son el lugar mas sano para aplicar cache
- commands no deben depender de lectura cacheada para validar invariantes criticas

---

## 5. Patron recomendado

El baseline recomendado es **cache-aside**.

Flujo:

```text
application query -> build cache key -> get cache
  -> hit: devolver valor
  -> miss: consultar repo o servicio -> serializar -> set ttl -> devolver valor
```

Por que:

- simple
- explicito
- facil de testear
- facil de invalidar

Evitar como baseline:

- write-behind para datos criticos
- invalidacion magica escondida en repositorios
- caches autoritativas para reglas de negocio

---

## 6. Que cachear

Buen candidato:

- catalogos
- parametros de configuracion no sensibles
- listados con filtros repetidos
- dashboards de solo lectura
- respuestas agregadas costosas
- resultados de integraciones externas lentas con TTL corto
- permisos o perfiles derivados si aceptan expiracion corta

Mal candidato:

- saldos o montos criticos que exigen precision y consistencia fuerte
- respuestas con PII si no hay justificacion y proteccion clara
- decisiones de autorizacion de larga vida
- resultados de transacciones aun no confirmadas
- errores permanentes cacheados por demasiado tiempo

Regla para seguros/finanzas:

- si el dato participa en una decision monetaria o regulatoria, cachear con mucho cuidado o no cachear

---

## 7. TTLs recomendados

No existe un TTL universal. Debe salir del riesgo de staleness.

Baseline sano:

| Tipo de dato | TTL sugerido |
|---|---|
| catalogos casi estaticos | `15m` a `6h` |
| query listados repetidos | `30s` a `5m` |
| integracion externa lenta | `15s` a `2m` |
| permisos derivados | `30s` a `5m` |
| rate limit counters | segun ventana |
| idempotency keys | segun contrato del proceso |

Reglas:

- TTL corto por defecto
- subir TTL solo con metrica real
- agregar jitter para evitar stampede
- no usar TTL infinito salvo catalogo o configuracion muy controlada

---

## 8. Key naming

Las keys deben ser previsibles, namespaced y faciles de invalidar.

Formato recomendado:

```text
bus-impl:{stage}:{bounded_context}:{recurso}:{version}:{hash}
```

Ejemplos:

```text
bus-impl:development:endoso:list:v1:7f3c2f
bus-impl:production:endoso:show:v1:id:123
bus-impl:production:catalogo:broker:v2:all
```

Reglas:

- incluir `stage`
- incluir `bounded_context`
- versionar keys cuando cambia el shape del payload
- no meter PII visible en la key
- si el filtro es grande, hashearlo

---

## 9. Invalidacion

La parte dificil del cache no es guardar; es invalidar bien.

Reglas:

- invalidar despues de un command exitoso
- invalidar por prefijos logicos o por lista explicita de keys
- preferir reconstruccion por lectura antes que sincronizacion compleja
- si el costo de invalidar bien es demasiado alto, probablemente no debes cachear esa query

Patrones:

- `create/update/delete` -> borrar keys afectadas
- cambios de catalogo -> bump de version de key
- eventos async -> invalidacion eventual via consumer

Evitar:

- invalidacion antes de confirmar la transaccion
- depender solo de TTL cuando el dato cambia mucho

---

## 10. Seguridad del cache

Reglas:

- TLS obligatorio entre app y cache compartida
- usar RBAC en ElastiCache serverless cuando aplique
- separar usuarios o grupos por ambiente
- no usar el mismo usuario de cache para `development` y `production`
- no guardar secretos reales en cache
- cifrar secretos en origen; no usar cache como almacen de secretos

Para PII:

- evitar cachear PII salvo caso justificado
- si se cachea, TTL corto, logging minimo y control de acceso claro

---

## 11. Lambda y conexiones

Buenas practicas:

- inicializar cliente de Valkey y otros SDK fuera del handler
- reutilizar conexiones cuando el runtime lo permita
- usar `/tmp` solo para assets o artefactos efimeros
- asumir que cualquier cache local puede desaparecer entre invocaciones

Regla:

- memoria de Lambda acelera, pero no reemplaza a ElastiCache

---

## 12. Observabilidad

Medir como minimo:

- hit ratio
- miss ratio
- latencia del cache
- latencia sin cache
- errores de conexion
- timeouts
- stampedes
- keys invalidated

Alarmas recomendadas:

- hit ratio cae demasiado
- latencia del cache sube
- errores del adapter suben
- timeouts del cache suben

Regla:

- si no se mide, el cache se convierte en una fuente silenciosa de bugs

---

## 13. Fallback y degradacion

El cache debe poder fallar sin tumbar el negocio.

Regla:

- si el cache falla, la lectura vuelve al source of truth cuando el costo lo permita
- el bounded context debe poder usar `noop-cache.adapter.ts`
- no hacer que un cache optional vuelva indisponible una lectura no critica

Excepcion:

- si usas cache para rate limit, idempotencia o lock distribuido, ese flujo si puede requerir politica mas estricta

---

## 14. Testing

### Unit

- mock del `cache.port.ts`
- validar keys, TTLs e invalidaciones

### Integration

- levantar Valkey o Redis OSS real en Docker si el flujo depende del adapter
- probar hit, miss, expiracion e invalidacion

### E2E

- validar que la app responda igual con cache caliente y fria
- no hacer asserts fragiles basados en tiempos exactos

Regla:

- el comportamiento correcto es mas importante que demostrar que el cache existe

---

## 15. Ejemplo minimo

```typescript
// src/shared/application/cache/cache.port.ts
export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}
```

```typescript
// src/endoso/application/service/endoso.application-service.ts
import type { CachePort } from '@/shared/application/cache/cache.port';

export class EndosoApplicationService {
  constructor(
    private readonly cache: CachePort,
    private readonly repository: EndosoReadRepository,
  ) {}

  async index(query: EndosoIndexQueryDto): Promise<EndosoIndexResponseDto> {
    const key = `bus-impl:production:endoso:index:v1:${query.nro_poliza ?? 'all'}:${query.offset}:${query.limit}`;
    const cached = await this.cache.get<EndosoIndexResponseDto>(key);

    if (cached) {
      return cached;
    }

    const response = await this.repository.search(query);

    await this.cache.set(key, response, 60);

    return response;
  }
}
```

```typescript
// src/endoso/application/service/endoso.application-service.ts
export class EndosoApplicationService {
  constructor(
    private readonly repository: EndosoRepository,
    private readonly cache: CachePort,
  ) {}

  async update(id: number, body: EndosoUpdateRequestDto): Promise<EndosoUpdateResponseDto> {
    const result = await this.repository.update(id, body);

    await this.cache.del(`bus-impl:production:endoso:show:v1:id:${id}`);
    await this.cache.del(`bus-impl:production:endoso:index:v1:*`);

    return result;
  }
}
```

---

## 16. Decision rapida para este repo

Si este backend va a usar cache, mi recomendacion brutalmente honesta es:

- **default**: no cachear hasta encontrar una lectura repetida y costosa
- **cuando haga falta cache compartida**: ElastiCache Serverless con **Valkey**
- **cuando solo haga falta acelerar el runtime**: reusar cliente/conexion y usar memoria o `/tmp` como optimizacion menor
- **para datos muy sensibles o muy consistentes**: mejor optimizar DB o read model antes que meter cache

---

## 17. Resumen

Reglas finales:

- cache no vive en `domain/`
- cache-aside como baseline
- Valkey/ElastiCache como opcion AWS principal
- TLS, RBAC y separacion por ambiente
- TTL corto, keys versionadas, invalidacion explicita
- fallback a source of truth cuando sea razonable
