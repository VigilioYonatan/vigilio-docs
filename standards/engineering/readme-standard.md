# Estándar de Documentación de Repositorios (README.md) — Nivel Senior/Staff

**Estado:** estándar canónico transversal de ingeniería. **Owner:** `standards/engineering/`.

El `README.md` no es una formalidad burocrática ni un adorno opcional que se escribe al final del proyecto. **Es el mapa de arquitectura y la guía de supervivencia del repositorio**. Un buen `README` garantiza que cualquier nuevo desarrollador, evaluador o agente de IA pueda clonar el repositorio, configurar el entorno y estar corriendo el proyecto en **menos de 10 minutos**.

---

## 1. Principios de Senior Mode para READMEs

1. **Objetivo < 10 Minutos (Fast Onboarding)**: El apartado *Quick Start* debe ser ejecutable paso a paso, sin asumir herramientas ocultas ni pasos no documentados.
2. **Cero Secretos Hardcodeados**: Ninguna clave de API, contraseña o cadena de conexión vive en el README ni en el repositorio. Todo se documenta a través de tablas de variables de entorno y archivos `.env.example`.
3. **Claridad en la Propiedad de Contratos (ADR 0001)**:
   - **Backend TypeScript/NestJS**: Documentar que los contratos se definen en `src/` y se generan mediante `vigilio-node generate-contracts`.
   - **Backend No-TS / API Externa**: Indicar expresamente que los DTOs e interfaces son locales del consumidor o generados desde OpenAPI.
4. **Cero Versiones Hardcodeadas (Single Source of Truth para Versiones)**:
   - **PROHIBIDO** inventar o duplicar números de versiones estáticas en el README que queden desfasados del código real.
   - La versión de Node.js y pnpm debe referenciar `package.json` (`"engines"`, `"packageManager"`) o `.nvmrc` / `.node-version`.
   - Las versiones de bases de datos y colas deben referenciarse a `docker-compose.yml`.
   - La política y matriz de versiones global está centralizada en [technology/versions.md](../../technology/versions.md) y en las políticas de plataforma (`policies/platform/node-backend-2026.json`).
5. **Verificación Antes del Despliegue**: Todo README debe declarar los comandos de testing unitario, integración, E2E y linters.

---

## 2. Anatomía Canónica de un README de Producción

Todo repositorio en VIGILIO debe estructurar su `README.md` siguiendo este orden:

```markdown
# [Nombre del Proyecto] — [Pitch / Propósito en 1 Línea]

[Breve párrafo descriptivo explicando qué problema resuelve el proyecto y su valor de negocio].

## 1. Características Principales (Features)
- **Feature A**: Descripción clara y orientada a valor.
- **Feature B**: Descripción técnica/funcional.

## 2. Stack Tecnológico (Tech Stack)
- **Runtime / Lenguaje**: Node.js (fijado en `package.json#engines`), TypeScript
- **Framework**: NestJS (Fastify) en Backend / React o Preact (Vite) en Frontend
- **Base de Datos & Caché**: PostgreSQL / Valkey (imágenes fijadas en `docker-compose.yml`)
- **Tooling & Linter**: Biome, pnpm (fijado en `package.json#packageManager`), Vitest, Playwright
- **CI/CD & Cloud**: GitHub Actions, Docker, AWS EKS / S3 + CloudFront
- **Línea Canónica de Versiones**: Verificada en [vigilio-docs/technology/versions.md](../../technology/versions.md)

## 3. Inicio Rápido (Quick Start < 10 min)
### Prerrequisitos
- Node.js: Versión fijada en `package.json` (`"engines"`) o `.nvmrc`
- pnpm: Versión fijada en `package.json` (`"packageManager"`)
- Docker Desktop / Podman en ejecución (servicios en `docker-compose.yml`)

### Instalación y Configuración
1. Clonar el repositorio:
   ```bash
   git clone <repo-url> && cd <repo-dir>
   ```
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tus valores locales
   ```
4. Levantar servicios locales (Docker):
   ```bash
   docker compose up -d
   ```
5. Iniciar en desarrollo:
   ```bash
   pnpm run dev # o pnpm run start:dev
   ```

## 4. Estructura del Repositorio (Repository Structure)
Árbol anotado explicando la responsabilidad de cada directorio principal.

## 5. Arquitectura y Flujo de Datos
Explicación o diagrama Mermaid de Clean Architecture, DDD o Microfrontends.

## 6. Contratos y API Endpoints
Tabla de endpoints y ejemplo de request/response con schemas Zod y tree-shaking por subpath.

## 7. Variables de Entorno (Environment Variables)
Tabla detallando nombre, descripción, obligatoriedad y si es secreta.

## 8. Calidad y Pruebas (Testing)
Comandos para unitarios, integración, E2E y cobertura.

## 9. CI/CD y Flujo de Ramas
Gobernanza de Pull Requests, Conventional Commits y pipelines automáticos.

## 10. Checklist del Desarrollador y Errores Comunes
Lista de comprobación rápida para evitar problemas frecuentes.
```

---

## 3. Ejemplo Real: Backend NestJS (`bus-impl`)

```markdown
# Bus Implementation API — Core de Pagos y Emisión

Microservicio backend de alta concurrencia encargado del procesamiento de órdenes, validación de clientes y emisión de pólizas de seguros.

## Stack Tecnológico
- **Runtime**: Node.js (fijado en `package.json#engines`) + TypeScript
- **Framework**: NestJS + Clean Architecture & DDD
- **Persistencia**: PostgreSQL + Drizzle ORM (imagen fijada en `docker-compose.yml`)
- **Colas Asíncronas**: BullMQ + Valkey (Redis)
- **Contratos**: Schemas Zod generados automáticamente con `vigilio-node generate-contracts`
- **Testing**: Vitest (Unitarios/Integración) + Playwright API
- **Baseline de Versiones**: [technology/versions.md](../../technology/versions.md)

## Quick Start (< 10 min)
1. **Requisitos**: Node.js (ver `package.json#engines`), pnpm (ver `package.json#packageManager`), Docker.
2. **Instalar**: `pnpm install`
3. **Variables**: `cp .env.example .env`
4. **Base de datos local**: `docker compose up -d postgres redis`
5. **Migraciones**: `pnpm run db:migrate`
6. **Ejecutar**: `pnpm run start:dev`

## Flujo de Contratos (ADR 0001)
Este microservicio es el **propietario único** de los contratos. Los DTOs se definen en `src/**/presentation/http/dto/` y se compilan automáticamente para el frontend con soporte estricto de **Tree-Shaking**:
```bash
pnpm run build:contracts
```
El paquete resultante publica subpaths específicos por servicio (ej. `@empresa/orders-contracts/ecommerce-bus-impl`) con `"sideEffects": false` en `package.json`, asegurando que el frontend solo empaquete los DTOs y schemas que realmente consume.

## Variables de Entorno
| Variable | Descripción | Requerida | Secreta |
|---|---|:---:|:---:|
| `PORT` | Puerto de escucha HTTP (default: 3000) | No | No |
| `DATABASE_URL` | Conexión PostgreSQL (`postgres://...`) | Sí | Sí |
| `REDIS_URL` | Conexión Valkey/Redis para BullMQ | Sí | Sí |
| `JWT_SECRET` | Clave de firmado de tokens | Sí | Sí |

## Testing y Gobernanza
```bash
# Tests unitarios
pnpm run test:unit

# Tests de integración con base de datos
pnpm run test:integration

# Verificación de gobernanza y dependencias
pnpm run test:devsecops
```
```

---

## 4. Ejemplo Real: Frontend Web MFE (`web-mfe`)

```markdown
# Backoffice Salud — Web Microfrontend

Portal web responsive para la administración y suscripción de pólizas de salud, integrado mediante arquitectura de microfrontends.

## Stack Tecnológico
- **UI Framework**: Preact / React + Vite (fijados en `package.json` y `pnpm-lock.yaml`)
- **Estilos**: Tailwind CSS + Radix UI
- **Estado & Datos**: TanStack Query + Preact Signals
- **Contratos**: Consumo de `@empresa/orders-contracts/ecommerce-bus-impl` (Tree-Shaking)
- **Testing**: Vitest + Testing Library + Playwright E2E

## Quick Start
1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm run dev` (abre en `http://localhost:5173`)

## Consumo de Contratos
Este frontend **NO declara DTOs locales manuales**. Importa los schemas directamente del subpath exportado del microservicio backend, beneficiándose de **Tree-Shaking** para minimizar los bundles de JavaScript:
```typescript
import { productResponseSchema, type ProductResponseDto } from '@empresa/orders-contracts/ecommerce-bus-impl';
```
> **Beneficio de Rendimiento Senior**: Al importar desde el subpath específico y contar con `"sideEffects": false`, el bundler (Vite) descarta schemas no utilizados de otros microservicios (billing, auth, reporting), reduciendo drásticamente el consumo de CPU y memoria en el navegador del cliente.
>
> **Nota Senior Mode**: Si el backend fuera externo o no estuviera en TypeScript, los contratos se definen como interfaces locales en `src/types/` o se generan vía cliente OpenAPI.

## Testing E2E y Visual
```bash
# Tests unitarios
pnpm run test

# Pruebas End-to-End con navegador real
pnpm run test:e2e
```
```

---

## 5. Errores Comunes que Rompen el Onboarding (Common Pitfalls)

| Error Común | Impacto | Solución Senior Mode |
|---|---|---|
| **Hardcodear credenciales en código** | Fuga de seguridad grave | Usar variables de entorno en `.env.example` y gitignorar `.env`. |
| **Hardcodear versiones de herramientas** | Documentación desfasada y drift | Referenciar `package.json` (`engines`, `packageManager`), `docker-compose.yml` y `technology/versions.md`. |
| **Omitir el paso a paso de arranque** | Desarrolladores bloqueados días | Sección *Quick Start* probada desde cero en una máquina limpia. |
| **No explicar la estructura de carpetas** | Archivos colocados en lugares erróneos | Árbol anotado en la sección *Repository Structure*. |
| **Falta de tests o comandos rotos** | Código que falla en producción | Comandos exactos de `test:unit` y `test:e2e` documentados. |
| **Versionado inexistente** | Pérdida de trazabilidad | Seguir SemVer y mantener `CHANGELOG.md` al día. |
