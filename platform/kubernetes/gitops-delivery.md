# Entrega Continua Con GitOps Y ArgoCD

Establece las especificaciones de arquitectura declarativa, sincronización automatizada y entrega progresiva para Kubernetes mediante GitOps.

## Arquitectura Del Repositorio GitOps

El repositorio de despliegues (`deploy-v2` / `practicing-3`) estructura los manifiestos separando los servicios de plataforma compartidos de las aplicaciones de negocio:

```text
gitops-root/
├── charts/                     # Charts internos de Helm versionados
├── platform/                   # Componentes base del clúster
│   ├── ingress/                # Ingress-NGINX / Cilium Ingress
│   ├── observability/          # OpenTelemetry, VictoriaMetrics, Grafana
│   ├── security/               # Kyverno, Tetragon, Cert-Manager
│   └── data/                   # Operadores de bases de datos (CloudNativePG)
├── environments/               # Overlays por ambiente
│   ├── prod-local/             # Kind / Laboratorio local
│   ├── staging/                # Pre-producción
│   └── production/             # Producción multi-clúster
└── gitops/
    └── apps/                   # ApplicationSets y App-of-Apps
```

## Políticas De Sincronización Y Autocuración

1. **Self-Healing (Autocuración) y Prune Activos:** ArgoCD detecta cualquier cambio manual introducido vía `kubectl` y lo revierte automáticamente al estado canónico de Git. Los recursos eliminados en Git son purgados del clúster de forma determinista.
2. **Sync Waves y Dependencias:** Se emplean anotaciones `argocd.argoproj.io/sync-wave` para ordenar el despliegue:
   - Wave -3: Namespaces y CRDs.
   - Wave -2: Secretos y ConfigMaps.
   - Wave -1: Operadores y StorageClasses.
   - Wave 0: Bases de datos y StatefulSets.
   - Wave 1: Deployments de aplicación y Services.
   - Wave 2: Ingress, NetworkPolicies y Canary Rollouts.

## Entrega Progresiva Con Argo Rollouts

Las aplicaciones críticas implementan despliegues tipo Canary mediante Argo Rollouts:
- Exposición gradual de tráfico (10% -> 25% -> 50% -> 100%).
- Verificación automática de métricas de Prometheus (tasa de error 5xx < 0.1%, latencia p99 < 200ms).
- Aborto inmediato y rollback automático en caso de degradación de SLO.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Controlar la totalidad del clúster mediante GitOps declarativo, convirtiendo el repositorio Git en la única fuente de verdad.
- ❌ **Incorrecto:** Modificar manualmente réplicas, variables de entorno o imágenes en vivo mediante comandos `kubectl edit` o `kubectl patch`.
- ✅ **Correcto:** Configurar Sync Waves para garantizar que los CRDs y secretos existan antes de inicializar los pods dependientes.
- ❌ **Incorrecto:** Desplegar todos los manifiestos en una sola ola provocando errores cíclicos de CrashLoopBackOff durante el bootstrap.
