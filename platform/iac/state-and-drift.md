# Gestión De Estado Y Detección De Deriva (Drift)

Define las políticas de protección del estado remoto de Terraform y los mecanismos de detección y reconciliación de deriva de infraestructura.

## Arquitectura Del Backend De Estado Remoto

El estado remoto almacena la representación física de los recursos en la nube. Debe ser protegido con los más altos estándares de seguridad:

1. **Almacenamiento Cifrado en S3:** Con cifrado mediante clave administrada por el cliente (`aws_kms_key`), versionado de objetos activado y bloqueo de eliminación no autorizada.
2. **Bloqueo Concurrente con DynamoDB:** Tabla de bloqueo con clave primaria `LockID` que impide que dos procesos de CI o ingenieros apliquen cambios simultáneamente.
3. **Partición por Entorno y Stack:** Un archivo de estado por cada componente y entorno (`environments/prod/compute.tfstate`, `environments/prod/network.tfstate`), evitando monolitos frágiles donde un error corrompe toda la cuenta.

```text
S3 Bucket (Versioned + KMS SSE)
├── env:/dev/network.tfstate
├── env:/staging/network.tfstate
└── env:/prod/
    ├── network.tfstate
    ├── compute.tfstate
    └── data.tfstate
```

## Detección Automática De Deriva (Drift Detection)

Para prevenir desalineaciones provocadas por modificaciones manuales en la consola de AWS o Azure:

- Se ejecuta un pipeline programado (cron nocturno o cada 4 horas) con `terraform plan -detailed-exitcode`.
- Si el código de salida es `2` (cambios detectados sin modificación de código fuente), se emite una alerta de severidad alta a SRE y Security.
- **Protocolo de Remediación:**
  1. Si la modificación fue un hotfix de emergencia aprobado, se actualiza el código HCL en Git y se genera un commit de alineación con ADR asociado.
  2. Si la modificación no fue autorizada, se ejecuta `terraform apply` automático o supervisado para revertir los recursos a la declaración canónica en Git.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Mantener archivos de estado pequeños y divididos por dominios de falla (red, cómputo, datos, seguridad).
- ❌ **Incorrecto:** Agrupar todos los recursos de una empresa en un único `terraform.tfstate` monolítico de miles de líneas.
- ✅ **Correcto:** Monitorear diariamente la deriva de infraestructura y fallar auditorías de seguridad ante discrepancias no justificadas.
- ❌ **Incorrecto:** Ignorar cambios manuales en la consola web de AWS hasta que fallen futuros despliegues automatizados.
