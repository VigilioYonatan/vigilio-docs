# Límites De Repositorios Y Separación De Responsabilidades

Este estándar define las fronteras de aislamiento físico y lógico entre repositorios de código, infraestructura, empaquetado, GitOps y gobernanza en la plataforma Vigilio 2026.

## Principios De Delimitación

Un sistema escalable no mezcla el ciclo de vida de una aplicación con la infraestructura que la hospeda ni con las imágenes base de contenedor. La arquitectura debe mantener fronteras claras:

1. **Repositorios de Aplicación (`apps/*`):** Contienen únicamente código fuente de servicios o microfrontends, sus contratos API, pruebas unitarias e integradas, y sus definiciones de pipeline CI de test y lint. Nunca deben contener módulos de Terraform ni manifiestos directos de despliegue en producción.
2. **Infraestructura como Código (`infra/`):** Centraliza el aprovisionamiento de infraestructura cloud o de datacenter mediante módulos e instancias por entorno. Gestiona red, cómputo, datos, identidad y políticas de seguridad.
3. **Plataforma de Imágenes (`docker/`):** Repositorio dedicado para Dockerfiles base corporativos, imágenes runtime con endurecimiento de seguridad (distroless o minimal) y firma criptográfica.
4. **Entrega Continua y GitOps (`deploy/`):** Define los manifiestos declarativos de Kubernetes, charts de Helm, overlays de Kustomize y configuraciones de Argo CD o Flux.
5. **Laboratorio Local y Simulación (`prod-local`):** Emulación reproducible del ecosistema completo para desarrollo offline, pruebas E2E y simulación de fallos con Kind, k3d o Docker Compose.

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ apps/*-service  │       │     docker/     │       │     infra/      │
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
             │      deploy/      │                 │ Red / Compute    │
             │ (GitOps / ArgoCD) │ ──────────────> │ (Infra Operativa) │
             └───────────────────┘                 └───────────────────┘
```

## Gobernanza De Repositorios

- Todo repositorio debe ser un repositorio Git independiente con historial auditable y protección de ramas.
- No se permiten carpetas "paraguas" o metarepositorios sin control de submódulos o herramientas de workspace centralizadas.
- Si se agrupan repositorios en un workspace local, la raíz no debe versionar los repositorios hijos como carpetas planas sin Git (`.git` huérfanos).

## Convención De Organizaciones Y Aplicaciones

Los nombres de empresa son ejemplos de organización, no rutas obligatorias. Cada organización conserva las mismas fronteras de responsabilidad:

```text
organizations/
├── vigilio-services/
│   ├── apps/
│   ├── infra/
│   ├── docker/
│   └── deploy/
├── rimac-secures/
│   ├── apps/
│   ├── infra/
│   ├── docker/
│   └── deploy/
└── win/
    ├── apps/
    ├── infra/
    ├── docker/
    └── deploy/
```

Los nombres de aplicación expresan dominio, canal y responsabilidad. Ejemplos ilustrativos:

| Nombre | Responsabilidad |
|---|---|
| `ecommerce-bus-impl` | Backend de dominio o API de ecommerce. `bus-impl` es una convención interna; `ecommerce-api` o `ecommerce-service` resulta más explícito para proyectos nuevos. |
| `ecommerce-web-bff` | Backend for Frontend exclusivo del canal web; adapta y agrega APIs para ese frontend sin contener la fuente de verdad del dominio. |
| `ecommerce-web-mfe` | Microfrontend web de ecommerce desplegable de forma independiente. |
| `facturacion-bus-impl` | Backend de dominio o API de facturación. |
| `facturacion-web-bff` | BFF del canal web de facturación. |
| `facturacion-web-mfe` | Microfrontend web de facturación. |

**BFF** significa **Backend for Frontend**. No es sinónimo de cualquier backend: existe para servir a un canal concreto, por ejemplo web o mobile. **MFE** significa **Microfrontend**: una unidad frontend con ownership y ciclo de despliegue independiente. Un backend de dominio puede atender a varios BFF; un BFF puede componer varios backends para su MFE.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Mantener `infra/` y `deploy/` en repositorios o límites de CI independientes, donde el cambio en un manifiesto Helm no desencadena una ejecución de Terraform ni viceversa.
- ❌ **Incorrecto:** Alojar en un mismo repositorio no versionado o carpeta ad-hoc carpetas anidadas como `apps/`, `infra/`, `docker/` y `deploy/` sin límites de CI ni contratos de interfaz definidos.
- ✅ **Correcto:** Cada repositorio posee su propio `.gitignore`, pipeline de CI independiente y políticas de branch protection con aprobaciones obligatorias.
- ❌ **Incorrecto:** Copiar carpetas enteras de código (`workspace-copy/`, `backup/`) dentro del espacio de trabajo provocando explosión de archivos no rastreados y colisiones de estado.
