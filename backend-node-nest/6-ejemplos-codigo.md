# Ejemplos de Codigo - `bus-impl` 2026

Este documento muestra pequenos ejemplos reales del stack actualizado.

---

## 1. Schemas, pipes y utilidades reutilizables

```typescript
// src/shared/application/schemas/query.schema.ts
import { z } from 'zod';

export const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).default(25),
  offset: z.number().int().min(0).default(0),
  search: z.string().optional(),
  sort_by: z.string().default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});

export type QuerySchema = z.infer<typeof querySchema>;
```

```typescript
// src/shared/application/schemas/paginator.schema.ts
import { z } from 'zod';

export function createPaginatorSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    count: z.number().int().min(0),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(itemSchema),
  });
}

export type PaginatorSchema<T extends z.ZodTypeAny> = ReturnType<typeof createPaginatorSchema<T>>;
```

```typescript
// src/shared/application/schemas/timestamp.schema.ts
import dayjs from 'dayjs';
import { z } from 'zod';

export const customDateSchema = z.preprocess(
  (val) => {
    if (val instanceof Date) return val;
    if (typeof val === 'string') return dayjs(val).toDate();
    return val;
  },
  z.date().refine((d) => !Number.isNaN(d.getTime()), { message: 'Invalid date' }),
);

export const timestampSchema = z.object({
  created_at: customDateSchema,
  updated_at: customDateSchema,
});

export type TimestampSchema = z.infer<typeof timestampSchema>;
```

```typescript
// src/shared/application/utils/file.util.ts
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function fileExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'text/csv': 'csv',
  };

  return map[mimeType] ?? 'bin';
}

export function isAllowedMimeType(mimeType: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(mimeType);
}
```

```typescript
// src/shared/config/upload.config.ts
export const UPLOAD_RULES = {
  avatar: {
    max_size: 2 * 1024 * 1024,
    mime_types: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { width: 400, height: 400 },
  },
  document: {
    max_size: 50 * 1024 * 1024,
    mime_types: ['application/pdf', 'application/zip', 'text/csv'],
  },
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024,
  PART_SIZE: 5 * 1024 * 1024,
  MAX_PARTS: 10000,
  PRESIGNED_URL_EXPIRY: 900,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/zip',
    'text/csv',
  ] as const,
  user: {
    avatar: {
      dimensions: { width: 400, height: 400 },
      max_size: 2 * 1024 * 1024,
      mime_types: ['image/jpeg', 'image/png', 'image/webp'],
    },
  },
} as const;

export type AllowedMimeType = (typeof UPLOAD_CONFIG.ALLOWED_MIME_TYPES)[number];
export type UploadMimeType = (
  | (typeof UPLOAD_RULES.avatar.mime_types)[number]
  | (typeof UPLOAD_RULES.document.mime_types)[number]
) &
  string;
```

```typescript
// src/shared/infrastructure/persistence/drizzle/custom-types/numeric-custom-types.ts
import { customType } from 'drizzle-orm/pg-core';

export const numericStringCustom = (name?: string, precision?: number, scale?: number) => {
  const pgPrecision = precision ?? 12;
  const pgScale = scale ?? 2;

  return customType<{
    data: string;
    driverData: string;
  }>({
    dataType() {
      return `numeric(${pgPrecision},${pgScale})`;
    },
    fromDriver(value: string): string {
      return value;
    },
    toDriver(value: string): string {
      return value;
    },
  })(name ?? 'numeric_string');
};

export const numericNumberCustom = (name?: string, precision?: number, scale?: number) => {
  const pgPrecision = precision ?? 12;
  const pgScale = scale ?? 2;

  return customType<{
    data: number;
    driverData: string;
  }>({
    dataType() {
      return `numeric(${pgPrecision},${pgScale})`;
    },
    fromDriver(value: string): number {
      return Number(value);
    },
    toDriver(value: number): string {
      return value.toString();
    },
  })(name ?? 'numeric_number');
};
```

Regla:

- `numericStringCustom` para dinero, primas, saldos, tasas regulatorias y valores que exigen precision exacta.
- `numericNumberCustom` solo para metricas o valores no monetarios donde la perdida binaria sea aceptable.

```typescript
// src/shared/infrastructure/http/pipes/zod.pipe.ts
import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: result.error.issues.map((e) => ({
          field: String(e.path.join('.')),
          message: e.message,
        })),
      });
    }

    return result.data;
  }
}
```

```typescript
// src/shared/infrastructure/http/pipes/zod-query.pipe.ts
import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodSchema, ZodTypeAny } from 'zod';

@Injectable()
export class ZodQueryPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: Record<string, string>): T['_output'] {
    const parsed: Record<string, string> = { ...value };

    if (parsed.limit) {
      parsed.limit = String(Number(parsed.limit));
    }

    if (parsed.offset) {
      parsed.offset = String(Number(parsed.offset));
    }

    const result = this.schema.safeParse(parsed);

    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Query validation failed',
        errors: result.error.issues.map((e) => ({
          field: String(e.path.join('.')),
          message: e.message,
        })),
      });
    }

    return result.data;
  }
}
```

---

## 2. Schema Zod base

```typescript
// src/endoso/application/schemas/endoso.schema.ts
import { z } from 'zod';
import { timestampSchema } from '@/shared/application/schemas/timestamp.schema';

export const endosoSchema = z.object({
  id: z.number().int().positive(),
  nro_poliza: z.string().min(1).max(30),
  tipo_endoso: z.enum(['inclusion', 'exclusion']),
  fecha_inicio: z.iso.date(),
  broker_id: z.number().int().positive(),
  estado: z.enum(['pendiente', 'procesado', 'anulado']),
  ...timestampSchema.shape,
});

export type EndosoSchema = z.infer<typeof endosoSchema>;
```

---

## 3. DTOs Zod derivados del schema

```typescript
// src/endoso/application/dtos/endoso-store.request.dto.ts
import { z } from 'zod';
import { endosoSchema } from '../schemas/endoso.schema';

export const endosoStoreRequestDto = endosoSchema.pick({
  nro_poliza: true,
  tipo_endoso: true,
  fecha_inicio: true,
  broker_id: true,
});

export type EndosoStoreRequestDto = z.infer<typeof endosoStoreRequestDto>;
```

```typescript
// src/endoso/application/dtos/endoso-update.request.dto.ts
import { z } from 'zod';
import { endosoStoreRequestDto } from './endoso-store.request.dto';

export const endosoUpdateRequestDto = endosoStoreRequestDto.partial();

export type EndosoUpdateRequestDto = z.infer<typeof endosoUpdateRequestDto>;
```

```typescript
// src/endoso/application/dtos/endoso-index.request.dto.ts
import type { z } from 'zod';
import { querySchema } from '@/shared/application/schemas/query.schema';
import { endosoSchema } from '../schemas/endoso.schema';

export const endosoIndexQueryDto = endosoSchema
  .pick({
    nro_poliza: true,
    estado: true,
  })
  .partial()
  .extend(querySchema.shape);

export type EndosoIndexQueryDto = z.infer<typeof endosoIndexQueryDto>;
```

```typescript
// src/endoso/application/dtos/endoso-index.response.dto.ts
import { z } from 'zod';
import { createPaginatorSchema } from '@/shared/application/schemas/paginator.schema';
import { endosoSchema } from '../schemas/endoso.schema';

export const endosoIndexResponseDto = createPaginatorSchema(
  endosoSchema.pick({
    id: true,
    nro_poliza: true,
    tipo_endoso: true,
  }),
);

export type EndosoIndexResponseDto = z.infer<typeof endosoIndexResponseDto>;
```

```typescript
// src/endoso/application/dtos/endoso-show.response.dto.ts
import { z } from 'zod';
import { endosoSchema } from '../schemas/endoso.schema';

export const endosoShowResponseDto = z.object({
  success: z.literal(true),
  endoso: endosoSchema.pick({
    id: true,
    nro_poliza: true,
    tipo_endoso: true,
  }),
});

export type EndosoShowResponseDto = z.infer<typeof endosoShowResponseDto>;
```

```typescript
// src/endoso/application/dtos/endoso-store.response.dto.ts
import { z } from 'zod';
import { endosoShowResponseDto } from './endoso-show.response.dto';

export const endosoStoreResponseDto = endosoShowResponseDto;

export type EndosoStoreResponseDto = z.infer<typeof endosoStoreResponseDto>;
```

```typescript
// src/endoso/application/dtos/endoso-update.response.dto.ts
import { z } from 'zod';
import { endosoShowResponseDto } from './endoso-show.response.dto';

export const endosoUpdateResponseDto = endosoShowResponseDto;

export type EndosoUpdateResponseDto = z.infer<typeof endosoUpdateResponseDto>;
```

```typescript
// src/endoso/application/dtos/endoso-destroy.response.dto.ts
import { z } from 'zod';

export const endosoDestroyResponseDto = z.object({
  success: z.literal(true),
  message: z.string(),
});

export type EndosoDestroyResponseDto = z.infer<typeof endosoDestroyResponseDto>;
```

---

## 4. Class DTOs para Swagger y validation pipe

Las clases para Swagger/Scalar viven dentro del mismo archivo `*.request.dto.ts` o `*.response.dto.ts`. No se crea `*.query.dto.ts`, `*.params.dto.ts` ni `*.response.class.dto.ts` por defecto.

```typescript
// src/endoso/application/dtos/endoso-store.request.dto.ts
import { createZodDto } from 'nestjs-zod';

export class EndosoStoreRequestClassDto extends createZodDto(endosoStoreRequestDto) {}
```

```typescript
// src/endoso/application/dtos/endoso-index.response.dto.ts
import { createZodDto } from 'nestjs-zod';

export class EndosoIndexResponseClassDto extends createZodDto(endosoIndexResponseDto) {}
```

---

## 5. Controller con Zod + Swagger

```typescript
// src/endoso/infrastructure/http/controllers/endoso.controller.ts
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EndosoApplicationService } from '../../../application/service/endoso.application-service';
import { ZodResponse } from 'nestjs-zod';
import { Public } from '@/shared/infrastructure/security/public.decorator';
import {
  endosoIndexQueryDto,
  type EndosoIndexQueryDto,
} from '../../../application/dtos/endoso-index.request.dto';
import {
  EndosoStoreRequestClassDto,
  endosoStoreRequestDto,
  type EndosoStoreRequestDto,
} from '../../../application/dtos/endoso-store.request.dto';
import {
  EndosoIndexResponseClassDto,
  type EndosoIndexResponseDto,
} from '../../../application/dtos/endoso-index.response.dto';
import {
  EndosoStoreResponseClassDto,
  type EndosoStoreResponseDto,
} from '../../../application/dtos/endoso-store.response.dto';
import { ZodPipe } from '@/shared/infrastructure/http/pipes/zod.pipe';
import { ZodQueryPipe } from '@/shared/infrastructure/http/pipes/zod-query.pipe';

@ApiTags('endosos')
@Controller('endosos')
export class EndosoController {
  constructor(private readonly endosoApplicationService: EndosoApplicationService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Indexar endosos' })
  @ZodResponse({ status: 200, type: EndosoIndexResponseClassDto })
  async index(
    @Query(new ZodQueryPipe(endosoIndexQueryDto)) query: EndosoIndexQueryDto,
  ): Promise<EndosoIndexResponseDto> {
    return this.endosoApplicationService.index(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear endoso' })
  @ApiBody({ type: EndosoStoreRequestClassDto })
  @ZodResponse({ status: 201, type: EndosoStoreResponseClassDto })
  async store(
    @Body(new ZodPipe(endosoStoreRequestDto)) body: EndosoStoreRequestDto,
  ): Promise<EndosoStoreResponseDto> {
    return this.endosoApplicationService.store(body);
  }
}
```

Nota:

- `ZodPipe` valida body y `ZodQueryPipe` valida query params
- el backend recomendado es `private-by-default`; `@Public()` abre solo las rutas que deben quedar sin auth
- `patchNestJsSwagger()` permite que Swagger entienda los DTOs Zod
- los DTOs reutilizan el schema base con `pick`, `omit`, `extend` o `partial`
- `@Query()` queda validado por el query schema dentro de `*.request.dto.ts` y por `ZodQueryPipe`
- `application/dtos/*.response.dto.ts` define los `ResponseDto` que retornan services/controllers
- los `ResponseClassDto` viven dentro del mismo `*.response.dto.ts` y adaptan esos schemas para `@ZodResponse(...)`, Swagger y Scalar

---

## 6. Application service

```typescript
// src/endoso/application/service/endoso.application-service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { EndosoIndexQueryDto } from '../dtos/endoso-index.request.dto';
import type { EndosoStoreRequestDto } from '../dtos/endoso-store.request.dto';
import type { EndosoIndexResponseDto } from '../dtos/endoso-index.response.dto';
import type { EndosoStoreResponseDto } from '../dtos/endoso-store.response.dto';
import type { IEndosoRepository } from '../repositories/endoso.repository.interface';
import { ENDOSO_REPOSITORY } from '../repositories/endoso.repository.token';

@Injectable()
export class EndosoApplicationService {
  private readonly logger = new Logger(EndosoApplicationService.name);

  constructor(
    @Inject(ENDOSO_REPOSITORY)
    private readonly endosoRepository: IEndosoRepository,
  ) {}

  async index(query: EndosoIndexQueryDto): Promise<EndosoIndexResponseDto> {
    this.logger.log({ action: 'endoso.index', query }, 'Indexing endosos');

    return this.endosoRepository.index(query);
  }

  async store(body: EndosoStoreRequestDto): Promise<EndosoStoreResponseDto> {
    this.logger.log({ action: 'endoso.store', broker_id: body.broker_id }, 'Storing endoso');

    const persisted = await this.endosoRepository.store(body);

    return {
      success: true,
      endoso: {
        id: persisted.id,
        nro_poliza: persisted.nro_poliza,
        tipo_endoso: persisted.tipo_endoso,
      },
    };
  }

}
```

---

## 7. Puerto de repositorio

```typescript
// src/endoso/application/repositories/endoso.repository.interface.ts
import type { EndosoIndexQueryDto } from '../dtos/endoso-index.request.dto';
import type { EndosoStoreRequestDto } from '../dtos/endoso-store.request.dto';
import type { EndosoIndexResponseDto } from '../dtos/endoso-index.response.dto';
import type { EndosoStoreResponseDto } from '../dtos/endoso-store.response.dto';

export interface IEndosoRepository {
  index(query: EndosoIndexQueryDto): Promise<EndosoIndexResponseDto>;
  store(body: EndosoStoreRequestDto): Promise<EndosoStoreResponseDto['endoso']>;
}
```

```typescript
// src/endoso/application/repositories/endoso.repository.token.ts
export const ENDOSO_REPOSITORY = Symbol('ENDOSO_REPOSITORY');
```

---

## 8. Schema Drizzle

```typescript
// src/endoso/infrastructure/persistence/drizzle/schema.ts
import { pgTable, serial, varchar, date, integer, timestamp } from 'drizzle-orm/pg-core';

export const endosoTable = pgTable('endoso', {
  id: serial('id').primaryKey(),
  nro_poliza: varchar('nro_poliza', { length: 30 }).notNull(),
  tipo_endoso: varchar('tipo_endoso', { length: 20 }).notNull(),
  fecha_inicio: date('fecha_inicio').notNull(),
  broker_id: integer('broker_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 9. Repositorio Drizzle

```typescript
// src/endoso/infrastructure/persistence/drizzle/endoso.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DB } from '../../../../shared/infrastructure/database/database.constants';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { endosoTable } from './schema';
import type { IEndosoRepository } from '../../../application/repositories/endoso.repository.interface';
import type { EndosoIndexQueryDto } from '../../../application/dtos/endoso-index.request.dto';
import type { EndosoIndexResponseDto } from '../../../application/dtos/endoso-index.response.dto';
import type { EndosoStoreRequestDto } from '../../../application/dtos/endoso-store.request.dto';

@Injectable()
export class EndosoRepository implements IEndosoRepository {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase,
  ) {}

  async index(query: EndosoIndexQueryDto): Promise<EndosoIndexResponseDto> {
    const rows = await this.db
      .select({
        id: endosoTable.id,
        nro_poliza: endosoTable.nro_poliza,
        tipo_endoso: endosoTable.tipo_endoso,
      })
      .from(endosoTable)
      .limit(query.limit)
      .offset(query.offset);

    return {
      success: true,
      count: rows.length,
      next: null,
      previous: null,
      results: rows,
    };
  }

  async store(body: EndosoStoreRequestDto) {
    const [row] = await this.db
      .insert(endosoTable)
      .values({
        nro_poliza: body.nro_poliza,
        tipo_endoso: body.tipo_endoso,
        fecha_inicio: body.fecha_inicio,
        broker_id: body.broker_id,
      })
      .returning();

    return row;
  }
}
```

---

## 10. Configuracion tipada del entorno

```typescript
// src/shared/infrastructure/config/environment.schema.ts
import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_STAGE: z.enum(['local', 'development', 'staging', 'production']).default('local'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  AWS_REGION: z.string().default('us-east-1'),
  DOCS_AUTH_TOKEN: z.string().optional(),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  return environmentSchema.parse(config);
}
```

Uso en Nest:

```typescript
ConfigModule.forRoot({
  cache: true,
  isGlobal: true,
  validate: validateEnvironment,
});
```

---

## 11. Bootstrap de Swagger + Scalar

```typescript
// src/shared/infrastructure/docs/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Bus Impl API')
    .setDescription('API de negocio actualizada a 2026')
    .setVersion('2026.06')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
    },
  });

  app.use(
    '/reference',
    apiReference({
      url: '/docs-json',
      withFastify: true,
      theme: 'kepler',
      layout: 'modern',
      customCss: `
        :root {
          --scalar-color-accent: #d71920;
          --scalar-background-1: #fffaf8;
          --scalar-font: 'Segoe UI', sans-serif;
        }
      `,
      metaData: {
        title: 'Bus Impl API Reference',
      },
    }),
  );

  return document;
}
```

```typescript
// src/shared/infrastructure/observability/logger/logger.module.ts
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { environments } from '@/shared/infrastructure/config/environments';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          level: environments.app_stage === 'production' ? 'info' : 'debug',
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers[\"set-cookie\"]',
              'req.body.password',
              'req.body.token',
              'req.body.secret',
            ],
            remove: true,
          },
          customProps: (req) => ({
            service: 'bus-impl',
            stage: environments.app_stage,
            request_id: req.id,
            correlation_id: req.headers['x-correlation-id'],
          }),
          transport:
            environments.app_stage === 'local'
              ? {
                  target: 'pino-pretty',
                  options: { singleLine: true, colorize: true },
                }
              : undefined,
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}
```

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { setupSwagger } from './shared/infrastructure/docs/swagger.config';

async function bootstrap() {
  patchNestJsSwagger();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ZodValidationPipe());

  setupSwagger(app);

  await app.listen(3000);
}

void bootstrap();
```

Nota sobre branding:

- en la integracion `@scalar/nestjs-api-reference` si puedes cambiar tema, layout, tipografia y colores
- no se documenta una propiedad runtime oficial `logo` en esta integracion embebida
- si quieres branding con logo first-class, conviene evaluar Scalar Docs como sitio dedicado

---

## 12. Ejemplo de script para exportar OpenAPI

```typescript
// scripts/export-openapi.ts
import { NestFactory } from '@nestjs/core';
import { writeFile } from 'node:fs/promises';
import { AppModule } from '../src/app.module';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { setupSwagger } from '../src/shared/infrastructure/docs/swagger.config';

async function exportOpenApi() {
  patchNestJsSwagger();

  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ZodValidationPipe());

  const document = setupSwagger(app);

  await writeFile('docs/openapi/openapi.json', JSON.stringify(document, null, 2));
  await app.close();
}

void exportOpenApi();
```

Buenas practicas del logger:

- `pino-pretty` solo en local
- `stdout` JSON en cloud
- redaction obligatoria para secrets y cookies
- leer stage y niveles desde `shared/infrastructure/config/environments.ts`
- `Logger` de `@nestjs/common` dentro de servicios; `Logger` de `nestjs-pino` solo para bootstrap `app.useLogger(...)`
