# Common Operational Contract (Canonical Source)

**Version**: `1.0.0`  
**Owner**: `platform-team`

## 1. Arquitectura y Entrega
- GitLab CI/CD ejecuta validación, compilación, escaneo y firma por digest (`@sha256:`).
- Argo CD concilia el estado declarado en Git como única fuente de verdad (`GitOps`).
- Todo entorno temporal (`review/*`) utiliza datos sintéticos, owner explícito y TTL finito.

## 2. Seguridad y Mínimo Privilegio
- Prohibido versionar secretos, tokens o claves privadas en Git o en evidencia.
- Prohibido imprimir credenciales en stdout/stderr.
- Runners no confiables (`mr-untrusted`) no pueden acceder a secretos protegidos, firma ni producción.

## 3. Evidencia y Clasificación
- Estados permitidos: `DECLARED`, `STATIC_TESTED`, `APPLIED`, `RUNTIME_VERIFIED`, `CERTIFIED_LAB`, `NOT_RUN`, `BLOCKED_EXTERNAL`, `FAIL`.
- Evidencia de laboratorio local nunca se etiqueta como `PRODUCTION_LIKE`.
- Toda creación temporal debe contar con eliminación equivalente e idempotente (`cleanup`).

## 4. Código Existente y Soporte
- Preservar cambios locales existentes; prohibido `reset --hard` o `force-push`.
- Los contratos y plantillas se versionan con SemVer (`N` / `N-1`) y guía de migración/rollback.
