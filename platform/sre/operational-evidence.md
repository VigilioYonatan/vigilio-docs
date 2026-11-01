# Evidencia operacional trazable por cambio

Cada modificación significativa debe indicar: motivación, repo/commit, perfiles de skill/documentos, rutas afectadas, pruebas con estado y captura de logs/metricas relevantes, versiones y plan de rollback. La ausencia de plataforma externa no se sustituye con resultados inventados.

✅ Correcto: `PASS` solo con comando/salida real; `NOT_RUN` si falta PostgreSQL, PHP 8.5 o Node 24 en entorno local.

❌ Incorrecto: checklist marcada completa sin infraestructura ni observaciones, fingir deploy o ejecución de OpenSpec/RAG.

Incluye auditoría de decisiones, responsables y ventanas de release. [Estándar CI/CD](../cicd/github-actions-stages.md).

## Procedencia documental preservada

- [Capítulo heredado: 19-evidencia-operacional.md](references/19-evidencia-operacional.md) — contenido íntegro conservado.
- [Capítulo heredado: 24-roadmap-10-10.md](references/24-roadmap-10-10.md) — contenido íntegro conservado.
- [Capítulo heredado: 39-skills-ia-proyecto.md](../../playbooks/references/39-skills-ia-proyecto.md) — contenido íntegro conservado.

> Fuente única para **Cobertura de implementación y evidencia (ampliación)**: [abrir documento canónico](../../governance/complete-work-coverage-policy.md).


## Evidencia de operación y entrega

Los siguientes controles son escenarios de diseño y revisión específicos de este documento. Usar pruebas reales y evidencias del consumidor; aquí **no** se afirma haber desplegado infraestructura.

1. **Control 1:** Guardar commit/hash de artefacto, entorno, config no sensible y aprobaciones.
2. **Control 2:** Registrar comando exacto, timestamp, runner y resultado de cada prueba.
3. **Control 3:** Correlacionar SLI, release y trazas en incidentes y canary.
4. **Control 4:** Identificar tests skipped, fallidos y no ejecutados por separado.
5. **Control 5:** Archivar diff de OpenAPI, migrations y capacidad de rollback de datos.
6. **Control 6:** Conservar SBOM/scan con acceso limitado y política de expiración.
7. **Control 7:** Enlazar cambio de riesgo, ADR y autorización del dueño funcional.
8. **Control 8:** Probar que observabilidad no registra secretos ni PII.
9. **Control 9:** Medir cobertura de restore, no solo existencia de backup.
10. **Control 10:** Dar evidencia verificable a auditoría, no capturas sin contexto.

✅ **Correcto:** ejecutar cada control pertinente, registrar owner, evidencia y decisión de aceptación.

❌ **Incorrecto:** confundir un checklist con un despliegue probado o borrar restricciones anteriores por resumir.
