# NestJS — estructura por feature, puertos, configuración y tipos

**Owner:** auth/products/etc. Complementar el [owner transversal](../../../../standards/engineering/file-and-symbol-ownership.md) y el [contrato HTTP](../../../../standards/api/http-dtos-and-contracts.md); `@Inject(TOKEN)` requiere token real en runtime aunque el puerto sea TypeScript interface. Documentación oficial: https://docs.nestjs.com/modules y https://docs.nestjs.com/fundamentals/custom-providers.

## Estructura proporcional

```text
src/modules/auth/
├── auth.module.ts
├── domain/auth-security.ts
├── application/ports/auth-ports.ts
├── application/services/auth.service.ts
├── infrastructure/argon2-password-hasher.ts
├── config/password-hashing.config.ts
├── presentation/http/dto/sign-in.request.dto.ts
└── tests/auth.service.test.ts
```

**En producción:** usar configuración tipada/validada por ambiente cuando los parámetros deban cambiar sin release; hash policy pertenece al módulo auth, no a `shared/constants` global. `AuthService` orquesta validación, límite, sesión; hash y verificación viven en un adaptador inyectado para tests. `USER_REPOSITORY` y `SESSION_REPOSITORY` son tokens de DI y `AuthUserRepository`/`AuthSessionRepository` son tipos de puerto. No duplicar interfaces por puro convencimiento de carpetas.

```ts
// application/ports/password-hasher.port.ts
export interface PasswordHasher { hash(password: string): Promise<string>; verify(hash: string, password: string): Promise<boolean>; }
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
```

```ts
// application/services/auth.service.ts
@Injectable()
export class AuthService {
  constructor(@Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher) {}
  async verifyCredentials(stored_hash: string, submitted_password: string): Promise<boolean> {
    return this.passwordHasher.verify(stored_hash, submitted_password);
  }
}
```

*Snippet ilustrativo:* faltan imports Nest, `AuthModule` y adaptador real; no presentarlo como programa compilado. La política de hash compartida no vive en este service. En tests probar flujo de usuario inexistente (respuesta uniforme, límites, tiempos) y recuperación de sesión; nunca importar infraestructura desde Domain.

**Contraejemplos:** `const HASH_OPTIONS` replicado en tres services, `UserRepository` definido dentro de `AuthService`, DTO mezclado con dominio, `SharedUtils` circular, secretos en `constants.ts`, cambiar `hashing` sin plan de migración.

## ✅ Correcto / ❌ Incorrecto — criterio verificable

- ✅ **Correcto:** Definir `PasswordHasher` como puerto y `PASSWORD_HASHER` como token de DI runtime.
- ❌ **Incorrecto:** Declarar puertos dentro del servicio y mover `const` temporales sin propósito.
