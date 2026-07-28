# Dependabot y Repository Policy

Este proyecto usa controles versionados para evitar que la seguridad del repositorio dependa solo de memoria o configuracion manual.

## Dependabot

`.github/dependabot.yml` abre PRs semanales para:

- dependencias npm/pnpm.
- GitHub Actions.

Para paquetes privados `@vigilio-services/*` o `@vigilioyonatan/*`, crear el secret:

```text
DEPENDABOT_GITHUB_PACKAGES_TOKEN
```

Permiso minimo: `read:packages`.

## Repository Policy

CI ejecuta:

```bash
pnpm governance:repository # valida CODEOWNERS, PR template, Dependabot y PR body gate
```

Este control evita que alguien elimine archivos criticos de gobierno del repo sin romper CI.
