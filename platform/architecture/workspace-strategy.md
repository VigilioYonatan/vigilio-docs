# Estrategia De Workspaces E Higiene De Artefactos

Define la estrategia de organización del espacio de trabajo de desarrollo y automatización, asegurando reproducibilidad y limpieza de artefactos en los entornos de Vigilio.

## Modelos De Organización De Workspace

La organización de repositorios múltiples debe responder a las necesidades de propiedad, ciclo de lanzamiento y permisos del equipo. Existen varias alternativas arquitectónicas válidas:

1. **Submódulos Git:** Enlaza repositorios remotos independientes mediante un archivo `.gitmodules` con commit SHAs fijados. Adecuado cuando los equipos requieren control explícito de versiones upstream.
2. **Manifiestos de Workspace Declarativos:** Archivos estructurados (`workspace.yaml`, `versions.yaml`) que especifican los repositorios y versiones que componen el entorno sin acoplamiento a nivel de Git.
3. **Herramientas de Multirepo:** Gestores de workspaces como Google `repo`, `mu-repo` o scripts de sincronización que clonan y actualizan el conjunto de repositorios de forma determinista.
4. **Monorepo:** Repositorio único con carpetas por dominio (`apps/`, `infra/`, `packages/`) gobernado por reglas de `CODEOWNERS` y herramientas de build incremental (Nx, Turborepo).
5. **Dependencias Publicadas:** Servicios desacoplados que consumen interfaces e imágenes OCI a través de registros (npm, Harbor, ECR) sin clonar el código fuente de los demás servicios.

> [!TIP]
> La elección entre estas estrategias depende de la propiedad del código (ownership), la necesidad de atomicidad en cambios transversales, los permisos de acceso entre equipos y la frecuencia de actualización.

```text
workspace-root/
├── versions.yaml                   # Matriz canónica de herramientas y versiones (Terraform, Helm, OTel)
├── apps/
│   ├── backend/                    # Componente de aplicación
│   └── frontend/                   # Componente de interfaz
├── platform/
│   ├── infra/                      # Infraestructura (Terraform)
│   └── gitops/                     # Manifiestos de despliegue (Helm / ArgoCD)
└── tools/
    └── scripts/                    # Utilidades transversales de verificación
```

## Higiene Estricta De Artefactos

El workspace debe mantenerse libre de artefactos temporales y residuos de compilación. Ningún proceso de automatización debe comitear carpetas efímeras.

Las carpetas estrictamente prohibidas en el árbol versionado son:
- `.terraform/`, `*.tfstate`, `*.tfstate.backup`
- `node_modules/`, `dist/`, `.pnpm-store/`
- `.logs/`, `*.log`, `.artifacts/`, `evidence/`
- Archivos `.env` con secretos en texto claro
- Copias duplicadas de seguridad (`practicing-backup/`, `old/`)

## Control Canónico De Versiones De Herramientas

Las herramientas CLI utilizadas por los ingenieros y los pipelines de CI deben provenir de una única matriz declarativa en `versions.yaml`. Se prohíbe tener versiones hardcodeadas divergentes entre scripts de PowerShell, Bash y GitHub Actions.

```yaml
tools:
  terraform: "1.9.5"
  helm: "3.15.4"
  kubectl: "1.30.3"
  kind: "0.23.0"
  tetragon: "1.1.2"
  cosign: "2.4.0"
```

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Seleccionar la estrategia de workspace adecuada al modelo de gobernanza y mantener un `.gitignore` integral que excluya dependencias y cachés locales.
- ❌ **Incorrecto:** Acumular carpetas `.logs/`, `.artifacts/` o dumps de base de datos sin rotación dentro del espacio de trabajo local o remoto.
- ✅ **Correcto:** Centralizar las versiones de herramientas en `versions.yaml` y verificarlas al inicio de los pipelines y scripts de aprovisionamiento.
- ❌ **Incorrecto:** Forzar una única estrategia de workspace sin evaluar si el equipo necesita submódulos, monorepo o paquetes versionados.
