# Arquitecturas de runtime: AWS, Azure y separación de perfiles

Un framework puede tener más de un destino. Elegirlo según carga, eventos, latencia y coste; no incrustar Lambda o EKS como propiedad del perfil `node-nest` o `php-laravel`.

| Capacidad | AWS EKS | AWS Lambda | Azure AKS |
|---|---|---|---|
| Runtime | Containers + workers | Funciones por evento | Containers + workers |
| Configuración | Helm/GitOps/Terraform | SAM/CDK/Terraform según decisión | Helm/GitOps/Terraform |
| Observabilidad | OTel + CloudWatch/Grafana | OTel/X-Ray cuando sea aplicable | OTel + Azure Monitor/Grafana |
| Secrets | Secrets Manager/External Secrets | Secrets Manager/SSM | Key Vault/External Secrets |

Policies comunes: least privilege, network restrictions, image scanning, TLS, cifrado, finops, DR, quotas y SLO. Los perfiles de skills de plataforma se añaden **opcionalmente** tras conocer el destino. No mezclar backend NestJS-Lambda con backend NestJS-EKS sin ADR explícito.

> Fuente única para **Correcto / Incorrecto: revisión 2026**: [abrir documento canónico](../../governance/documentation-dry-and-ownership.md).


## Matriz de decisión por carga

| Alternativa | Elegir cuando | Evitar cuando |
|---|---|---|
| AWS EKS / Kubernetes | Operación multi-servicio, políticas de plataforma, observabilidad y GitOps maduros | La complejidad operativa excede el beneficio |
| AWS Lambda | Requests/eventos breves, scale-to-zero, poco estado, tolerancia a cold starts | Procesos persistentes o larga duración sin adaptación |
| Fargate/ECS | Contenedores con menor carga operativa que EKS | Necesitas capacidades y contratos específicos Kubernetes |
| Azure Container Apps/AKS | Plataforma Azure y requisitos existentes | Sólo por preferencia, sin análisis de costo/skills |

✅ Elegir runtime por restricciones de SLO, costo, arranque, red y observabilidad. ❌ Incluir Lambda/CDK y EKS/Terraform en la misma política incondicional de una skill de backend.

## Matriz de selección de runtime

| Opción | Preferir cuando | Riesgos que hay que probar |
| --- | --- | --- |
| AWS Lambda + API Gateway | tráfico variable, ejecución corta | cold starts, VPC, conexión DB, tiempo máximo, coste por invocación |
| EKS + Helm/GitOps | servicios sostenidos, escalado/protocolos complejos | coste de cluster, seguridad RBAC, requests/limits, probes |
| ECS/Fargate | contenedor sin administrar Kubernetes | límites de networking/operación e integración IAM |
| Azure Container Apps/AKS | stack Azure y operación compatible | identidad workload, egress, autoscaling, telemetría |

**Regla:** ninguna skill de desarrollo NestJS o Laravel debe imponer Lambda o EKS por el lenguaje. El perfil de deployment se elige por runtime concreto, aprobado por ADR y SLO.

✅ Dimensionar basado en métricas, coste y requisitos de tenancy; ❌ imponer `node-nest-security-aws` (Lambda) a un proyecto NestJS EKS sin diferenciar perfil.

**Pruebas:** carga, apagado controlado, rollback, secretos, telemetría y coste aproximado con configuración real antes del release.

## Cobertura de implementación y evidencia (ampliación)

Estas comprobaciones concretan el tema de esta guía; aplicar solo las pertinentes al sistema consumidor y documentar exclusiones justificadas.

1. **Criterios verificables:** Relacionar cada afirmación con implementación, excepción o evidencia reproducible.
2. **Casos límite:** Documentar al menos un error o condición de borde relevante al objetivo.
3. **Preservación:** Conservar reglas previas y añadir notas de compatibilidad solo cuando tengan valor.

✅ **Correcto:** conservar el flujo funcional y demostrar criterios de aceptación con tests, trazas, revisión de contratos o un plan reproducible según el riesgo.

❌ **Incorrecto:** sustituir las reglas de negocio por un resumen, copiar implementaciones de otro framework, declarar cobertura sin evidencia o presentar `NOT_RUN` como `PASS`.

**Salida mínima:** responsable del control, riesgo cubierto, evidencia verificable y estado `PASS | FAIL | NOT_RUN | BLOCKED`. Los comandos de ejemplo son ilustrativos salvo que se adjunte ejecución real.
