# Límites De Repositorios Y Separación De Responsabilidades

Este estándar define las fronteras de aislamiento físico y lógico entre repositorios de código, infraestructura, empaquetado, GitOps y gobernanza en la plataforma Vigilio 2026.

## Principios De Delimitación

Un sistema escalable no mezcla el ciclo de vida de una aplicación con la infraestructura que la hospeda ni con las imágenes base de contenedor. La arquitectura debe mantener fronteras claras:

1. **Repositorios de Aplicación (`apps/*`):** Contienen únicamente código fuente de servicios o microfrontends, sus contratos API, pruebas unitarias e integradas, y sus definiciones de pipeline CI de test y lint. Nunca deben contener módulos de Terraform ni manifiestos directos de despliegue en producción.
2. **Infraestructura como Código (`infra-v2`):** Centraliza el aprovisionamiento de infraestructura cloud (AWS, Azure, GCP) mediante módulos e instancias por entorno. Gestiona VPCs, clústeres EKS, bases de datos gestionadas, colas e IAM.
3. **Plataforma de Imágenes (`docker-v2` / `images`):** Repositorio dedicado para Dockerfiles base corporativos, imágenes runtime con endurecimiento de seguridad (distroless, minimal alpine) y firma criptográfica.
4. **Entrega Continua y GitOps (`deploy-v2` / `practicing-3`):** Define los manifiestos declarativos de Kubernetes, charts de Helm, overlays de Kustomize y configuraciones de ArgoCD/Flux.
5. **Laboratorio Local y Simulación (`prod-local`):** Emulación reproducible del ecosistema completo para desarrollo offline, pruebas E2E y simulación de fallos con Kind, k3d o Docker Compose.

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   apps/backend  │       │  docker-v2      │       │    infra-v2     │
│  (Código + Test)│       │  (Base Images)  │       │(Terraform Cloud)│
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         │
 ┌───────────────┐         ┌───────────────┐                 │
 │ Contenedor App│ ──────> │  Cosign / ECR │                 │
 └───────┬───────┘         └───────┬───────┘                 │
         │                         │                         │
         └─────────────┬───────────┘                         │
                       ▼                                     ▼
             ┌───────────────────┐                 ┌───────────────────┐
             │     deploy-v2     │                 │   EKS / VPC AWS   │
             │ (GitOps / ArgoCD) │ ──────────────> │ (Infra Operativa) │
             └───────────────────┘                 └───────────────────┘
```

## Gobernanza De Repositorios

- Todo repositorio debe ser un repositorio Git independiente con historial auditable y protección de ramas.
- No se permiten carpetas "paraguas" o metarepositorios sin control de submódulos o herramientas de workspace centralizadas.
- Si se agrupan repositorios en un workspace local, la raíz no debe versionar los repositorios hijos como carpetas planas sin Git (`.git` huérfanos).

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Mantener `infra-v2` y `deploy-v2` en repositorios versionados independientes, donde el cambio en un manifiesto Helm no desencadena una ejecución de Terraform ni viceversa.
- ❌ **Incorrecto:** Alojar en un mismo repositorio no versionado o carpeta ad-hoc carpetas anidadas como `apps/`, `infra/`, `docker/` y `deploy/` sin límites de CI ni contratos de interfaz definidos.
- ✅ **Correcto:** Cada repositorio posee su propio `.gitignore`, pipeline de CI independiente y políticas de branch protection con aprobaciones obligatorias.
- ❌ **Incorrecto:** Copiar carpetas enteras de código (`practicing-2/`, `backup/`) dentro del espacio de trabajo provocando explosión de archivos no rastreados y colisiones de estado.
