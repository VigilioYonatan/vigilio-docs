# SRE: producción, alertas, finops y recuperación

Definir objetivos de servicio y medir disponibilidad, latencia, error rate y saturación para endpoints y workers. Alertar por burn rate de error budget, no por volumen de logs.

- Incidentes: `trace_id` → Grafana traces → logs correlacionados → causa probable → rollback controlado.
- Rollback: separar despliegue de código de rollback de DB; migrations expand-contract para que versiones coexistentes funcionen.
- Redis outage: fallback degradado y tasa de error; Postgres outage: error controlado, no falsificar éxito.
- Queue DLQ: runbook replay con idempotencia; revisar retry storms y límites.
- DR: RPO/RTO medidos con restore drills; backups no cuentan como restauración hasta probarlos.
- FinOps: right-size CPU/mem, almacenamiento/egress y curvas de autoscaling; sin valores inventados.

Instrumentación compartida [observability](../../standards/observability/otel.md) y [runbook histórico](../../platform-runtime/2-eks-gitops-operations.md).

> Fuente única para **Correcto / Incorrecto: revisión 2026**: [abrir documento canónico](../../governance/documentation-dry-and-ownership.md).


## Operación de producción

1. Definir SLI (solicitudes exitosas, latencia p95/p99, errores), SLO, alertas por burn rate y runbooks ejecutables.
2. Separar observabilidad de aplicación (OTel) de infraestructura (nodos/pods, presión de memoria, colas, disco).
3. Definir señales de rollback: tasa 5xx, cola DLQ, errores de base de datos, saturación, pérdida de eventos.
4. Tratar versiones como *baseline candidato* hasta comprobar lockfiles y dependencias en ambiente de staging.

✅ Mantener capacidad de rastrear request → job → base de datos. ❌ Instrumentar IDs únicos como labels métricos, ignorar saturación del pool SQL o registrar credenciales en logs.

## Señales, objetivos y alertas

Definir SLIs por capacidad (éxito y latencia HTTP, saturación de workers, error de cola, DB pool, Redis). Registrar SLO y presupuesto de error; la severidad de alerta representa impacto real, no solo un umbral arbitrario.

- **Logs estructurados:** requestId, traceId, severity, operationId; sin cuerpos HTTP completos, tokens, credenciales ni datos personales.
- **Métricas:** baja cardinalidad: ruta normalizada, método, código HTTP, status de caché; no usar `product_id`, `order_id` ni `tenant_id` en labels.
- **Trazas:** OTel instrumentación inicializada antes de librerías, contexto propagado a workers y HTTP saliente.
- **Alertas:** error budget burn-rate, alta latencia sostenida, saturación y dead-letter. Cada alerta apunta a un runbook con acciones y dueño.

✅ Validar alertas mediante simulación controlada y enlaces de logs/traces; ❌ alertar por cada excepción individual o etiquetar métricas con IDs únicos.

**Revisión postincidente:** línea temporal, causa sistémica, acciones correctivas con responsable y test de no regresión; sin culpabilizar personas.

> Fuente única para **Cobertura de implementación y evidencia (ampliación)**: [abrir documento canónico](../../governance/complete-work-coverage-policy.md).

