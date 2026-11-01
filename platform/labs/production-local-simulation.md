# Simulación Local De Producción Y Laboratorios

Define la arquitectura, perfiles de ejecución y procedimientos de validación en entornos locales reproducibles (`prod-local`) que emulan fielmente la infraestructura productiva.

## Propósito Del Laboratorio Local

El laboratorio local (`prod-local`) permite a cualquier ingeniero probar el ecosistema completo en su estación de trabajo antes de enviar código a revisión o abrir Pull Requests:

```text
Estación de Trabajo Local (Docker / Kind)
├── Cluster Kubernetes Local (Kind / k3d)
│   ├── Microservicios (bus-impl, web-mfe)
│   ├── Servicios de Datos (CloudNativePG / Valkey)
│   ├── Ingress Controller (NGINX / Cilium)
│   └── Observabilidad (OpenTelemetry Collector + VictoriaMetrics)
└── Perfil de Seguridad Avanzado (prod-local-privileged)
    └── Kernel eBPF + Tetragon Enforcement (en Linux o WSL2)
```

## Modos De Ejecución: Estándar Vs Privilegiado

1. **Modo Estándar (`prod-local`):**
   - No requiere privilegios de root ni acceso directo al kernel.
   - Ejecuta contenedores de aplicación, base de datos local y stack de observabilidad simulado.
   - Ideal para desarrollo ágil, depuración de lógica de negocio y pruebas unitarias/integradas.
2. **Modo Privilegiado (`prod-local-privileged`):**
   - Requiere acceso al kernel de Linux (en estaciones Linux o WSL2 con Docker Desktop configurado).
   - Habilita el subsistema eBPF y el despliegue del demonio Tetragon.
   - Permite verificar localmente el comportamiento ante intrusiones, inyección de fallos y bloqueo activo de llamadas de sistema antes del despliegue en clústeres reales.

## Aislamiento Y Reproducibilidad Total

- **Cero Dependencia de Internet para Tests:** Las imágenes necesarias se descargan en una fase de preflight o se compilan localmente. Los servicios externos (AWS S3, SQS) se simulan mediante MinIO o emuladores locales.
- **Limpieza Automatizada:** Scripts de inicialización (`setup.ps1` / `setup.sh`) y destrucción (`teardown.ps1` / `teardown.sh`) garantizan que no queden recursos huérfanos consumiendo memoria en la máquina del desarrollador.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Validar cambios críticos de arquitectura y seguridad en el entorno `prod-local` antes de abrir Pull Requests a ramas de integración.
- ❌ **Incorrecto:** Probar configuraciones complejas de clúster o políticas de seguridad directamente sobre entornos de staging o producción compartidos.
- ✅ **Correcto:** Automatizar la creación y destrucción de clústeres locales mediante scripts reproducibles e idempotentes.
- ❌ **Incorrecto:** Acumular estados residuales o datos obsoletos en el clúster local que falseen los resultados de las pruebas funcionales.
