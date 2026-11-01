# Fábrica De Pipelines CI/CD Y Plantillas Reutilizables

Define los estándares para la unificación, centralización y gobernanza de flujos de integración y entrega continua en la plataforma Vigilio.

## Centralización Frente A Duplicación

Una mala práctica recurrente en polirepositorios es duplicar archivos de pipeline completos (por ejemplo, `container-gitops.yml`) entre servicios de backend y frontend. Esto provoca deriva de versiones, diferencias en las comprobaciones de seguridad y alto coste de mantenimiento.

La Fábrica de Pipelines centraliza los flujos reutilizables en un repositorio corporativo de gobernanza (`platform-actions`):

```text
platform-actions/
├── .github/workflows/
│   ├── reusable-lint-test.yml     # Plantilla canónica de linters y pruebas
│   ├── reusable-container-build.yml# Plantilla de build OCI, SBOM y firma Cosign
│   └── reusable-gitops-promote.yml# Plantilla de promoción declarativa hacia deploy-v2
```

## Consumo Declarativo Desde Repositorios De Aplicación

Los repositorios individuales (`apps/backend`, `apps/frontend`) definen archivos mínimos que invocan la plantilla canónica sin duplicar lógica:

```yaml
# apps/bus-impl/.github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:

jobs:
  pipeline:
    uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/reusable-container-build.yml@v0.8.0
    with:
      service-name: bus-impl
      dockerfile-path: ./Dockerfile
    secrets: inherit
```

## Etapas Obligatorias Del Pipeline Corporativo

1. **Gate 1 - Calidad y Pruebas:** Formato (Biome/Prettier), compilación TypeScript/PHP y ejecución de suites de tests unitarios e integrados.
2. **Gate 2 - Seguridad de Código y Dependencias:** Escaneo SAST (Semgrep/CodeQL) y análisis de vulnerabilidades en dependencias (Snyk/Trivy).
3. **Gate 3 - Construcción Inmutable:** Creación de imagen OCI multi-arquitectura con buildx y digest SHA-256 inmutable.
4. **Gate 4 - Cadena de Suministro:** Generación de SBOM con Syft y firma criptográfica con Cosign (Keyless con GitHub OIDC).
5. **Gate 5 - Promoción GitOps:** Creación de Pull Request o commit directo sobre el repositorio `deploy-v2`.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Invocar flujos de trabajo reutilizables versionados (`@v0.8.0`) desde un repositorio centralizado de plataforma.
- ❌ **Incorrecto:** Copiar y pegar 300 líneas de YAML de pipeline entre múltiples aplicaciones de backend y frontend.
- ✅ **Correcto:** Mantener secretos y credenciales restringidas a nivel de organización o entorno con permisos de mínimo privilegio.
- ❌ **Incorrecto:** Definir pasos de construcción con flags de omisión de pruebas (`--skip-tests`) para acelerar la entrega en ramas principales.
