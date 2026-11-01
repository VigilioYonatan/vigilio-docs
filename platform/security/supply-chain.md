# Seguridad De La Cadena De Suministro (Supply Chain Security)

Establece las directrices para la atestación criptográfica, generación de SBOM, triaje VEX y verificación en admisión de artefactos de software según el marco SLSA v1.0.

## Estructura De Seguridad De La Cadena De Suministro

Para garantizar la integridad y trazabilidad desde el commit hasta el pod en ejecución, la plataforma implementa capacidades compatibles con los requisitos de SLSA. El nivel efectivo demostrado depende de la evidencia verificable del pipeline, no de la mera generación de artefactos de procedencia:

```text
Commit en Git ──> CI Runner Seguro ──> Generación de Imagen OCI
                         │
                         ├──> SBOM con Syft (SPDX / CycloneDX)
                         ├──> Escaneo con Grype / Trivy
                         ├──> Triaje de falsos positivos con OpenVEX
                         ├──> Firma Keyless con Cosign (Fulcio + Rekor)
                         └──> Atestación de procedencia (In-Toto / SLSA)
                                      │
                                      ▼
                        Kubernetes Admission Controller
                   (Kyverno / Sigstore Policy Controller)
                         │ (Verifica firma y políticas)
                         ▼
                     Pod Ejecutado en Producción
```

## Niveles SLSA v1.0 (Build Track): Demostrado Vs Declarado

El nivel SLSA no se autocertifica ni se infiere por la mera ejecución de un pipeline en CI. De acuerdo con la [especificación oficial de niveles SLSA v1.0](https://slsa.dev/spec/v1.0/levels):

1. **Build Level 1 (Procedencia Existente):**
   - Requiere que exista un documento de procedencia (provenance) generado durante el build que describa cómo se produjo el artefacto, incluyendo los parámetros e inputs de nivel superior.
   - *Aclaración técnica:* La simple ejecución de pruebas o compilación en un runner de CI **NO** constituye Build L1 si no se emite formalmente el documento de procedencia estructurado.
2. **Build Level 2 (Procedencia Alojada y Firmada):**
   - La procedencia debe ser generada y firmada criptográficamente por una plataforma de build alojada y confiable (como GitHub Actions con GitHub Attestations o GitLab CI provenance).
   - Impide que el desarrollador modifique o falsifique los metadatos de procedencia desde su entorno local.
3. **Build Level 3 (Plataforma Endurecida y Aislada):**
   - La plataforma de build proporciona garantías estrictas de aislamiento entre ejecuciones (entornos efímeros y herméticos).
   - El proceso de compilación es resistente a la manipulación por parte de los administradores del proyecto, usuarios privilegiados o dependencias comprometidas.

> [!WARNING]
> La plataforma declara capacidades compatibles con SLSA, pero el nivel operativo debe ser auditado y demostrado en cada pipeline. Nunca se debe certificar L2 o L3 sin atestaciones verificables registradas en un log de transparencia o firmadas por el runner de build.

## Prerrequisitos De Implementación

1. Runners de CI con identidad federada OIDC (GitHub Actions / GitLab CI) sin claves privadas estáticas.
2. Herramientas fijadas según `versions.yaml`: Cosign >= 2.4.0, Syft >= 1.10.0, Grype >= 0.80.0.
3. Controladores de admisión en clúster (Kyverno o Sigstore Policy Controller) desplegados en modo fail-closed para producción.

## Matriz De Decisiones: Triaje De Vulnerabilidades Con OpenVEX

| Escenario de CVE | Estado OpenVEX | Justificación Requerida | Acción en Pipeline |
|---|---|---|---|
| CVE crítico en código invocado | `affected` | N/A (Vulnerabilidad real) | **Bloqueo inmediato** del release |
| CVE en dependencia no importada/utilizada | `not_affected` | `component_not_present` o `vulnerable_code_not_in_execute_path` | Pasa con atestación VEX aprobada |
| CVE mitigado por controles externos (eBPF/WAF) | `not_affected` | `vulnerable_code_cannot_be_controlled_by_adversary` | Pasa con revisión de seguridad |
| Parche en desarrollo por proveedor | `under_investigation` | Ticket de seguimiento con TTL <= 14 días | Pasa condicionalmente a staging |

## Pruebas Negativas Y Detección De Falsificaciones

- **Imagen No Firmada:** Despliegue de una imagen construida localmente sin firma Cosign; el Admission Controller debe rechazar la creación del pod con código HTTP 403 / Admission Webhook Denied.
- **Firma Corrupta / Digest Manipulado:** Alteración de un solo byte en la capa de la imagen OCI; la verificación con `cosign verify` debe fallar inmediatamente.
- **Atestación VEX Expirada:** Documentos VEX con fecha de expiración superada deben ser rechazados automáticamente en el gate de producción.

## Procedimiento De Rollback Y Admisión

1. **Rechazo en Admisión:** Si una imagen promovida falla la verificación de firma o procedencia en el Admission Controller, el despliegue de Kubernetes se aborta automáticamente preservando los pods de la réplica anterior (cero indisponibilidad).
2. **Revocación de Firmas:** En caso de compromiso de dependencias, registrar la revocación en el log de transparencia o actualizar la política de Kyverno para rechazar digest específicos.

## Evidencia Requerida Para Auditoría

- Documento SBOM (`sbom.spdx.json`) archivado como artefacto inmutable del build.
- Atestación de procedencia SLSA (`provenance.json`) firmada mediante OIDC y verificada en Rekor.
- Archivo VEX (`triage.openvex.json`) firmado digitalmente por el responsable de seguridad si existen excepciones.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Generar procedencia estructurada y firmar imágenes con Cosign mediante OIDC del runner, bloqueando la admisión si falta la firma.
- ❌ **Incorrecto:** Autocertificar SLSA Level 3 sin una plataforma de build aislada y resistente a manipulaciones demostrada con atestaciones reales.
- ✅ **Correcto:** Documentar excepciones de CVEs no explotables mediante declaraciones OpenVEX formalizadas y aprobadas por seguridad.
- ❌ **Incorrecto:** Desactivar la verificación de admisión en el clúster para acelerar un despliegue de emergencia o usar tags flotantes (`latest`).
