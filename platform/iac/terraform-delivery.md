# Entrega De Infraestructura Como Código Con Terraform

Establece las pautas de arquitectura, estratificación y flujo de despliegue para la infraestructura como código (IaC) administrada con Terraform en Vigilio de forma neutral frente a proveedores de nube.

## Principios De Estratificación De Infraestructura (`infra-v2`)

La infraestructura se organiza en capas estrictamente delimitadas para evitar acoplamiento y limitar el radio de impacto de fallos, independientemente de la nube o centro de datos de destino:

```text
infra-v2/
├── bootstrap/       # Aprovisionamiento del backend remoto y bloqueo de estado
├── config/          # Esquemas y configuraciones validadas
├── modules/         # Módulos reutilizables agnósticos de entorno y proveedor
├── stacks/          # Composición lógica de módulos (Network, Compute, Data, Security)
├── environments/    # Declaraciones de estado por entorno (dev, staging, prod)
├── migration/       # Procedimientos de importación, migración y rollback
├── policies/        # Reglas OPA / Conftest / Checkov de cumplimiento de seguridad
└── tests/           # Pruebas automatizadas de sintaxis, lint y contratos de infraestructura
```

## Gestión Del Backend Remoto Y Selección De Motor

El backend remoto debe garantizar persistencia duradera, cifrado en reposo y bloqueo concurrente de estado:

> [!NOTE]
> La implementación del backend remoto depende del entorno de destino:
> - **AWS:** Bucket S3 con KMS y tabla DynamoDB para bloqueo (`LockID`).
> - **Azure:** Azure Blob Storage con lease blob para bloqueo.
> - **GCP:** Google Cloud Storage con bloqueo de objetos.
> - **On-Premise / Datacenter Privado:** PostgreSQL con advisory locks, HashiCorp Consul o MinIO/S3 compatible.

## Flujo De Entrega: Plan En PR, Apply En Merge

1. **Pull Request (Validación y Plan):**
   - Ejecución de `terraform fmt -check`.
   - Validación estática con `tflint` y escaneo de seguridad con `checkov` o `trivy`.
   - Generación del plan especulativo (`terraform plan -out=tfplan`) emitido como comentario en el PR.
   - Prohibido aplicar cambios en ramas de feature.
2. **Merge a Main (Aplicación Automática):**
   - El runner de CI asume identidad federada (OIDC con el proveedor correspondiente) sin credenciales estáticas de larga duración.
   - Aplicación estricta del plan previamente generado (`terraform apply tfplan`).
   - Registro de auditoría y emisión de métricas de despliegue.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Mantener los módulos reutilizables puros sin bloques `provider` ni bloques `backend` hardcodeados en su interior.
- ❌ **Incorrecto:** Declarar credenciales estáticas de proveedores cloud (`AWS_ACCESS_KEY_ID`, `ARM_CLIENT_SECRET`, etc.) en variables de CI/CD o en archivos de configuración.
- ✅ **Correcto:** Bloquear el estado remoto concurrentemente mediante el mecanismo compatible con la nube destino (DynamoDB, Azure Lease, Consul).
- ❌ **Incorrecto:** Ejecutar `terraform apply` directamente desde la consola local de un desarrollador sobre entornos de staging o producción.
