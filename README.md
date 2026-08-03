# vigilio-docs

Documentacion de arquitectura centralizada para proyectos Vigilio.

```text
backend-node-nest/     -> practicas y ejemplos para backends Node/Nest
frontend-web-mfe/      -> contratos, skills y practicas para frontend web MFE
frontend-mobile-mfe/   -> 17 capítulos de arquitectura, delivery y operación React Native/Expo
adr/                   -> templates de Architecture Decision Records
threat-model/          -> templates de threat modeling
```

Consulta también:

- [modelo operativo](./OPERATING-MODEL.md): responsabilidades y flujo docs → plataforma → consumidor;
- [compatibilidad](./COMPATIBILITY.md): SHAs, versiones y consumidores verificados;
- [`compatibility.json`](./compatibility.json): snapshot machine-readable validado en CI.

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

Publicado en GitHub Pages: https://vigilioyonatan.github.io/vigilio-docs

## Validación local

```bash
node scripts/validate-docs.mjs
node scripts/validate-workflows.mjs
node scripts/validate-compatibility.mjs
node scripts/build-site.mjs
```

La validación de compatibilidad usa por defecto los repositorios hermanos del workspace. En CI se
descargan commits exactos dentro de `.compat/`.
