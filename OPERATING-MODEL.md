# Modelo Operativo De La Plataforma

## Responsabilidades

| Repositorio | Responsabilidad | No debe contener |
|---|---|---|
| `vigilio-docs` | Arquitectura, decisiones, ejemplos, operación, ADRs y threat models | CLIs, actions o lógica CI duplicada |
| `vigilio-platform-actions` | Policies, packages, skills, composite actions y reusable workflows ejecutables | Reglas de negocio de un consumidor |
| `bus-impl`, `web-mfe` y otros consumidores | Código, tests, configuración, wrappers CI/CD y excepciones propias | Copias modificadas del tooling central |

## Flujo De Reutilización

```text
vigilio-docs
  -> define el estándar y enlaza evidencia esperada

vigilio-platform-actions
  -> implementa policies, CLIs, skills, Jira y workflows reutilizables

proyecto consumidor
  -> fija versiones/SHA, configura secrets y ejecuta los gates
```

Las skills enlazan documentos concretos, pero antes de actuar deben leer código, tests y
configuración ejecutable del consumidor. La documentación nunca reemplaza la verificación runtime.

## Jira

La integración se implementa una sola vez en
`vigilio-platform-actions/actions/jira-devops`. Los consumidores solo declaran el modo y contexto:

- `transition`: mover tickets por PR o stage;
- `deployment`: registrar despliegues;
- `release`: crear/asignar Fix Versions;
- `incident`: crear incidentes de despliegue;
- `smart-commit` y `feature-flag`: trazabilidad adicional cuando aplica.

Estado correcto de una integración Jira:

| Capa | Evidencia |
|---|---|
| Código disponible | action fijada por SHA y validada en `vigilio-platform-actions` |
| Consumidor conectado | workflow invoca la action con inputs explícitos |
| Configuración externa lista | URL, usuario bot, token, permisos, proyecto y transiciones existen |
| Operación demostrada | ejecución real deja transición, comentario, deployment o release en Jira |

Si falta la última evidencia, documentar “implementado en código; configuración/evidencia externa
pendiente”. No afirmar que Jira está operativo solo por la presencia del workflow.

Los checkouts cross-repo usan `github.token` cuando los repositorios son públicos. Si alguno es
privado, configurar `PLATFORM_READ_TOKEN` con acceso de solo lectura; nunca usar un PAT con permisos
de escritura para validar documentación.

## Cambio Coordinado

1. Cambiar primero la fuente ejecutable o ADR correspondiente.
2. Validar y publicar `vigilio-platform-actions` cuando cambie tooling compartido.
3. Actualizar `compatibility.json` y `COMPATIBILITY.md`.
4. Actualizar consumidores con versión exacta o SHA completo.
5. Ejecutar `skills:check`, governance, tests y smoke según el riesgo.
6. Conservar evidencia de Jira, release y despliegue cuando sean controles requeridos.
