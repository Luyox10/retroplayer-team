# RetroPlayer Frontend

Aplicación React con dos builds independientes: **usuario** y **administrador**. El punto de entrada `src/index.js` carga `src/user/App.js` o `src/admin/App.js` según la variable `REACT_APP_TARGET`.

## Estructura

```
frontend/
├── public/                 # archivos estáticos
├── src/
│   ├── index.js            # carga dinámica user / admin
│   ├── index.css           # estilos globales
│   ├── admin/              # frontend administrativo
│   │   ├── components/     # AdminHeader, AdminSidebar, AdminFooter
│   │   ├── contexts/       # AdminAuthContext
│   │   ├── layouts/        # AdminLayout
│   │   ├── pages/          # Dashboard, Users, Products, Environments, RoomObjects, Reports, Stats, AdminLogin
│   │   ├── router/         # AppRouter, RequireAdmin
│   │   └── services/       # llamadas a /api/admin/* y auth
│   ├── user/               # frontend público
│   │   ├── components/     # Header, Sidebar, Footer + room/
│   │   ├── contexts/       # AuthContext
│   │   ├── layouts/        # MainLayout
│   │   ├── pages/          # Home, Explore, Library, Store, Profile, Room, Login, Register
│   │   ├── router/         # AppRouter, RequireAuth
│   │   └── services/       # llamadas a API pública
│   └── shared/             # utilidades comunes
│       └── utils/api.js    # fetch centralizado con token y manejo de errores
```

## Variables de entorno

Crear `.env` a partir de `.env.example`:

```env
REACT_APP_API_URL=http://localhost:3000
```

En Render:

- **User frontend**: `REACT_APP_TARGET=user` y `REACT_APP_API_URL=<backend>`
- **Admin frontend**: `REACT_APP_TARGET=admin` y `REACT_APP_API_URL=<backend>`

## Scripts

```bash
# Desarrollo
npm start                  # user en localhost:3001
npm run start:admin        # admin en localhost:3002

# Producción
npm run build              # build user
npm run build:admin        # build admin
```

## Arquitectura

- **React Router DOM v7** con `HashRouter` para compatibilidad con static hosting.
- **Context API**: `AuthContext` (user) y `AdminAuthContext` (admin) gestionan sesión y token.
- **Fetch API** centralizada en `src/shared/utils/api.js`: lee `REACT_APP_API_URL`, añade `Authorization: Bearer <token>` y normaliza respuestas `{ data }`.
- **Servicios**: cada módulo tiene funciones asincrónicas que consumen endpoints del backend.
- **Responsive**: layouts con sidebar fijo, media queries para móviles, grids de tarjetas y tablas adaptables.
- **Estados vacíos/loading**: cada página maneja `loading`, `error` y mensajes cuando no hay datos.

## Endpoints consumidos

### User
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/profile`
- `/api/explore`, `/api/explore/recommended`, `/api/explore/tracks/:id`
- `/api/featured-tracks`
- `/api/favorites`, `/api/history`
- `/api/products`, `/api/orders`
- `/api/environments/free`, `/api/environments/:id`

### Admin
- `/api/auth/login`, `/api/auth/me`
- `/api/admin/dashboard`
- `/api/admin/users`, `/api/admin/users/:id/status`
- `/api/admin/products`
- `/api/admin/environments`
- `/api/admin/room-objects`
- `/api/admin/reports`

## Puntos de extensión (preparados, no implementados)

- **Google Auth**: agregar un `GoogleAuthProvider` y flujo en `AuthContext`; reutilizar `setSession`.
- **Imágenes finales del diseñador**: reemplazar placeholders de CSS por `img` con `src` desde `image_url` del backend.
- **Nuevos ambientes**: el módulo `roomService.js` y `Room.js` ya consumen `/api/environments/free` y `/api/environments/:id`.
- **Nuevos objetos comercializables**: el `PlaybackPanel` y la tienda cargan dinámicamente productos y objetos desde `/api/products` y `/api/admin/room-objects`.

## Despliegue en Render

1. Crear dos sitios estáticos (user y admin).
2. Build commands:
   - User: `npm run build`
   - Admin: `npm run build:admin`
3. Publish directory: `build`.
4. Agregar `REACT_APP_API_URL` con la URL del backend desplegado.

## Notas

- El token JWT se guarda en `localStorage` y se inyecta automáticamente en cada request.
- El `REACT_APP_TARGET` controla qué build se genera; no se requiere cambiar código entre despliegues.
- Los componentes de la sala (`Television`, `Turntable`, `Lamp`, `Visualizer`) usan elementos temporales en CSS, listos para ser reemplazados por imágenes/modelos finales.
