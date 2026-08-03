# Reglas De Agente - vigilio-docs

## Fuentes De Verdad

1. Codigo, tests, workflows, policies e infraestructura ejecutable del consumidor.
2. Actions, CLIs, reusable workflows, policies y skills de `vigilio-platform-actions`.
3. ADRs, threat models y documentacion de este repositorio.

Si una afirmacion documental contradice una fuente ejecutable, corregir la documentacion y registrar
la brecha. Nunca marcar un control externo como activo solo porque existe YAML o una guia.

## Compatibilidad

- `compatibility.json` es la fuente machine-readable del snapshot cross-repo validado.
- `COMPATIBILITY.md` explica ese snapshot para humanos.
- Todo cambio de SHA, paquete, perfil de skills o consumidor actualiza ambos archivos y el workflow.
- Actions y repositorios externos se fijan a commit SHA completo; los tags son contexto, no identidad.
- No declarar skills o versiones futuras como instaladas hasta que existan en la fuente y consumidor.

## Edicion

- No editar `_site/`; es un artefacto generado por `scripts/build-site.mjs`.
- Evitar duplicar implementaciones de `vigilio-platform-actions` dentro de los documentos.
- Mantener ejemplos independientes de nombres de negocio concretos.
- Separar claramente: implementado en Git, configuracion externa requerida y evidencia pendiente.
- Todo documento publicado debe ser alcanzable desde `_sidebar.md`.

## Validacion

```bash
node scripts/validate-docs.mjs
node scripts/validate-workflows.mjs
node scripts/validate-compatibility.mjs
node scripts/build-site.mjs
```
