# Plataforma compartida: Kubernetes, cloud, IaC, CI/CD y SRE

> **Versiones centralizadas:** consultar [technology/versions.md](../technology/versions.md). Los números que aparecen en ejemplos anteriores son históricos, no el baseline activo.

Normas de operación independientes de framework, aplicadas por perfiles específicos según destino real. No mezclar PHP-FPM/Kubernetes con Node Lambda/CDK si el proyecto no usa esas plataformas.

- [Kubernetes seguro](kubernetes/deployment-security.md)
- [AWS EKS y Azure](cloud/runtime-options.md)
- [Terraform / AWS CDK](iac/terraform-cdk.md)
- [GitHub Actions, GitOps y rollout](cicd/github-actions-gitops.md)
- [SRE, alertas y rollback](sre/operations.md)

Los pipelines **ejecutables** compartidos permanecen en `vigilio-platform-actions` cuando estén disponibles. Aquí se documentan diseños, evidencia y ejemplos sin simular deployments de usuario.

> Fuente única para **Correcto / Incorrecto: revisión 2026**: [abrir documento canónico](../governance/documentation-dry-and-ownership.md).


## Guías canónicas incorporadas en la migración NestJS 2026

Opciones por runtime (sin imponer framework): [AWS Lambda](aws/lambda-operations.md), [AWS FinOps](aws/finops.md), [CDK AWS](iac/cdk-aws.md), [gobierno CI/CD](cicd/release-governance.md).

✅ Correcto: enlazar el propietario único de cada decisión. ❌ Incorrecto: duplicar una norma universal en cada framework.

**Implementación propia del tema:** [Índice de CI/CD por stack](cicd/README.md).
