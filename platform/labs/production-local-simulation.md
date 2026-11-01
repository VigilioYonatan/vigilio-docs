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
