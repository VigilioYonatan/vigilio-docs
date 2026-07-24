# Registro de Deuda Tecnica - 2026

Este documento registra decisiones y brechas verificables de `bus-impl`. No debe duplicar issues
cerrados ni presentar como implementado un control que depende de configuracion externa.

## 1. Referencias inmutables en GitHub Actions

Estado: implementado en los workflows activos.

- las acciones externas se fijan a SHA completo;
- Dependabot propone actualizaciones auditables;
- `vigilio-governance validate-workflows` bloquea referencias flotantes;
- los reusable workflows de `vigilio-platform-actions` tambien deben consumirse por SHA completo.

La validacion no se copia como script dentro de cada proyecto.

## 2. Gobernanza Jira

Estado: implementado en codigo; configuracion externa requerida.

- `vigilio-platform-actions/actions/jira-devops` centraliza transiciones, deployments, releases,
  incidentes, smart commits y feature flags;
- `bus-impl` consume la accion por SHA;
- los nombres reales de transicion vienen de variables GitHub.

Variables:

```text
JIRA_TRANSITION_CODE_REVIEW
JIRA_TRANSITION_STAGING
JIRA_TRANSITION_PRODUCTION
```

La automatizacion solo funciona si URL, usuario, token, permisos y transiciones existen en Jira.

## 3. GitHub Advanced Security

Estado: depende del plan y configuracion de la organizacion.

- CodeQL y Dependency Review deben habilitarse cuando el plan/repositorio los soporte;
- Trivy, Semgrep, Gitleaks, Checkov y `pnpm audit` mantienen cobertura complementaria;
- ningun scanner individual reemplaza SAST, SCA, secret scanning e IaC scanning combinados.

## 4. Riesgo de PR y governance compartido

Estado: migrado al paquete central.

El gate local antiguo fue reemplazado por:

```bash
vigilio-governance validate-pr-body --body-file pr-body.txt
vigilio-governance validate-pr-risk --body-file pr-body.txt
vigilio-governance validate-repository --policy-file .github/repository-policy.json
vigilio-governance validate-platform-baseline
```

La implementacion vive en `@vigilioyonatan/devsecops-governance`; no debe reaparecer como scripts
copiados dentro de `bus-impl`.

## 5. Deteccion de cambios en `ci.yml`

Estado: deuda consciente.

`ci.yml` conserva logica Bash extensa para decidir que jobs ejecutar. Funciona, pero aumenta el
costo de mantenimiento y puede divergir del reusable workflow central.

Plan:

1. comparar la matriz local con `shared-backend-node-nest-ci.yml`;
2. migrar sin perder los paths y suites especiales de `bus-impl`;
3. mantener `Required CI Gate` como unico check requerido estable;
4. retirar YAML local duplicado solo despues de validar paridad.

## 6. Adopcion de reusable workflows

Estado: parcial.

`vigilio-platform-actions` ya publica CI y deploy CDK reutilizables. `bus-impl` consume actions y
paquetes centrales, pero todavia ejecuta workflows locales extensos.

No se deben borrar los workflows locales hasta demostrar:

- mismos jobs y artefactos;
- mismos permisos minimos;
- soporte de PostgreSQL, Floci, BDD, OpenAPI, Playwright y CDK;
- misma evidencia de deploy, Jira y seguridad;
- rollback probado.

## 7. Controles externos

Estado: no demostrable solo desde Git.

Queda verificar periodicamente:

- ruleset de `main`, merge queue y required checks reales;
- reviewers y no bypass de GitHub Environments;
- AWS OIDC, IAM y KMS desplegados;
- alarmas, dashboards y runbooks operativos;
- restore y rollback drills con evidencia;
- retencion y acceso de artefactos de auditoria.

La presencia de una policy o workflow no demuestra que el control externo este activado.

## 8. Release coordinada de paquetes

Estado: fuente validada; publicacion pendiente.

Resuelto el 2026-07-23:

- los cuatro paquetes fuente quedaron versionados en `0.1.0` mediante Changesets;
- lint, typecheck, 55 tests, build, governance y smoke de cuatro tarballs pasaron;
- Husky, `packageManager`, workflows y policy central usan pnpm `11.7.0`;
- los manifests de `.opencode/skills` y `.agents/skills` identifican `vigilio-skills` `0.1.0` y
  verifican 21 archivos gestionados en cada destino.

Pendiente externo:

1. fusionar el Release PR de `vigilio-platform-actions` y publicar `0.1.0` en GitHub Packages;
2. autenticar local o CI con `read:packages`;
3. ejecutar `pnpm install` en `bus-impl` para incorporar los cuatro paquetes al lockfile;
4. ejecutar en el consumidor `pnpm skills:check`, `pnpm test:devsecops`, lint, typecheck y tests;
5. no migrar otros proyectos hasta que la version publicada sea verificable.

## 9. Nueva release de reusable workflows

Estado: pendiente de release inmutable.

El worktree central ya contiene una revision de CI/deploy con pnpm `11.7.0`, acciones fijadas a SHA,
evidencia, Jira, DAST y gates ampliados. La release `v1` todavia contiene defaults `11.5.2` y no
representa esa revision.

`bus-impl` conserva por ahora `ci.yml` y `secure-deploy-cdk.yml` locales. Solo se migran al reusable
central despues de:

1. publicar y etiquetar la nueva revision;
2. fijar el consumo al SHA de esa release;
3. comprobar paridad de Jira, Floci, BDD, OpenAPI, Playwright, CDK, evidencia y rollback;
4. actualizar el ruleset para requerir el check estable del nuevo workflow.
