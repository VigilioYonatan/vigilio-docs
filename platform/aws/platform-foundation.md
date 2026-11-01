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

Cada VPC se segmenta en tres zonas de disponibilidad (AZ) con tres niveles de subredes:
1. **Subredes Públicas:** Alojan exclusivamente Load Balancers (ALB / NLB) y NAT Gateways de salida controlada.
2. **Subredes Privadas de Aplicación:** Alojan nodos de EKS, microservicios y workers sin IPs públicas asignadas.
3. **Subredes Aisladas de Datos:** Alojan clústeres Aurora PostgreSQL, instancias Valkey y endpoints privados (VPC Endpoints para S3, DynamoDB, ECR, Secrets Manager) sin acceso a Internet.

## Identidad Federada Y Cero Claves Estáticas

- **Federación OIDC para CI/CD:** Los pipelines de GitHub Actions y GitLab CI se autentican mediante tokens OIDC temporales vinculados a roles IAM con mínimos privilegios. Queda estrictamente prohibida la creación de usuarios IAM estáticos con access keys.
- **EKS Pod Identity / IRSA:** Los pods de Kubernetes obtienen permisos hacia servicios AWS (como S3, SQS o KMS) mediante ServiceAccounts anotadas con roles IAM específicos, eliminando credenciales dentro de los contenedores.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Enrutar el tráfico interno hacia servicios de AWS mediante VPC Endpoints (AWS PrivateLink) para no exponer datos a través de la Internet pública.
- ❌ **Incorrecto:** Desplegar bases de datos RDS con `publicly_accessible = true` o nodos de Kubernetes en subredes públicas.
- ✅ **Correcto:** Cifrar todos los volúmenes EBS, buckets S3 y tablas DynamoDB con claves KMS administradas por el cliente con rotación anual automática.
- ❌ **Incorrecto:** Usar la clave KMS por defecto sin políticas de control de acceso ni auditoría en CloudTrail.
