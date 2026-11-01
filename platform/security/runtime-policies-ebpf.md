# Seguridad En Tiempo De Ejecución Con Políticas eBPF Y Tetragon

Establece las directrices para la monitorización a nivel de kernel, detección de anomalías y bloqueo activo de intrusiones en Kubernetes mediante Cilium Tetragon.

## Visibilidad Y Bloqueo A Nivel De Kernel Linux

A diferencia de los agentes tradicionales de seguridad que interceptan llamadas en el espacio de usuario, Tetragon aprovecha eBPF (extended Berkeley Packet Filter) directamente en el kernel de Linux. Esto permite inspección profunda y aplicación de políticas con mínimo consumo de CPU.

```text
Espacio de Usuario:  [ Contenedor Vulnerado / Intruso ]
                               │ (Llamada al sistema: execve "/bin/sh")
───────────────────────────────┼────────────────────────────────────────
Kernel Linux (eBPF):   [ Sensor Tetragon eBPF ]
                               │ (Evalúa TracingPolicy)
                               ▼
                      ¿Shell interactivo en Prod?
                      ├── SÍ ──> Envía SIGKILL inmediato al proceso
                      └── Registra evento JSON en OTel / SIEM corporativo
```

## Políticas Canónicas De Tracing (`TracingPolicy`)

1. **Detección y Bloqueo de Shells Interactivas:**
   Queda prohibida la ejecución de intérpretes de comandos (`sh`, `bash`, `zsh`, `csh`) en pods de producción. Tetragon finaliza el proceso inmediatamente al detectar la llamada `execve`.
2. **Prevención de Ejecución en `/tmp`:**
   Los atacantes suelen descargar payloads binarios o scripts en `/tmp` o `/dev/shm`. Las políticas de Tetragon impiden la invocación de ejecutables desde directorios con permisos de escritura general.
3. **Monitoreo de Acceso a Archivos Sensibles:**
   Auditoría en tiempo real de accesos a `/etc/shadow`, `/var/run/secrets/kubernetes.io/serviceaccount/token` y certificados privados.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Aplicar políticas de Tetragon con acción `Sigkill` para neutralizar intentos de escalada de privilegios o shells no autorizadas en el kernel.
- ❌ **Incorrecto:** Confiar únicamente en logs de contenedores de espacio de usuario que pueden ser modificados o silenciados por un atacante con root en el pod.
- ✅ **Correcto:** Exportar los eventos de seguridad estructurados de Tetragon hacia el pipeline corporativo de OpenTelemetry y SIEM.
- ❌ **Incorrecto:** Desplegar contenedores con capacidades Linux elevadas (`privileged: true`, `CAP_SYS_ADMIN`) en clústeres productivos.
