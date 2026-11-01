# Entrega De Infraestructura Como Código Con Terraform

Establece las pautas de arquitectura, estratificación y flujo de despliegue para la infraestructura como código (IaC) administrada con Terraform en Vigilio.

## Estructura Estratificada De Infraestructura (`infra-v2`)

La infraestructura se organiza en capas estrictamente delimitadas para evitar acoplamiento y limitar el radio de impacto de fallos:

```text
infra-v2/
├── bootstrap/       # Aprovisionamiento del backend remoto (S3, DynamoDB, KMS)
├── config/          # Esquemas y configuraciones validadas
├── modules/         # Módulos reutilizables agnósticos de entorno (VPC, EKS, RDS, S3)
├── stacks/          # Composición lógica de módulos (Network, Compute, Data, Security)
├── environments/    # Declaraciones de estado por entorno (dev, staging, prod)
├── migration/       # Procedimientos de importación, migración y rollback
├── policies/        # Reglas OPA / Conftest / Checkov de cumplimiento de seguridad
└── tests/           # Pruebas automatizadas de sintaxis, lint y contratos de infraestructura
```

## Flujo De Entrega: Plan En PR, Apply En Merge

1. **Pull Request (Validación y Plan):**
   - Ejecución de `terraform fmt -check`.
   - Validación estática con `tflint` y escaneo de seguridad con `checkov` o `trivy`.
   - Generación del plan especulativo (`terraform plan -out=tfplan`) emitido como comentario en el PR.
   - Prohibido aplicar cambios en ramas de feature.
2. **Merge a Main (Aplicación Automática):**
   - El runner de CI asume un rol IAM mediante OIDC (sin credenciales estáticas de larga duración).
   - Aplicación estricta del plan previamente generado (`terraform apply tfplan`).
   - Registro de auditoría y emisión de métricas de despliegue.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Mantener los módulos reutilizables puros sin bloques `provider` ni bloques `backend` hardcodeados en su interior.
- ❌ **Incorrecto:** Declarar credenciales `AWS_ACCESS_KEY_ID` o `AWS_SECRET_ACCESS_KEY` fijas en variables de CI/CD o en archivos de configuración.
- ✅ **Correcto:** Bloquear el estado remoto con DynamoDB para prevenir ejecuciones concurrentes de Terraform sobre el mismo entorno.
- ❌ **Incorrecto:** Ejecutar `terraform apply` directamente desde la consola local de un desarrollador sobre entornos de staging o producción.
