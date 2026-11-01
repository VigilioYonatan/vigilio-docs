# Estrategia De Workspaces E Higiene De Artefactos

Define la estrategia de organización del espacio de trabajo de desarrollo y automatización, asegurando reproducibilidad y limpieza de artefactos en los entornos de Vigilio.

## Modelos De Workspace: Polirepositorio Con Submódulos

Para plataformas que integran múltiples servicios independientes con ciclos de vida desacoplados, se adopta el modelo de orquestación por submódulos Git gobernados:

```text
workspace-root/
├── .gitmodules                     # Mapeo estricto a repositorios remotos con commit SHAs fijados
├── versions.yaml                   # Matriz canónica de herramientas y versiones (Terraform, Helm, OTel)
├── apps/
│   ├── backend/                    # Git submodule
│   └── frontend/                   # Git submodule
├── platform/
│   ├── infra/                      # Git submodule (Terraform)
│   └── gitops/                     # Git submodule (Helm / ArgoCD)
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

- ✅ **Correcto:** Mantener un `.gitignore` integral en la raíz y en cada repositorio que ignore dependencias, cachés de herramientas e imágenes temporales de pruebas.
- ❌ **Incorrecto:** Acumular carpetas `.logs/`, `.artifacts/` o dumps de base de datos sin rotación dentro del espacio de trabajo local o remoto.
- ✅ **Correcto:** Centralizar las versiones de herramientas en `versions.yaml` y verificarlas al inicio de los pipelines y scripts de aprovisionamiento.
- ❌ **Incorrecto:** Ejecutar pipelines con versiones `latest` no fijadas que provoquen derivas incompatibles entre el entorno local y producción.
