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

## Progresión De Despliegue: Observe → Audit → Enforce

Las políticas de Tetragon no deben desplegarse directamente en modo de bloqueo (`Sigkill`). La progresión segura es:

1. **Observe (Monitoreo Pasivo):** Las políticas se despliegan únicamente para registrar eventos sin intervenir. Se mide el volumen de alertas y se identifican falsos positivos.
2. **Audit (Alertas Sin Bloqueo):** Las políticas emiten alertas de severidad alta pero no terminan procesos. Se refinan excepciones para sidecars, operadores y health checks.
3. **Enforce (Bloqueo Activo):** Solo después de validar que los falsos positivos han sido eliminados, se activa la terminación `Sigkill` con un rollout gradual (primero en staging, luego en producción namespace por namespace).
4. **Break-Glass Auditado:** Existe un procedimiento documentado para desactivar temporalmente el enforcement durante incidentes de emergencia, registrando la excepción con ticket y TTL.

Antes de activar enforcement, se debe verificar:
- Compatibilidad del kernel con el hook eBPF utilizado (`execve` / `execveat`).
- Versiones compatibles de Cilium y Tetragon con el kernel del nodo.
- Que los health checks, liveness probes y readiness probes no ejecuten binarios interceptados.
- Que los operadores y sidecars de observabilidad no sean bloqueados.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Desplegar Tetragon en modo observe primero, refinar excepciones y progresar a enforce con rollout gradual tras validar cero falsos positivos.
- ❌ **Incorrecto:** Activar SIGKILL inmediatamente en producción sin fase de observación, sin matriz de compatibilidad de kernel ni procedimiento de break-glass documentado.
- ✅ **Correcto:** Exportar los eventos de seguridad estructurados de Tetragon hacia el pipeline corporativo de OpenTelemetry y SIEM.
- ❌ **Incorrecto:** Desplegar contenedores con capacidades Linux elevadas (`privileged: true`, `CAP_SYS_ADMIN`) en clústeres productivos.
