# Contrato Operativo Común De Plataforma

Este estándar contiene las reglas transversales que comparten las skills de Platform Engineering. Los contratos específicos enlazan este documento y sólo agregan decisiones, evidencia y excepciones propias de su dominio.

## Contexto Antes De Decidir

Resuelve nombres, repositorios, entornos y proveedor siguiendo este orden:

1. Configuración explícita y válida en `.vigilio/platform-context.yaml`.
2. Manifiestos reales del repositorio, por ejemplo `package.json`, `Chart.yaml`, `kustomization.yaml`, archivos Terraform y pipelines.
3. Inferencia segura basada en evidencia consistente de más de una fuente.
4. `NOT_RUN` cuando falte información crítica.

Nunca inventes nombres de servicios, organizaciones, clústeres, registros, cuentas o entornos. La configuración explícita no puede contradecir manifiestos ejecutables sin producir `FAIL` o `BLOCKED`.

## Invariantes Compartidos

| Tema | Requisito |
|---|---|
| Arquitectura | Declarativa, versionada, auditable y con ownership explícito. |
| Entrega | Artefactos inmutables por digest (`@sha256:`) promovidos mediante gates; no reconstruidos por entorno. |
| GitOps | Git es la única fuente de verdad declarativa de Kubernetes; Argo CD concilia el estado sin `kubectl patch` permanentes. |
| Seguridad | Fail-closed en controles críticos, mínimo privilegio (`mr-untrusted` aislado de firma y producción) y excepciones con propietario y vencimiento. |
| Datos sensibles | Secretos, claves privadas y PII fuera de Git, logs, métricas, trazas, evidencias y ejemplos publicados. |
| Clasificación | Diferenciar `DECLARED`, `STATIC_TESTED`, `APPLIED`, `RUNTIME_VERIFIED`, `CERTIFIED_LAB`, `NOT_RUN`, `BLOCKED_EXTERNAL` y `FAIL`; nunca etiquetar evidencia `LAB` como `PRODUCTION_LIKE`. |
| Cleanup y baja | Todo recurso efímero (`review/*`) declara `owner` y `TTL`, usa datos sintéticos y cuenta con eliminación equivalente e idempotente. |
| Soporte y evolución | Plantillas, schemas y acciones evolucionan con SemVer (`N` / `N-1`), guía de migración y ruta de rollback comprobada. |
| Cambios existentes | Inspeccionar baseline, locks y pruebas antes de modificar; evitar reescrituras masivas no solicitadas ni `reset --hard` / `force-push`. |
| Evidencia | Registrar qué se ejecutó, sobre qué commit o digest, con hashes SHA-256 y resultado reproducible. |

## Evidencia Mínima

- Commit, digest o versión inmutable del artefacto evaluado.
- Comando, workflow o procedimiento realmente ejecutado.
- Resultado `PASS`, `PASS_LAB`, `FAIL`, `NOT_RUN` o `BLOCKED_EXTERNAL`, sin convertir ausencia de evidencia en éxito.
- Propietario y enlace resoluble al runbook y dashboard cuando exista impacto operativo.
- Coste, cleanup verificado, rollback y radio de impacto cuando sean relevantes.

## Excepciones

Una excepción requiere motivo, propietario, alcance, ticket, compensaciones y TTL. Al vencer debe restaurarse automáticamente el control o bloquearse la promoción. Una excepción permanente debe convertirse en una decisión arquitectónica formal, no en una anotación informal.

## Manejo De Código Existente

- Preserva cambios del usuario y separa hallazgos preexistentes de cambios introducidos por la tarea.
- No declares herramientas, controles o entornos como activos sólo porque exista configuración aspiracional.
- Si una verificación requiere acceso, credenciales, otra persona u otro host físico no disponibles, reporta `NOT_RUN` o `BLOCKED_EXTERNAL`.
- Consulta [refactorización de código existente](../engineering/refactoring-existing-code.md) cuando el trabajo modifique una base heredada.

## Validación Del Contexto

El contrato opcional y su precedencia se definen en [contexto dinámico de plataforma](platform-context.md). El archivo debe validarse contra [`platform-context.schema.json`](../../schemas/platform-context.schema.json) antes de usarse.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Resolver el contexto desde configuración validada y manifiestos reales, ejecutar gates fail-closed, limpiar recursos efímeros y conservar evidencia verificable clasificada honestamente (`LAB` vs global).
- ❌ **Incorrecto:** Copiar nombres de un ejemplo, exponer secretos en logs, asumir que existe producción física en una laptop o aprobar un control porque el documento describe cómo debería funcionar.
