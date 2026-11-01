# Modelo De Gobernanza Y Responsabilidad (Ownership)

Establece las responsabilidades, asignación de propiedad de código y controles de aprobación para repositorios de plataforma, aplicaciones e infraestructura.

## Matriz De Responsabilidades Por Dominio

| Dominio | Propietario Principal | Responsabilidades |
|---|---|---|
| `infra-v2/`, `infra/` | Equipo de Cloud & Infraestructura | Módulos Terraform, VPC, IAM, EKS, políticas de drift y seguridad cloud. |
| `deploy-v2/`, `gitops/` | Equipo de SRE & Platform | Charts Helm, Kustomize, ArgoCD sync, ingress, service mesh y autoscaling. |
| `docker-v2/`, `images/` | Equipo DevSecOps | Endurecimiento de imágenes, escaneo Trivy/Grype, firma Cosign y SBOM. |
| `apps/*` | Equipos de Desarrollo de Producto | Lógica de negocio, controladores, DTOs, tests unitarios y observabilidad app. |
| `prod-local` | Platform Engineering | Simulación fiel en local con Kind, semillas de datos y perfiles de testing. |

## Reglas De CODEOWNERS

Cada repositorio debe contar con un archivo `.github/CODEOWNERS` o `.gitlab/CODEOWNERS` que imponga revisiones obligatorias:

```text
# Gobernanza global
*                       @vigilio-platform/reviewers

# Infraestructura sensible
/infra/                 @vigilio-platform/cloud-engineers
/environments/prod/     @vigilio-platform/infra-leads @vigilio-platform/security

# Políticas de seguridad y runtime
/policies/              @vigilio-platform/devsecops
/supply-chain/          @vigilio-platform/devsecops

# Manifiestos de producción
/gitops/overlays/prod/  @vigilio-platform/sre-leads
```

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Bloquear el merge a ramas protegidas (`main`, `production`) hasta contar con aprobaciones explícitas de los propietarios designados en `CODEOWNERS`.
- ❌ **Incorrecto:** Permitir que cambios en infraestructura cloud o políticas de seguridad eBPF se aprueben automáticamente sin revisión de un especialista de plataforma.
- ✅ **Correcto:** Auditar periódicamente la membresía de los grupos de CODEOWNERS y vincularlos a roles institucionales del directorio de identidad corporativa.
- ❌ **Incorrecto:** Dejar rutas críticas como `/environments/production/` o `/policies/` sin reglas explícitas de propietarios.
