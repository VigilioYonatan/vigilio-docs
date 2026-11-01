# Promoción De Artefactos E Inmutabilidad En GitOps

Establece las directrices para la construcción única de imágenes de contenedor y su promoción verificable a través de los entornos de entrega continua.

## El Principio: Construir Una Sola Vez, Promover Muchas

Un artefacto de software (imagen OCI, chart de Helm o paquete de librerías) debe compilarse exclusivamente en el pipeline de Integración Continua del repositorio de origen. Está terminantemente prohibido compilar de nuevo el código fuente en Staging o Producción.

```text
Código Fuente (apps/*)
       │
       ▼  (CI Build)
Imagen OCI generada (@sha256:abcd...)
       │
       ├──> Firma Cosign con OIDC (Keyless)
       ├──> Generación de SBOM (Syft)
       └──> Escaneo de vulnerabilidades (Grype / Trivy)
       │
       ▼  (Promoción GitOps: PR automático en deploy-v2)
  staging/values.yaml (actualiza digest @sha256:abcd...)
       │
       ▼  (Gates superados + Aprobación manual SRE)
  prod/values.yaml (actualiza digest @sha256:abcd...)
```

## Flujo De Promoción Declarativa

1. **Construcción y Digest SHA-256:** El pipeline de la app genera la imagen y la referencia por su `sha256` inmutable, nunca por tags mutables como `v1.0.0` o `latest`.
2. **Registro de Artefactos:** La imagen se almacena en el registro corporativo (ECR / Harbor) con inmutabilidad de tags activada.
3. **Commit de Promoción:** Una herramienta de automatización (como Renovate, ArgoCD Image Updater o un bot CI de plataforma) crea un commit o Pull Request en el repositorio GitOps (`deploy-v2`) actualizando el archivo `values.yaml` del entorno correspondiente.
4. **Despliegue Reconciliado:** El motor GitOps (ArgoCD o Flux) detecta el nuevo commit y aplica los cambios en el clúster.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Promover artefactos mediante commits git en el repositorio de despliegues referenciando digests inmutables (`@sha256:7f3b...`).
- ❌ **Incorrecto:** Usar tags móviles como `dev`, `staging` o `v1-latest` que pueden cambiar silenciosamente y provocar desincronización entre réplicas.
- ✅ **Correcto:** Exigir que la imagen cuente con firma criptográfica válida y atestación de procedencia (SLSA) antes de permitir su despliegue en producción.
- ❌ **Incorrecto:** Realizar despliegues manuales mediante `kubectl apply` o `docker push` directo desde máquinas de desarrollo a clústeres remotos.
