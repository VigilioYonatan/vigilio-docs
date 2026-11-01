# Seguridad De La Cadena De Suministro (Supply Chain Security)

Establece las directrices para la atestación criptográfica, generación de SBOM, triaje VEX y verificación en admisión de artefactos de software.

## Estructura De Seguridad De La Cadena De Suministro

Para garantizar la integridad y trazabilidad desde el commit hasta el pod en ejecución, la plataforma implementa una arquitectura SLSA Nivel 3:

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

## Componentes Y Gobernanza

1. **Firma Criptográfica con Cosign:** Toda imagen OCI debe ser firmada en el pipeline utilizando identidad federada OIDC (Keyless), registrando la atestación en el libro mayor de transparencia pública o privada (Rekor).
2. **Inventario de Componentes (SBOM):** Por cada compilación, se genera un archivo SBOM estructurado que cataloga todas las dependencias directas y transitivas del contenedor.
3. **Triaje de Vulnerabilidades con OpenVEX:** Cuando se detecta un CVE que no es explotable en nuestro contexto de ejecución (por ejemplo, código no invocado o arquitectura mitigada), se documenta formalmente un documento OpenVEX con el estado `not_affected` y la justificación técnica, evitando bloqueos injustificados del pipeline.
4. **Validación en Tiempo de Admisión:** El controlador de admisión en el clúster de Kubernetes rechaza de forma fail-closed cualquier pod cuya imagen no contenga una firma válida emitida por los flujos aprobados de CI.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Bloquear el despliegue de imágenes que carezcan de firma Cosign verificable o que presenten CVEs críticos sin análisis VEX aprobado.
- ❌ **Incorrecto:** Desactivar la verificación de firmas o controladores de admisión en producción para "desplegar de emergencia".
- ✅ **Correcto:** Generar atestaciones de procedencia SLSA inmutables vinculadas al commit y repositorio exactos de compilación.
- ❌ **Incorrecto:** Confiar en escaneos de vulnerabilidades locales no auditados sin trazabilidad en los logs del pipeline.
