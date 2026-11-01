# Entrega Continua Con GitOps Y ArgoCD

Establece las especificaciones de arquitectura declarativa, sincronización automatizada, prevención de derivas y entrega progresiva para Kubernetes mediante GitOps y ArgoCD.

## Arquitectura Del Repositorio GitOps

El repositorio de despliegues estructura los manifiestos separando los servicios de plataforma compartidos de las aplicaciones de negocio. La misma convención puede aplicarse bajo namespaces de organización como `vigilio-services/deploy`, `rimac-secures/deploy` o `win/deploy`:

```text
deploy/
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

1. **Self-Healing (Autocuración) y Prune Activos:**
   - La directiva `syncPolicy.automated.selfHeal: true` es obligatoria para detectar cualquier alteración manual en el clúster y revertirla automáticamente al estado canónico de Git.
   - La directiva `syncPolicy.automated.prune: true` garantiza que los recursos eliminados en Git sean purgados de forma determinista del clúster, evitando recursos huérfanos.
   - Está prohibido desactivar `selfHeal` o `prune` en ambientes gestionados por GitOps.

2. **Sync Waves y Orden de Inicialización:**
   Se emplean anotaciones `argocd.argoproj.io/sync-wave` para ordenar las fases del despliegue, previniendo condiciones de carrera:
   - **Wave 1:** Namespaces, Custom Resource Definitions (CRDs) y Secretos sellados (`SealedSecret`).
   - **Wave 2:** Almacenamiento, StatefulSets y Clústeres de base de datos (`CloudNativePG`, Valkey).
   - **Wave 3:** Deployments de aplicación, Services y Workers.
   - **Wave 4:** Ingress, políticas de red (`CiliumNetworkPolicy`) y `Rollout` progresivo.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payment-service-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/Vigilio-Services/platform-gitops.git'
    targetRevision: main
    path: environments/production/payment
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
```

## Entrega Progresiva Con Argo Rollouts

Las aplicaciones críticas implementan liberaciones tipo Canary mediante Argo Rollouts:
- **Exposición Gradual de Tráfico:** Progresión por pasos ponderados (e.g. 10% -> 25% -> 50% -> 100%) con ventanas de pausa configuradas para recopilar telemetría de producción.
- **Validación Métrica Automatizada:** Uso de `AnalysisTemplate` consultando métricas en Prometheus/OTel:
  - Tasa de errores HTTP 5xx < 0.1%.
  - Latencia p99 < 200ms.
- **Rollback Inmediato y Automatizado:** Si las métricas degradan el presupuesto de error o violan el SLO, el Rollout aborta de forma instantánea y restablece el 100% del tráfico a la versión estable previa.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service-rollout
  namespace: production
spec:
  replicas: 10
  strategy:
    canary:
      analysis:
        templates:
          - templateName: success-rate-analysis
        args:
          - name: service-name
            value: payment-service
      steps:
        - setWeight: 10
        - pause: { duration: 60s }
        - setWeight: 25
        - pause: { duration: 120s }
        - setWeight: 50
        - pause: { duration: 180s }
        - setWeight: 100
```

## Demostración Operativa y Estado Fail-Closed

Toda validación de entrega GitOps debe respaldarse con evidencia verificable en `reports/gitops-sync-evidence.json`:
- Conectividad activa y salud de la API del controlador ArgoCD (`argocdApiHealthy: true`).
- Accesibilidad confirmada del clúster Kubernetes de destino (`targetClusterReachable: true`).
- Ausencia de derivas declarativas entre el repositorio y el clúster (`driftDetected: false`).
- Ausencia de parches manuales fuera del flujo GitOps (`manualInterventionDetected: false`).
- **Fail-Closed:** Si la API de ArgoCD o el clúster de destino son inaccesibles, el pipeline emite estrictamente `NOT_RUN` y bloquea la certificación de despliegue.

## Matriz De Decisiones GitOps

| Dimensión | Opción Recomendada | Alternativa Restringida | Razón Técnica y Riesgo |
|---|---|---|---|
| **Fuente de Verdad** | Git como única fuente declarativa | `kubectl edit` / `kubectl apply` manual | Los parches en caliente se pierden ante reinicios de pods o sincronizaciones y provocan derivas silenciosas. |
| **Sincronización** | `selfHeal: true` y `prune: true` | Sincronización manual o sin prune | Desactivar self-heal permite que modificaciones no auditadas persistan en el clúster. |
| **Dependencias** | Sync Waves ordenadas (1-4) | Despliegue en ola única (Wave 0) | Omitir orden causa caídas en cascada si los pods intentan conectar a bases de datos o CRDs aún no instanciados. |
| **Canary Rollouts** | Progresión ponderada con `AnalysisTemplate` | Despliegue directo 100% sin métricas | Desplegar directamente al 100% expone a todos los usuarios a fallos no detectados en pruebas sintéticas. |

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Controlar la totalidad del clúster mediante GitOps declarativo, convirtiendo el repositorio Git en la única fuente de verdad con `selfHeal` y `prune` activos.
- ❌ **Incorrecto:** Modificar manualmente réplicas, variables de entorno o imágenes en vivo mediante comandos `kubectl edit` o scripts de hotfix fuera de Git.
- ✅ **Correcto:** Configurar Sync Waves ordenadas y validar la sincronización mediante telemetría antes de certificar la entrega.
- ❌ **Incorrecto:** Desplegar todos los recursos simultáneamente o asumir éxito sin comprobar la conectividad del controlador ArgoCD.

> Fuente única para **Cobertura de implementación y evidencia (ampliación)**: [abrir documento canónico](../../governance/complete-work-coverage-policy.md).
