# Resiliencia, Continuidad Y Recuperación Ante Desastres (DR)

Establece las directrices para la continuidad de negocio, backups de estado de clúster, conmutación multirregión e ingeniería del caos en Kubernetes.

## Objetivos De Recuperación (RPO / RTO)

| Nivel de Criticidad | RPO (Pérdida Máxima de Datos) | RTO (Tiempo de Recuperación) | Estrategia de Arquitectura |
|---|---|---|---|
| Nivel 1 (Core Financiero / Pagos) | < 1 minuto | < 15 minutos | Multi-Región Activo-Activo con replicación global Aurora. |
| Nivel 2 (Servicios de Aplicación) | < 15 minutos | < 1 hora | Activo-Pasivo (Pilot Light) en región secundaria con ArgoCD. |
| Nivel 3 (Herramientas Internas) | < 24 horas | < 4 horas | Restauración completa desde backups fríos de Velero. |

## Respaldos Y Restauración Integral Con Velero

El estado del clúster (CRDs, ConfigMaps, Secrets, Workloads) y los datos de volúmenes persistentes se respaldan de forma programada con Velero:

```bash
# Backup programado diario de producción
velero schedule create daily-prod-backup \
  --schedule="0 2 * * *" \
  --include-namespaces production \
  --snapshot-volumes \
  --ttl 720h0m0s
```

- **Snapshots de CSI:** Velero interactúa con el driver CSI de EBS o Longhorn para tomar instantáneas consistentes de los volúmenes de datos.
- **Simulacros Periódicos (GameDays):** Cada trimestre se debe ejecutar una prueba de restauración completa en un clúster limpio para verificar que el RTO cumpla con el SLA.

## Pruebas De Resiliencia E Ingeniería Del Caos

Para garantizar que el sistema tolere fallos inesperados en producción:
- Inyección periódica de latencia de red y caídas aleatorias de pods con Chaos Mesh en entornos de staging.
- Verificación de que las políticas de retry con backoff exponencial y circuit breakers en NestJS y los microfrontends eviten fallos en cascada.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Automatizar backups diarios de metadatos de clúster y snapshots de volúmenes con Velero hacia una cuenta AWS o almacenamiento externo aislado.
- ❌ **Incorrecto:** Confiar únicamente en la durabilidad del disco EBS sin respaldos periódicos de la configuración ni pruebas de restauración.
- ✅ **Correcto:** Validar trimestralmente la capacidad de conmutación y restauración mediante ejercicios controlados de simulación de desastres.
- ❌ **Incorrecto:** Asumir que un backup es válido sin haber ejecutado jamás un procedimiento de restore verificado.
