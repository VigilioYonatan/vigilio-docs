# Ownership de archivos y símbolos — constantes, tipos, contratos y utilidades

**Estado:** estándar canónico de ingeniería transversal. **Owner:** `standards/engineering/`. Aplicar a código nuevo, y a refactors existentes solo con análisis de consumidores. Complementa [naming-and-boundaries](naming-and-boundaries.md), [comentarios](code-comments-and-docstrings.md) y [review](change-impact-and-review-gates.md); no altera contratos publicados por estética.

## Decisión principal: cohesión y propietario antes de elegir carpeta

**Prohibido confundir `const` con una falta de arquitectura.** Un `const` local de una función o configuración inmutable pequeña pertenece normalmente a su uso. Una configuración de hashing compartida con login, registro y rehash tiene dueño de módulo y debe extraerse. El criterio no es la palabra clave; es **qué componente posee el conocimiento**.

| Símbolo | Propietario recomendado | No hacer |
|---|---|---|
| Temporal de cálculo, índice, guard, `const result` | Función que lo usa | Crear `const/` para una línea |
| Parámetro reutilizado de Argon2, retry, TTL de auth | `auth/constants/` o `auth/config/` con versión y propósito | Repetir valores en service/controller; exportar secreto |
| Tipo de puerto/contrato de repositorio | `auth/application/ports/` (TS `interfaces/`/`types/` solo si hay propósito) | Declararlo dentro del servicio; exportar clase de framework al dominio |
| Tipo derivable de un schema propietario | Mismo contrato, tipo inferido o indexado | Duplicar union/alias trivial |
| DTO HTTP validado | Frontera `http/dto/` o `presentation/` | Mezclar Zod, controlador y lógica dominio |
| Función pura reusable en un feature | `feature/lib/`/`utils/` específica, o `feature/domain/` si es regla | `shared/utils.ts` como cajón universal |
| Componente, escena o widget | Dentro de feature y assets/tests propios | Globalizarlo antes de existir un segundo consumidor |
| Constante realmente compartida por varios features | `shared/constants/` con API estable y ownership | Importar `auth/constants` desde facturación por conveniencia |
| Secretos y configuración por entorno | Provider/config validada y secret manager | `const SECRET = '...'` en Git |

## Árbol recomendado para un módulo NestJS de autenticación (ejemplo)

```text
apps/api/src/modules/auth/
├── auth.module.ts
├── application/
│   ├── services/auth.service.ts
│   ├── ports/auth-ports.ts
│   └── use-cases/
├── domain/
│   ├── auth-security.ts
│   └── errors/
├── config/
│   ├── password-hashing.config.ts
│   └── auth-rate-limit.config.ts
├── constants/
│   └── auth-timings.constants.ts    # SOLO si aporta semántica reutilizable
├── presentation/http/dto/
├── infrastructure/
│   ├── persistence/
│   └── argon2-password-hasher.ts
└── tests/
    ├── unit/
    └── integration/
```

`types/`, `interfaces/`, `libs/`, `shared/` **son convenciones opcionales, no checkboxes**. Preferir `ports/` cuando el tipo expresa una dependencia invertida; `lib/` cuando agrupa funciones puras con propietario; `shared/` solo después de un segundo consumidor real. No duplicar módulos en `lib/`, `helpers/` y `utils/`.

## Ejemplo concreto — `HASH_OPTIONS` fuera de `AuthService`

**Incorrecto si la política se reutiliza:**

```ts
// auth.service.ts
const HASH_OPTIONS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;
@Injectable()
export class AuthService { /* registro, hash y login terminan acoplados */ }
```

**Correcto cuando auth es dueño de la política:**

```ts
// auth/config/password-hashing.config.ts
import * as argon2 from 'argon2';
export const passwordHashOptions = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
});
```

```ts
// auth/infrastructure/argon2-password-hasher.ts
import * as argon2 from 'argon2';
import { passwordHashOptions } from '../config/password-hashing.config.js';
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, passwordHashOptions);
}
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
```

**Matiz de seguridad:** estos parámetros son un *ejemplo* y deben calibrarse según hardware, latencia, DoS y política operativa. El hash ficticio en arranque **no puede tratarse como prueba de tiempo constante**; examinar rate limit, diferencia de rutas, error uniforme y eventos de timing. Los ajustes de hashing existentes pueden requerir migración gradual, nunca cambio ciego.

## Dependencias permitidas y pruebas

```text
presentation/http -> application -> domain
infrastructure ---> application/ports (+ domain types)
composition/module -> presenta + infraestructura + aplicación
shared/core <- varios features, sin dependencias de infraestructura ni del propio consumidor
```

- Definir `auth-ports.ts` en Application; la implementación en Infrastructure. Configuración runtime se inyecta desde composición. Importar interfaces con `import type` no ejecuta dependencias en TS; Nest necesita token en runtime con `@Inject`.
- Mover un símbolo interno requiere buscar imports, barrel exports, mocks, consumidores y tests; mover un export público exige migración/versionado.
- Test unitario comprueba `passwordHashOptions` y `PasswordHasher`; integración comprueba hash/verify con fixtures y rehash de versiones anteriores. Tests negativos protegen rate limits, mensajes indistinguibles y no exposición de tokens.
- El estándar de review debe detectar servicios enormes y propiedad incorrecta **por semántica**, no hacer fallar cualquier `const` en `service.ts` o exigir `const/` a ciegas.

## Decisión ADR abreviada y excepciones

**Promover a archivo propio** cuando hay dos consumidores, contrato público, invariantes de seguridad, configuración cambiante o tests aislables. **Colocalizar** cuando el símbolo es pequeño, privado, estable y no añade dependencia. **Rechazar extracción** si aumenta acoplamiento, crea `shared` cíclico o pierde seguridad/encapsulación. Evidencia: diff, imports afectados, tests ejecutados `PASS/FAIL/BLOCKED/NOT_RUN` y justificación.

## Guías por lenguaje

- [NestJS](../../stacks/backend/nestjs/architecture/module-symbol-ownership.md)
- [Laravel](../../stacks/backend/laravel/architecture/module-symbol-ownership.md)
- [Rust](../../stacks/rust/core/module-symbol-ownership.md)
- [C++](../../stacks/cpp/core/module-symbol-ownership.md)
- [Godot GDScript/C#](../../stacks/godot/core/module-symbol-ownership.md)
- [React/Web](../../stacks/frontend/web-mfe/ui/component-symbol-ownership.md)
- [Expo/Mobile](../../stacks/mobile/expo/ui/component-symbol-ownership.md)

## ✅ Correcto / ❌ Incorrecto — criterio verificable

- ✅ **Correcto:** Extraer una política de hash compartida a `auth/config` y conservar `const user` local al flujo.
- ❌ **Incorrecto:** Forzar una carpeta `const/` por cada declaración e importar auth desde shared indiscriminadamente.
