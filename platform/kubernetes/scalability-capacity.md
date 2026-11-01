# Escalabilidad, Capacidad Y Autoscaling En Kubernetes

Establece las directrices técnicas para el escalado elástico de pods y nodos, dimensionamiento de recursos y presupuestos de disrupción en Kubernetes.

## Estrategia De Autoscaling Por Capas

```text
┌────────────────────────────────────────────────────────┐
│                   Escalado de Tráfico                  │
│       HPA (CPU/Memoria)  +  KEDA (Eventos / Colas)     │
└──────────────────────────┬─────────────────────────────┘
                           │ (Genera Pods Adicionales)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Escalado de Nodos                    │
│      Karpenter (AWS) / Cluster Autoscaler (On-Prem)    │
└────────────────────────────────────────────────────────┘
```

1. **Escalado Basado en Eventos con KEDA:** Para servicios asíncronos y workers, el escalado no se basa únicamente en uso de CPU, sino en la profundidad real de la cola (mensajes pendientes en AWS SQS, streams de Valkey o tópicos de Kafka). Permite escalar a cero réplicas en inactividad.
2. **Aprovisionamiento Just-in-Time con Karpenter:** En AWS EKS, Karpenter evalúa las solicitudes de recursos de los pods pendientes y aprovisiona instancias EC2 óptimas en segundos, combinando instancias Spot y On-Demand con consolidación continua para reducir costes.
3. **Distribución Zonal (Topology Spread Constraints):**
   ```yaml
   topologySpreadConstraints:
     - maxSkew: 1
       topologyKey: topology.kubernetes.io/zone
       whenUnsatisfiable: DoNotSchedule
       labelSelector:
         matchLabels:
           app.kubernetes.io/name: bus-impl
   ```

## Dimensionamiento De Recursos Y Presupuestos De Disrupción

- **Requests vs Limits:** Toda aplicación debe definir `requests` de CPU y memoria basados en profiling real de carga. Para memoria, `limits` debe ser igual a `requests` para evitar OOMKill imprevistos en nodos sobresuscritos.
- **PodDisruptionBudget (PDB):** Se exige `minAvailable: 1` o `maxUnavailable: 25%` en todos los servicios de producción para garantizar que actualizaciones de nodos o drenados de mantenimiento no causen indisponibilidad de cara al cliente.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Configurar PodDisruptionBudgets y reglas de dispersión multizona para asegurar disponibilidad durante mantenimientos de clúster.
- ❌ **Incorrecto:** Desplegar servicios en producción sin requests de recursos definidos, provocando disputas descontroladas de CPU en los nodos.
- ✅ **Correcto:** Utilizar KEDA para escalar workers de acuerdo a la carga real de mensajes en colas SQS o Valkey.
- ❌ **Incorrecto:** Escalar procesadores de colas únicamente por uso de CPU cuando los workers pasan la mayor parte del tiempo en I/O bloqueante.
