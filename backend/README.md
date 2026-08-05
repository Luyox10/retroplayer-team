# RetroPlayer — Backend

Infraestructura mínima del backend de RetroPlayer. Servidor HTTP nativo de Node.js, ES Modules y conexión a TiDB Cloud mediante `mysql2/promise`.

## Requisitos

- Node.js `20.x` (definido en `package.json` > `engines`).
- TiDB Cloud Starter (cluster MySQL compatible).
- Render (Web Service).

## Instalación

```bash
cd backend
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores locales:

```bash
cp .env.example .env
```

```text
NODE_ENV=development

APP_PORT=3000

DB_HOST=<host>.us-east-1.tidbcloud.com
DB_PORT=4000
DB_USER=<root o usuario>
DB_PASSWORD=<contraseña>
DB_NAME=retroplayer_dev
DB_SSL=true

FRONTEND_URL=http://localhost:3001
ADMIN_PANEL_URL=http://localhost:3002
```

> `.env` está ignorado por Git. Nunca incluyas credenciales en el código, commits o documentación.

### Variables requeridas en Render

En el panel de Render agrega las siguientes variables de entorno:

- `DB_HOST`
- `DB_PORT` (`4000` por defecto)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL` (`true` en producción)
- `FRONTEND_URL`
- `ADMIN_PANEL_URL`
- `NODE_ENV=production`

No configures `APP_PORT` manualmente en Render salvo que sea necesario; el servidor lee el puerto asignado por la plataforma.

## Comandos

```bash
# Modo desarrollo local
npm run dev

# Modo producción
npm start

# Pruebas
npm test
```

## Estructura relevante

```
backend/
├── package.json
├── .env.example
├── .env
├── README.md
└── src/
    ├── server.js              # Servidor HTTP y graceful shutdown
    ├── router.js              # Enrutador mínimo y CORS
    ├── config/
    │   └── environment.js     # Carga y validación centralizada de env
    ├── database/
    │   └── pool.js            # Pool de mysql2/promise y health check
    ├── utils/
    │   └── response.js        # Utilidades de respuesta JSON
    └── test/
        └── app.test.js        # Pruebas básicas con node:test
```

## Conexión con TiDB Cloud

El pool de conexiones se configura desde `src/config/environment.js`:

- `DB_SSL=true` activa TLS **sin desactivar la validación de certificados**.
- El límite de conexiones es de 10 (suficiente para una beta).
- Las tablas deben crearse manualmente en TiDB Cloud; el backend no ejecuta DDL automáticamente.

### Comprobación de salud

- `GET /` — Mensaje de bienvenida.
- `GET /api/health` — Estado del proceso Node.js (Render health check).
- `GET /api/health/database` — Verifica conexión a TiDB.

## Despliegue en Render

1. Crear un nuevo **Web Service**.
2. Conectar el repositorio.
3. Configurar:

| Campo | Valor |
|---|---|
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

4. Agregar las variables de entorno listadas arriba.
5. Desplegar. Render usará el `APP_PORT` asignado automáticamente.

## Problemas frecuentes

- **Tarda en arrancar**: el health check de `/api/health/database` consulta TiDB; para Render usa `/api/health`.
- **Errores TLS**: asegúrate de que `DB_SSL=true` y que el certificado del host sea válido; no uses `rejectUnauthorized: false`.
- **Variables no encontradas**: `src/config/environment.js` valida las obligatorias al inicio y lanza un error claro.

## Medidas de seguridad

- `mysql2` con TLS activado y validación de certificado habilitada.
- Credenciales centralizadas en `environment.js`; no se accede a `process.env` desde otros módulos.
- `.env` y `.env.*` ignorados por Git (excepto `.env.example`).
- Respuestas de error controladas sin exponer secretos ni stack traces sensibles.
