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

## Prerrequisitos De Ejecución

1. Motor Git instalado (versión >= 2.40) con soporte para submódulos recursivos y `sparse-checkout`.
2. Archivo canónico `.gitignore` en la raíz del workspace configurado según la taxonomía corporativa.
3. CLI de validación de workspace (`devsecops-governance` o `preflight_runner.py`) disponible en el `PATH`.
4. Matriz `versions.yaml` versionada en la raíz del repositorio de gobernanza.

## Matriz De Decisiones De Estrategia De Workspaces

| Criterio | Submódulos Git | Manifiesto Declarativo (`workspace.yaml`) | Monorepo Único | Paquetes Publicados Desacoplados |
|---|---|---|---|---|
| Acoplamiento de Git | Alto (punteros SHA en árbol Git) | Nulo (declarativo a nivel de tooling) | Máximo (un solo repositorio) | Nulo (consumo vía registry) |
| Independencia de CI/CD | Total por componente | Total por componente | Requiere path-filtering / Nx | Total e independiente |
| Gobernanza de Permisos | Fina por repositorio hijo | Fina por repositorio hijo | CODEOWNERS granular | Control RBAC en registro OCI/npm |
| Complejidad de Sincronización | Media (`git submodule update --init`) | Baja (script `sync.sh` o CLI) | Mínima (un solo checkout) | Estándar de dependencias |

## Procedimiento Operativo De Higiene Y Sincronización

1. **Inicialización Limpia:** Ejecutar `git clone --recurse-submodules` o el orquestador declarativo de workspace.
2. **Auditoría de Higiene Local:** Invocar `git status --ignored` para confirmar que ningún archivo `.tfstate`, `node_modules` o `.env` se encuentre sin ignorar.
3. **Verificación de Versiones de Herramientas:** El preflight runner compara las versiones activas de `terraform`, `kubectl` y `helm` contra `versions.yaml`.
4. **Limpieza Automatizada de Residuos:** Configurar hooks de pre-commit y tareas programadas que purguen carpetas `.logs/` y temporales mayores a 7 días.

## Pruebas Negativas Y Detección De Fallos

- **Bloqueo de Estado Terraform en Git:** Simular creación de archivo `terraform.tfstate`; el pre-commit hook y el CI de gobernanza deben rechazar el commit inmediatamente.
- **Detección de Subcarpetas Git Huérfanas:** Si un desarrollador clona un repositorio anidado dentro de `apps/` sin registrarlo como submódulo, el scanner de workspace emite fallo `ORPHAN_GIT_REPO`.
- **Rechazo de Herramientas Desalineadas:** Si la máquina de build ejecuta Terraform `1.10.x` cuando `versions.yaml` exige `1.9.5`, el pipeline emite veredicto `FAIL` por desalineación determinista.

## Procedimiento De Rollback Y Recuperación

1. **Purga Forzada de Residuos (Clean Slate):** En caso de corrupción o contaminación de dependencias, ejecutar `git clean -fdx -e .env.local` y reinicializar submódulos.
2. **Reversión de Versión de Herramienta:** Si una actualización en `versions.yaml` rompe la compatibilidad, realizar revert del commit en el repositorio central de gobernanza.
3. **Recuperación de Submódulos Desincronizados:** Ejecutar `git submodule foreach --recursive git reset --hard` para alinear todos los árboles hijos con el commit fijado en el padre.

## Evidencia Requerida Para Gates

- `.gitignore` validado contra la lista negra corporativa de artefactos y secretos.
- Reporte `reports/workspace-evidence.json` con `preflight_passed: true`, `hygiene_clean: true` y `boundaries_isolated: true`.
- Matriz `versions.yaml` íntegra y validada sin versiones flotantes.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Seleccionar la estrategia de workspace adecuada al modelo de gobernanza y mantener un `.gitignore` integral que excluya dependencias y cachés locales.
- ❌ **Incorrecto:** Acumular carpetas `.logs/`, `.artifacts/` o dumps de base de datos sin rotación dentro del espacio de trabajo local o remoto.
- ✅ **Correcto:** Centralizar las versiones de herramientas en `versions.yaml` y verificarlas al inicio de los pipelines y scripts de aprovisionamiento.
- ❌ **Incorrecto:** Forzar una única estrategia de workspace sin evaluar si el equipo necesita submódulos, monorepo o paquetes versionados.
