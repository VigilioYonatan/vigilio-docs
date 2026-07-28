# vigilio-docs

Documentacion de arquitectura centralizada para proyectos Vigilio.

```text
backend-node-nest/     -> practicas y ejemplos para backends Node/Nest
frontend-web-mfe/      -> contratos, skills y practicas para frontend web MFE
adr/                   -> templates de Architecture Decision Records
threat-model/          -> templates de threat modeling
```

## Fuentes de verdad

- `vigilio-docs`: explica decisiones, practicas, operacion y ejemplos.
- `vigilio-platform-actions`: contiene policies, CLIs, actions, reusable workflows y skills
  ejecutables compartidos.
- cada proyecto consumidor, como `bus-impl`: contiene codigo, tests, configuracion, wrappers CI/CD
  y excepciones propias.

Cuando exista una contradiccion, manda primero el comportamiento ejecutable del proyecto y la
policy central; despues se corrige esta documentacion.

Los nombres de negocio usados en ejemplos, como `product`, `renovacion`, `emision` o `constancia`,
no representan modulos obligatorios ni garantizan que existan en un proyecto consumidor.

Publicado en GitHub Pages: https://vigiliyonatan.github.io/vigilio-docs/
