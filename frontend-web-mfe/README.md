# Documentación Arquitectónica Frontend Web MFE 2026

Estándar central para frontends Preact/React compatibles con `web-mfe`, contratos compartidos desde `bus-impl` y automatización versionada en `vigilio-platform-actions`.

## Fuentes de verdad

1. Código, tests, workflows e infraestructura del repositorio consumidor.
2. Contratos publicados por `bus-impl` en `@vigilioyonatan/bus-contracts`.
3. Policies, tooling, workflows y skills de `vigilio-platform-actions`.
4. OpenSpec, ADR y threat models vigentes.
5. Esta documentación como explicación arquitectónica.

Si una guía contradice el comportamiento ejecutable, verificar la causa y alinear ambas fuentes. No elevar una recomendación a “implementada” sin evidencia.

## Relación entre proyectos

```text
bus-impl
  -> @vigilioyonatan/bus-contracts
    -> ApiClient/services de web-mfe
      -> TanStack Query / React Hook Form
        -> features / componentes / TanStack Table

vigilio-platform-actions
  -> @vigilioyonatan/vigilio-skills (perfil web-mfe)
    -> .agents/skills      Codex
    -> .opencode/skills    OpenCode

vigilio-docs
  -> baseline arquitectónico enlazado por las skills
```

## Índice canónico

1. [Contratos, DTOs, Zod y TanStack](./1-contratos-dtos-zod-tanstack.md).
2. [Skills, agentes, OpenSpec y DevSecOps](./2-skills-agentes-openspec-devsecops.md).
3. [Arquitectura, estructura y ownership de estado](./3-arquitectura-estructura-estado.md).
4. [Flujo local, entornos y runtime config](./4-flujo-local-entornos-runtime-config.md).
5. [Integración BFF, HTTP, runtime y autenticación](./5-bff-http-runtime-auth.md).
6. [Golden path de feature, componentes y hooks](./6-golden-path-feature-componentes-hooks.md).
7. [Testing con Vitest, MSW y Playwright](./7-testing-vitest-msw-playwright.md).
8. [Calidad, SEO, accesibilidad y rendimiento](./8-calidad-seo-accesibilidad-rendimiento.md).
9. [Seguridad, hardening y privacidad](./9-seguridad-hardening-privacidad.md).
10. [Observabilidad, RUM, Grafana y SLO](./10-observabilidad-rum-grafana-slo.md).
11. [Tooling, pnpm, Biome y supply chain](./11-tooling-pnpm-biome-supply-chain.md).
12. [DevSecOps, CI/CD y gobierno GitHub](./12-devsecops-cicd-github.md).
13. [AWS, CloudFront, CDK y FinOps](./13-aws-cloudfront-cdk-finops.md).
14. [Gobierno, skills, OpenSpec y releases](./14-gobierno-skills-openspec-release.md).
15. [Evaluación, roadmap y operación](./15-evaluacion-roadmap-operacion.md).
16. [Design system, UI y tokens](./16-design-system-ui-tokens.md).
17. [Scaffold de aplicación y feature](./17-scaffold-app-feature.md).

## Owners

| Responsabilidad | Fuente canónica |
|---|---|
| Schemas y tipos HTTP | `bus-impl` |
| Contrato distribuible | `@vigilioyonatan/bus-contracts` |
| UI y evidencia ejecutable | `web-mfe` |
| Skills y tooling | `vigilio-platform-actions` |
| Práctica arquitectónica | `vigilio-docs/frontend-web-mfe` |

## Relación con `web-mfe/docs`

Esta carpeta define el baseline compartido. `web-mfe/docs` conserva únicamente:

- el índice hacia esta documentación central;
- el scorecard basado en evidencia real del consumidor;
- la política operativa local de gestión de vulnerabilidades.

Arquitectura, contratos, testing, componentes, hooks, SEO, accesibilidad, seguridad, observabilidad,
tooling, DevSecOps, AWS, skills y releases no se duplican dentro de `web-mfe`.

## Regla principal

No duplicar DTOs, schemas, instrucciones de agentes ni estado remoto. Cada responsabilidad tiene un owner y un mecanismo ejecutable de verificación.
