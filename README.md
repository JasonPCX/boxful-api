# Boxful API

API REST desarrollada con NestJS para la gestion de ordenes de envio con soporte para Cobro Contra Entrega (COD) y calculo de liquidaciones.

## Tabla de contenidos

- [Descripción](#descripción)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución con Docker](#ejecución-con-docker)
- [Ejecución del proyecto](#ejecución-del-proyecto)
- [Seeder de datos](#seeder-de-datos)
- [Documentación de la API](#documentación-de-la-api)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Funcionalidades implementadas](#funcionalidades-implementadas)
- [Esfuerzos extras](#esfuerzos-extras)

---

## Descripción

Esta API proporciona las siguientes funcionalidades:

- Autenticación de usuarios mediante JWT
- Gestión de órdenes de envío
- Soporte para órdenes con Cobro Contra Entrega (COD)
- Webhook para actualizaciones externas de estado de órdenes
- Configuración de costos de envío por día de la semana
- Cálculo automático de liquidaciones aplicando reglas de negocio

---

## Requisitos previos

- Node.js v20.x o superior (recomendado: v20.18.0 LTS)
- pnpm v9.x o superior
- Docker y Docker Compose (para ejecución con contenedores)
- MongoDB v8.x (si se ejecuta sin Docker)

---

## Instalación

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd boxful-api
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Configurar las variables de entorno:

```bash
cp .env.example .env
```

4. Editar el archivo `.env` con los valores correspondientes a tu entorno.

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución (development, production, test) | `development` |
| `PORT` | Puerto en el que se ejecuta la API | `5000` |
| `JWT_SECRET_KEY` | Clave secreta para firmar los tokens JWT | `your_jwt_secret_key_here` |
| `MONGODB_URI` | String de conexión a MongoDB | `mongodb://usuario:password@localhost:27017/boxful?authSource=admin` |
| `DB_SYNCHRONIZE` | Sincronizar entidades con la base de datos (solo desarrollo) | `true` |
| `MONGO_INITDB_ROOT_USERNAME` | Usuario root de MongoDB para Docker | `admin` |
| `MONGO_INITDB_ROOT_PASSWORD` | Password root de MongoDB para Docker | `password` |
| `ME_CONFIG_BASICAUTH_USERNAME` | Usuario para Mongo Express (opcional) | `admin` |
| `ME_CONFIG_BASICAUTH_PASSWORD` | Password para Mongo Express (opcional) | `password` |

### Formato del MONGODB_URI

```
mongodb://<usuario>:<password>@<host>:<puerto>/<nombre_base_datos>?authSource=admin
```

Ejemplo para desarrollo local con Docker:
```
mongodb://admin:password@localhost:27017/boxful?authSource=admin
```

---

## Ejecución con Docker

1. Asegurarse de tener las variables de entorno configuradas en el archivo `.env`.

2. Iniciar los contenedores de MongoDB y Mongo Express:

```bash
docker compose up -d
```

Esto iniciará:
- MongoDB en el puerto 27017
- Mongo Express (interfaz web para MongoDB) en el puerto 8081

3. Para acceder a Mongo Express, abrir en el navegador:

```
http://localhost:8081
```

Credenciales por defecto:
- Usuario: admin
- Password: password

4. Para detener los contenedores:

```bash
docker compose down
```

5. Para eliminar los contenedores y los datos persistentes:

```bash
docker compose down -v
```

---

## Ejecución del proyecto

### Modo desarrollo

```bash
pnpm start:dev
```

### Modo producción

```bash
pnpm build
pnpm start:prod
```

### Modo debug

```bash
pnpm start:debug
```

La API estará disponible en: `http://localhost:5000` (o el puerto configurado en `PORT`).

---

## Seeder de datos

El proyecto incluye un seeder para poblar la base de datos con los costos de envío configurados por día de la semana.

Para ejecutar el seeder:

```bash
pnpm seed
```

Esto insertará los siguientes costos de envío:

| Día | Costo (USD) |
|-----|-------------|
| Domingo | 1.00 |
| Lunes | 0.50 |
| Martes | 0.70 |
| Miércoles | 0.90 |
| Jueves | 1.25 |
| Viernes | 1.35 |
| Sábado | 1.40 |

Nota: Es necesario ejecutar el seeder antes de crear órdenes para que el cálculo de liquidaciones funcione correctamente.

---

## Documentación de la API

La documentación interactiva de la API está disponible mediante Swagger UI.

URL: `http://localhost:5000/docs`

Desde Swagger UI puedes:
- Explorar todos los endpoints disponibles
- Ver los esquemas de request y response
- Probar los endpoints directamente desde el navegador
- Autenticarte con JWT para probar endpoints protegidos

### Autenticación en Swagger

1. Registrar un usuario en `POST /users`
2. Iniciar sesión en `POST /auth/login` para obtener el token JWT
3. Hacer clic en el botón "Authorize" en Swagger
4. Ingresar el token en el formato: `<token>`
5. Los endpoints protegidos ahora estarán disponibles

### Endpoint de JSON Schema

```
http://localhost:5000/swagger/json
```

---

## Estructura del proyecto

```
src/
  auth/                    # Módulo de autenticación
    decorators/            # Decoradores personalizados
    guards/                # Guards de autenticacion
    models/                # Modelos de datos
    strategies/            # Estrategias de Passport
  config/                  # Configuraciones de la aplicación
  database/                # Configuración de base de datos y seeders
    seeds/                 # Scripts de seeding
  orders/                  # Módulo de órdenes
    dto/                   # Data Transfer Objects
    entities/              # Entidades de base de datos
    enums/                 # Enumeraciones
  shipping-costs/          # Módulo de costos de envío
    entities/              # Entidades de costos
  users/                   # Módulo de usuarios
    dto/                   # Data Transfer Objects
    entities/              # Entidades de usuarios
test/                      # Tests e2e
```

---

## Funcionalidades implementadas

### Autenticación
- Registro de usuarios
- Inicio de sesión con JWT
- Protección de rutas con guards

### Gestión de órdenes
- Crear órdenes con información del cliente y paquetes
- Soporte para órdenes COD (Cobro Contra Entrega)
- Historial de órdenes con filtros y paginación
- Actualización de estado vía Webhook
- Ordenamiento descendente por fecha

### Costos de envío
- Configuración de costos por día de la semana
- Seeder para datos iniciales

### Cálculo de liquidaciones
- Cálculo automático al marcar orden como entregada
- Aplicación de comisión COD (0.01% con tope de $25 USD)
- Soporte para montos positivos y negativos

---

## Características extras

- Documentación completa con Swagger/OpenAPI
- Validación robusta de datos con class-validator
- Rate limiting para protección contra ataques
- Configuración de CORS
- Helmet para seguridad de headers HTTP
- Arquitectura modular y escalable
- Docker Compose para desarrollo local

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Iniciar la aplicación |
| `pnpm start:dev` | Iniciar en modo desarrollo con hot-reload |
| `pnpm start:debug` | Iniciar en modo debug |
| `pnpm start:prod` | Iniciar en modo producción |
| `pnpm build` | Compilar el proyecto |
| `pnpm seed` | Ejecutar el seeder de datos |
| `pnpm test` | Ejecutar tests unitarios |
| `pnpm test:e2e` | Ejecutar tests end-to-end |
| `pnpm test:cov` | Ejecutar tests con cobertura |
| `pnpm lint` | Ejecutar linter |
| `pnpm format` | Formatear codigo |

---

## Tecnologías utilizadas

- NestJS v11
- TypeORM
- MongoDB v8
- Passport + JWT
- Swagger/OpenAPI
- Docker + Docker Compose
- pnpm
