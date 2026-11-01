# Backup, restore y recuperación: runbook

## Respuesta a incidentes

Declarar responsable, servicio/tenant afectado, RTO/RPO y prioridad. Evaluar snapshots/replicas y calidad de restauración. Ensayar restauración aislada periódicamente y verificar datos, grants y compatibilidad con migraciones del runtime.

✅ Correcto: simulacro de restauración con registro de tiempos, consistencia e indicadores del servicio.

❌ Incorrecto: asumir que «backup verde» garantiza RPO/RTO o restaurar a producción sin validación y aprobación.

**Verificación:** playbook de incidente, restauración parcial, comunicación, postmortem sin culpabilización y acciones correctivas verificables. [SRE transversal](../../standards/observability/slo-runbooks.md).

## Procedencia documental preservada

- [Capítulo heredado: 17-backup-restore-dr.md](../../standards/data/references/17-backup-restore-dr.md) — contenido íntegro conservado.
- [Capítulo heredado: 40-operacion-produccion.md](../../stacks/backend/nestjs/runtime/references/40-operacion-produccion.md) — contenido íntegro conservado.

> Fuente única para **Cobertura de implementación y evidencia (ampliación)**: [abrir documento canónico](../../governance/complete-work-coverage-policy.md).


## Ensayo de recuperación ante desastre

Los siguientes controles son escenarios de diseño y revisión específicos de este documento. Usar pruebas reales y evidencias del consumidor; aquí **no** se afirma haber desplegado infraestructura.

1. **Control 1:** Definir RTO y RPO acordados para cada capacidad crítica, no genéricos por empresa.
2. **Control 2:** Mantener backups cifrados y acceso restringido, con auditoría de restauraciones.
3. **Control 3:** Comprobar retención, inmutabilidad y cobertura de BD, blobs, config y secrets recuperables.
4. **Control 4:** Ejecutar restore en entorno aislado con comprobación de consistencia y relaciones.
5. **Control 5:** Medir pérdida real de datos y tiempo de recuperación frente a RTO/RPO.
6. **Control 6:** Probar restauración a punto en el tiempo para un error de operador.
7. **Control 7:** Verificar compatibilidad del backup con schema/migraciones desplegadas.
8. **Control 8:** Reconstruir cachés, índices, colas y embeddings desde fuentes conservadas cuando aplique.
9. **Control 9:** Rotar credenciales y revocar tokens después de recuperación por compromiso.
10. **Control 10:** Documentar pasos de failover/failback, owner, evidencias y fecha del siguiente simulacro.

✅ **Correcto:** ejecutar cada control pertinente, registrar owner, evidencia y decisión de aceptación.

❌ **Incorrecto:** confundir un checklist con un despliegue probado o borrar restricciones anteriores por resumir.
