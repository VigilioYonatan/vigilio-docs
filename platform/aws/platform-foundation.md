# Fundación De Plataforma Cloud En AWS

Establece la arquitectura base de cuentas, redes, identidad federada y seguridad requerida para desplegar cargas de trabajo de Vigilio en Amazon Web Services (AWS).

## Topología De Cuentas Y Redes

Para minimizar el radio de impacto y garantizar aislamiento contable y de seguridad, se implementa una arquitectura multicuenta mediante AWS Organizations:

```text
AWS Organizations (Root)
├── Security OU (Log Archive, Security Tooling, GuardDuty)
├── Core OU (Network Hub, Transit Gateway, Shared Services)
└── Workloads OU
    ├── Development Account (VPC Dev, 3 AZs)
    ├── Staging Account (VPC Staging, 3 AZs)
    └── Production Account (VPC Prod, 3 AZs Multi-Region Ready)
```

### Diseño De Subredes Por AZ

Cada VPC se segmenta en tres zonas de disponibilidad (AZ) con tres niveles de subredes estrictamente segregados:
1. **Subredes Públicas:** Alojan exclusivamente Load Balancers (ALB / NLB) y NAT Gateways de salida controlada hacia internet.
2. **Subredes Privadas de Aplicación:** Alojan nodos de EKS, microservicios y workers sin IPs públicas asignadas.
3. **Subredes Aisladas de Datos:** Alojan clústeres Aurora PostgreSQL, instancias Valkey y endpoints privados (VPC Endpoints para S3, DynamoDB, ECR, Secrets Manager) sin acceso a Internet.

## Identidad Federada Y Cero Claves Estáticas

- **Federación OIDC para CI/CD:** Los pipelines de GitHub Actions y GitLab CI se autentican mediante tokens OIDC temporales vinculados a roles IAM con mínimos privilegios. Queda estrictamente prohibida la creación de usuarios IAM estáticos con access keys.
- **EKS Pod Identity / IRSA:** Los pods de Kubernetes obtienen permisos hacia servicios AWS (como S3, SQS o KMS) mediante ServiceAccounts anotadas con roles IAM específicos (`iam.gke.io` / `eks.amazonaws.com/role-arn`), eliminando credenciales dentro de los contenedores.
- **Cifrado KMS CMK Obligatorio:** Todos los datos en reposo (EBS, S3, Aurora, Secretos) deben cifrarse con claves KMS administradas por el cliente (Customer Managed Keys) con rotación automática anual activada.

## Prerrequisitos De Ejecución

1. Cuenta AWS aprovisionada dentro de la OU correspondiente mediante Control Tower o Terraform Account Factory.
2. Terraform CLI fijado según `versions.yaml` y backend remoto S3 con `use_lockfile = true`.
3. Proveedor OIDC configurado en AWS IAM para los repositorios de GitHub/GitLab autorizados.
4. Políticas de Control de Servicios (SCPs) aplicadas en la raíz para impedir el desmantelamiento de GuardDuty, CloudTrail y VPC Flow Logs.

## Matriz De Decisiones De Arquitectura AWS

| Criterio | Subredes Públicas | Subredes Privadas (App) | Subredes Aisladas (Data) |
|---|---|---|---|
| Asignación de IP Pública | Opcional (Load Balancer) | Prohibida | Prohibida |
| Ruteo a Internet por defecto | Internet Gateway (`igw`) | NAT Gateway (`nat-gw`) | Ninguno (Sin salida) |
| Acceso a APIs de AWS | Vía Internet pública | Vía NAT o VPC Endpoints | Exclusivo vía VPC Endpoints (PrivateLink) |
| Cargas de trabajo alojadas | ALB, NLB, Bastion WAF | EKS Managed Node Groups, Pods | Aurora PostgreSQL, Redis/Valkey, RDS |

## Procedimiento De Aprovisionamiento Y Endurecimiento

1. **Bootstrap de Red Base:**
   - Despliegue de VPC con CIDR no solapado (`/16` o `/20`) distribuido en exactamente 3 zonas de disponibilidad (`eu-central-1a`, `eu-central-1b`, `eu-central-1c` o región equivalente).
   - Creación de VPC Endpoints tipo Interface para `ecr.api`, `ecr.dkr`, `secretsmanager`, `kms`, `sts`, `logs` y Gateway Endpoints para `s3` y `dynamodb`.
2. **Habilitación de Telemetría y Auditoría:**
   - Activación obligatoria de VPC Flow Logs enviados a un grupo de CloudWatch Logs cifrado con KMS.
   - Verificación de que AWS CloudTrail multi-región está activo con validación de integridad de archivos de log habilitada.
3. **Despliegue de Cómputo EKS con IRSA:**
   - Creación del clúster EKS con endpoint de API privado habilitado (o público restringido por lista blanca de IPs corporativas).
   - Configuración de OIDC Provider URL para habilitar IAM Roles for Service Accounts (IRSA).
   - Instalación de AWS Load Balancer Controller con rol IAM de privilegio mínimo.

## Pruebas Negativas Y Detección De Fallos

- **Verificación de Inaccesibilidad Pública de Datos:** Prueba automatizada de resolución y conexión TCP a endpoints de Aurora/Redis desde fuera de la VPC; debe fallar con timeout de red.
- **Bloqueo de Tráfico sin VPC Endpoint:** En subredes de datos, un intento de conexión HTTP/HTTPS hacia endpoints públicos de AWS (ej. `s3.amazonaws.com`) debe fallar al carecer de ruta a NAT Gateway.
- **Detección de Violaciones IAM:** Alertas automáticas de CloudWatch / GuardDuty ante llamadas `CreateAccessKey` en cuentas de producción con respuesta automática de revocación.

## Procedimiento De Rollback Y Recuperación

1. **Fallo en Aprovisionamiento de Red:** Si una VPC o subred falla durante la aplicación de Terraform, ejecutar rollback mediante el estado anterior de Git; las VPCs nunca deben ser destruidas si contienen endpoints con dependencias activas.
2. **Rotación de Emergencia de Roles OIDC:** En caso de compromiso de un token de CI/CD, modificar la política de confianza del rol IAM para invalidar el claim `sub` del repositorio afectado y revocar sesiones activas inmediatamente vía AWS CLI.
3. **Reversión de Cambios de Seguridad:** Cualquier relajación de Security Groups o SCPs es detectada por AWS Config y revertida automáticamente mediante remediación SSM documentada en playbooks.

## Evidencia Requerida Para Gates

- Reporte de escaneo estático de Terraform con Checkov (`checkov -d .`) sin fallos en reglas críticas de AWS (CKV_AWS_*).
- Captura de estado de AWS CloudTrail y VPC Flow Logs en estado `ACTIVE`.
- Validación de que ningún recurso de base de datos posee la bandera `publicly_accessible = true`.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Enrutar el tráfico interno hacia servicios de AWS mediante VPC Endpoints (AWS PrivateLink) para no exponer datos a través de la Internet pública.
- ❌ **Incorrecto:** Desplegar bases de datos RDS con `publicly_accessible = true` o nodos de Kubernetes en subredes públicas.
- ✅ **Correcto:** Cifrar todos los volúmenes EBS, buckets S3 y tablas DynamoDB con claves KMS administradas por el cliente con rotación anual automática.
- ❌ **Incorrecto:** Usar la clave KMS por defecto sin políticas de control de acceso ni auditoría en CloudTrail.
