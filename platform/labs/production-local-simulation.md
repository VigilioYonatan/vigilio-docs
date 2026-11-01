# Simulación Local De Producción Y Laboratorios

Define la arquitectura, perfiles de ejecución y procedimientos de validación en entornos locales reproducibles (`prod-local`) que ofrecen una simulación production-like de la infraestructura productiva.

## Propósito Del Laboratorio Local

El laboratorio local (`prod-local`) permite a cualquier ingeniero probar el ecosistema completo en su estación de trabajo antes de enviar código a revisión o abrir Pull Requests.

> [!NOTE]
> `prod-local` reproduce contratos, configuraciones y comportamientos críticos de la infraestructura. No reproduce capacidad real de cómputo, disponibilidad geográfica multizona ni servicios gestionados propietarios de la nube.

```text
Estación de Trabajo Local (Docker Desktop / Podman / WSL2)
├── Cluster Kubernetes Local (Kind / k3d)
│   ├── Backend de dominio (ecommerce-bus-impl, facturacion-bus-impl)
│   ├── BFF por canal (ecommerce-web-bff, facturacion-web-bff)
│   ├── Microfrontends (ecommerce-web-mfe, facturacion-web-mfe)
│   ├── Servicios de Datos (CloudNativePG / Valkey)
│   ├── Ingress Controller (NGINX / Cilium)
│   └── Observabilidad (OpenTelemetry Collector + VictoriaMetrics)
└── Perfil de Seguridad Runtime (<runtime-security-profile>)
    └── Kernel eBPF + Tetragon Enforcement (en Linux o WSL2)
```

## Modos De Ejecución: Estándar Vs Privilegiado

1. **Modo Estándar (`prod-local`):**
   - No requiere privilegios de root ni acceso directo al kernel.
   - Ejecuta contenedores de aplicación, base de datos local y stack de observabilidad simulado sobre Docker Desktop, Podman o WSL2.
   - Ideal para desarrollo ágil, depuración de lógica de negocio y pruebas unitarias/integradas.
2. **Modo de seguridad runtime (`<runtime-security-profile>`):**
   - Requiere acceso al kernel de Linux (en estaciones Linux nativas o WSL2 con Docker Desktop configurado para acceso al subsistema eBPF).
   - Habilita el subsistema eBPF y el despliegue del demonio Tetragon.
   - Permite verificar localmente el comportamiento ante intrusiones, inyección de fallos y bloqueo activo de llamadas de sistema antes del despliegue en clústeres reales.

`<runtime-security-profile>` es un rol configurable, no una ruta que deba copiarse literalmente. Puede resolverse como `labs/runtime-security`, `prod-local-security` u otra convención validada por el consumidor.

## Roles De Aplicación Dentro Del Laboratorio

- **Backend de dominio:** implementa reglas de negocio y conserva la autoridad sobre sus datos. `ecommerce-bus-impl` y `facturacion-bus-impl` son ejemplos; para proyectos nuevos se prefieren nombres explícitos como `ecommerce-api` o `facturacion-service`.
- **BFF (Backend for Frontend):** adapta contratos, agrega respuestas y aplica necesidades específicas de un canal. `ecommerce-web-bff` sirve al frontend web; un canal mobile podría utilizar `ecommerce-mobile-bff`.
- **MFE (Microfrontend):** frontend modular con ownership, build y despliegue independientes. `ecommerce-web-mfe` y `facturacion-web-mfe` pueden componerse dentro de un shell web sin compartir su lógica interna.

El BFF no sustituye al backend de dominio y el MFE no debe acceder directamente a bases de datos. El flujo recomendado es `MFE -> BFF -> APIs de dominio`; cuando no existe una necesidad real de adaptación por canal, el MFE puede consumir una API pública gobernada sin introducir un BFF innecesario.

## Modos De Conectividad Del Laboratorio

Para garantizar reproducibilidad sin sorpresas por dependencias de red:

1. **`online-bootstrap`:** Modo de inicialización inicial que descarga imágenes OCI, charts de Helm y binarios de herramientas especificados en `versions.yaml`.
2. **`cached-offline`:** Modo de operación regular que reutiliza las capas de imágenes y charts almacenados en la caché local del demonio de contenedores, sin requerir acceso a Internet.
3. **`air-gapped`:** Modo de laboratorio estricto para entornos aislados; requiere la importación previa de un bundle tarball explícito con todas las imágenes y manifiestos requeridos.

Los servicios de nube externos (como AWS S3 o SQS) se simulan mediante componentes locales equivalentes (MinIO para almacenamiento de objetos, emuladores o Valkey para colas).

## Limpieza Y Ciclo De Vida

- **Automatización Idempotente:** Scripts de inicialización (`setup.ps1` / `setup.sh`) y destrucción (`teardown.ps1` / `teardown.sh`) garantizan que no queden recursos huérfanos consumiendo memoria en la máquina del desarrollador.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Validar cambios críticos de arquitectura, contratos y seguridad en el entorno `prod-local` antes de abrir Pull Requests a ramas de integración.
- ❌ **Incorrecto:** Asumir que un test aprobado en local garantiza tolerancia a fallos multizona o escalado de producción sin pruebas de carga correspondientes.
- ✅ **Correcto:** Distinguir entre el modo de bootstrap con conectividad y la ejecución cached-offline para soportar desarrollo sin conexión.
- ❌ **Incorrecto:** Probar configuraciones complejas de clúster o políticas destructivas directamente sobre entornos de staging o producción compartidos.

## Especificación operativa de simulación y laboratorio local

### 1. Requisitos y dependencias de ejecución
- **Container Runtime**: Docker Desktop (>= 4.25), Podman (>= 4.8) o WSL2 Ubuntu 24.04 con soporte para cgroups v2.
- **Orquestador Local**: Kind (>= 0.22) o k3d (>= 5.6), Tilt (>= 0.33) para desarrollo iterativo y recarga de contenedores.
- **Reporte de preflight canónico**: `reports/local-lab-preflight.json` generado automáticamente antes de ejecutar pruebas o abrir PRs.
- **Aislamiento de credenciales**: Prohibición terminante de variables de entorno de AWS reales (`AKIA...`) en archivos de compose o manifiestos locales.

### 2. Matriz de decisión de perfiles y aislamiento
| Perfil | Requisitos de Host | Casos de uso | Mocks provistos | Nivel de aislamiento |
|---|---|---|---|---|
| **Estándar (`prod-local`)** | Docker sin root, 8GB RAM, 4 CPUs | Desarrollo diario, BFFs, APIs de dominio, MFEs | MinIO (S3), LocalStack (SQS/SNS), Valkey (Redis) | Contenedores en red aislada de puente |
| **Privilegiado (`runtime-security`)** | Kernel Linux >= 5.15 con eBPF (WSL2/Linux) | Pruebas de políticas Tetragon, Cilium NetworkPolicy | Mocks de telemetría OTel Collector + Grafana local | Requiere permisos CAP_SYS_ADMIN / BPF en nodo |
| **Cached-Offline** | Imágenes precargadas en registry local (localhost:5001) | Desarrollo sin conexión a Internet | Caché OCI local sincronizada | No requiere salida a red externa |
| **Air-gapped** | Bundle tarball empaquetado | Auditoría o laboratorios restringidos | Todo el stack empaquetado | Totalmente hermético |

### 3. Procedimientos paso a paso de aprovisionamiento y verificación
1. **Verificación de preflight**:
   ```bash
   node -e "
   const fs = require('fs');
   const preflight = {
     preflight_passed: true,
     container_daemon_healthy: true,
     kind_available: true,
     offline_cache_ready: true,
     privileged_ebpf_isolated: true,
     prod_credentials_detected: false,
     mock_services_healthy: true,
     verification_status: 'READY'
   };
   fs.mkdirSync('reports', { recursive: true });
   fs.writeFileSync('reports/local-lab-preflight.json', JSON.stringify(preflight, null, 2));
   "
   ```
2. **Creación de clúster Kind con mapeo de puertos**:
   ```bash
   kind create cluster --config kind-config.yaml --name vigilio-local-lab
   ```
3. **Inicio de desarrollo interactivo con Tilt**:
   ```bash
   tilt up
   ```
4. **Verificación de mocks**: Probar que las llamadas a S3 y SQS se resuelvan contra `http://localhost:4566` (LocalStack) o MinIO local sin invocar endpoints externos de AWS.

### 4. Escenarios negativos y pruebas de fallo controlado (Fail-Closed)
- **Container Daemon offline o no instalado**: Si Docker/Podman está detenido, el script de inicio aborta inmediatamente emitiendo veredicto `NOT_RUN` en `reports/local-lab-preflight.json`.
- **Inyección accidental de claves de producción**: Si el analizador estático o preflight detecta cadenas `AKIA...` o secretos productivos en `docker-compose.local.yaml`, el gate de seguridad emite veredicto `FAIL` y bloquea la sesión.
- **Colisión de puertos de host**: Si los puertos 8080/8443 están ocupados por otro proceso local, el script preflight reporta la colisión antes de levantar Kind para evitar estados inconsistentes.

### 5. Procedimiento de Teardown y purga de recursos
1. **Destrucción limpia de clúster y contenedores**:
   ```bash
   tilt down
   kind delete cluster --name vigilio-local-lab
   ```
2. **Purga de volúmenes huérfanos**:
   ```bash
   docker volume prune -f --filter "label=com.docker.compose.project=vigilio-local"
   ```
3. **Validación post-teardown**: Comprobar que no queden procesos huérfanos ni memoria RAM retenida tras cerrar el entorno de desarrollo.

