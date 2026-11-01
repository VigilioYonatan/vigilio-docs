# Kubernetes: despliegue, seguridad y probes multistack

Instancia de aplicación en EKS/AKS usa deployment, service, ingress/gateway, ConfigMaps no secretos y SecretStore externo, limits, PDB, IAM y network policies; servicios stateless con HPA y workers independientes.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vigilio-api
spec:
  replicas: 2
  selector:
    matchLabels: { app: vigilio-api }
  template:
    metadata:
      labels: { app: vigilio-api }
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile: { type: RuntimeDefault }
      containers:
        - name: api
          image: registry.example.invalid/vigilio-api@sha256:REPLACE_WITH_VERIFIED_DIGEST
          ports: [{ containerPort: 8080 }]
          readinessProbe:
            httpGet: { path: /ready, port: 8080 }
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
          resources:
            requests: { cpu: 100m, memory: 256Mi }
            limits: { cpu: '1', memory: 512Mi }
          securityContext:
            allowPrivilegeEscalation: false
            capabilities: { drop: [ALL] }
```

Manifest de referencia: la imagen es **placeholder no publicable** y probes deben existir en la aplicación; para PHP-FPM usar frontend HTTP (Nginx/FrankenPHP si aprobado), no asumir que FPM atiende HTTP en 8080. Desplegar con Helm/GitOps y verificaciones OPA/Kyverno, secretos, PVC cuando correspondan; las opciones cambian según runtime. [Guía EKS histórica](../../platform-runtime/2-eks-gitops-operations.md).

## ✅ Correcto / ❌ Incorrecto: revisión 2026

- ✅ **Correcto:** AuthN + AuthZ de recurso/tenant; allowlist de salida, secretos fuera de logs y pruebas de acceso cruzado.
- ❌ **Incorrecto:** Permitir rutas públicas por comodidad, confiar sólo en `auth` o construir salida con `$request->all()`.
- **Al recibir código existente:** primero caracterizar el comportamiento, después refactorizar en pasos comprobables. [Guía canónica de modernización](../../standards/engineering/refactoring-existing-code.md).

## Plantilla base de contenedor seguro

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 2
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      automountServiceAccountToken: false
      containers:
        - name: api
          image: registry.example.invalid/api@sha256:REEMPLAZAR_DIGEST
          ports: [{ containerPort: 3000 }]
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits: { memory: 512Mi }
          securityContext:
            runAsNonRoot: true
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: [ALL] }
          readinessProbe:
            httpGet: { path: /health/ready, port: 3000 }
            periodSeconds: 5
```

**No desplegar literalmente**: seleccionar `ServiceAccount` y Pod Identity cuando sea necesario, imagen digest real, requests adecuados, endpoints health y volúmenes temporales si el runtime los precisa. Diseñar NetworkPolicy, PodDisruptionBudget, HPA/KEDA, secrets CSI y políticas Pod Security por namespace.

✅ Probes distintas para readiness/liveness, rollout con métricas y rollback por digest; ❌ root, `privileged`, token montado sin uso, credenciales en ConfigMap o tag mutable.

**Gates:** manifest `kubeconform`, policy-as-code, image scan/SBOM, pruebas readiness, HPA, shutdown y rollback controlado.
