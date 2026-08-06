# RetroPlayer — Guía de pruebas Postman

Base URL: `http://localhost:3000`

## Variables de entorno recomendadas

| Variable | Uso |
|---|---|
| `baseUrl` | `http://localhost:3000` |
| `userToken` | Token de usuario normal (después de `POST /api/auth/login`) |
| `adminToken` | Token de usuario con `role = 'admin'` (después de `POST /api/auth/login`) |

Para crear un admin en TiDB:

```sql
UPDATE users SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';
```

Luego vuelve a hacer login para obtener un token con rol `admin`.

## Cómo probar cada cosa con admin vs usuario

- **Público**: sin autenticación. Pueden probarse desde cualquier pestaña.
- **Usuario**: requiere `Authorization: Bearer {{userToken}}`. Son acciones del perfil, favoritos, historial, órdenes, etc.
- **Admin**: requiere `Authorization: Bearer {{adminToken}}`. Son dashboards, CRUD de contenido, gestión de usuarios, reportes y órdenes.

Si usas el token de usuario en un endpoint de admin, debes esperar `403 FORBIDDEN`.
Si usas un endpoint protegido sin token, debes esperar `401 UNAUTHORIZED`.

---

## 1. Health

| Método | Endpoint | Auth | Notas |
|---|---|---|---|
| GET | `/api/health` | Ninguna | Debe devolver `status: ok` |
| GET | `/api/health/database` | Ninguna | Verifica conexión a TiDB |

---

## 2. Auth

| Método | Endpoint | Auth | Body | Notas |
|---|---|---|---|---|
| POST | `/api/auth/register` | Ninguna | `{"name","email","username","password"}` | Positiva: 201 |
| POST | `/api/auth/login` | Ninguna | `{"email","password"}` | Devuelve `token` |
| POST | `/api/auth/logout` | Usuario | — | Invalida token actual |
| GET | `/api/auth/me` | Usuario | — | Devuelve datos del usuario |

---

## 3. Users

| Método | Endpoint | Auth | Body / Notas |
|---|---|---|---|
| GET | `/api/profile` | Usuario | — |
| PUT | `/api/profile` | Usuario | `{"display_name","avatar_url"}` |

---

## 4. Explore (Jamendo)

| Método | Endpoint | Auth | Params / Notas |
|---|---|---|---|
| GET | `/api/explore?q=rock` | Ninguna | `q`, `limit`, `offset` |
| GET | `/api/explore/tracks/jamendo/:id` | Ninguna | `:id` = `external_track_id` |
| GET | `/api/explore/recommended` | Ninguna | `limit`, `offset` |

---

## 5. YouTube

| Método | Endpoint | Auth | Params / Notas |
|---|---|---|---|
| GET | `/api/youtube/search?q=rock` | Ninguna | `q`, `maxResults` |
| GET | `/api/tracks/jamendo/:id/video` | Ninguna | `:id` = `external_track_id` |

---

## 6. Favorites

| Método | Endpoint | Auth | Body / Notas |
|---|---|---|---|
| GET | `/api/favorites` | Usuario | `limit`, `offset` |
| POST | `/api/favorites` | Usuario | `{"external_track_id","source","title","artist","cover_url"}` |
| DELETE | `/api/favorites/:source/:externalId` | Usuario | Ej: `/api/favorites/jamendo/2067237` |

---

## 7. History

| Método | Endpoint | Auth | Body / Notas |
|---|---|---|---|
| GET | `/api/history` | Usuario | `limit`, `offset` |
| POST | `/api/history` | Usuario | `{"external_track_id","source","title","artist","cover_url","duration_seconds","listened_seconds","completed"}` |
| PUT | `/api/history/:id` | Usuario | `{"listened_seconds","completed"}` |

---

## 8. Featured tracks

| Método | Endpoint | Auth | Params / Notas |
|---|---|---|---|
| GET | `/api/featured-tracks` | Ninguna | `?category=rock` (recommended, retro, electronic, rock, spanish, english, recent) |
| GET | `/api/admin/featured-tracks` | Admin | `limit`, `offset`, `category`, `active` |
| POST | `/api/admin/featured-tracks` | Admin | `{"external_track_id","source","title","artist","cover_url","category","position","active"}` |
| PUT | `/api/admin/featured-tracks/:id` | Admin | Cualquier campo |
| DELETE | `/api/admin/featured-tracks/:id` | Admin | — |

---

## 9. Environments

| Método | Endpoint | Auth | Params / Body |
|---|---|---|---|
| GET | `/api/environments` | Ninguna | `limit`, `offset` |
| GET | `/api/environments/free` | Ninguna | Devuelve 2 ambientes gratuitos |
| GET | `/api/environments/:id` | Ninguna | Incluye objetos posicionados |
| GET | `/api/admin/environments` | Admin | `limit`, `offset`, `status`, `active` |
| POST | `/api/admin/environments` | Admin | `{"name","type","status","image_url","thumbnail_url","price","is_free","is_active","scene_data"}` |
| PUT | `/api/admin/environments/:id` | Admin | Cualquier campo |
| DELETE | `/api/admin/environments/:id` | Admin | — |

---

## 10. Room objects

| Método | Endpoint | Auth | Params / Body |
|---|---|---|---|
| GET | `/api/room-objects` | Ninguna | `limit`, `offset`, `type` |
| GET | `/api/room-objects/:id` | Ninguna | — |
| GET | `/api/admin/room-objects` | Admin | `limit`, `offset`, `status`, `type`, `active` |
| POST | `/api/admin/room-objects` | Admin | `{"name","type","image_url","config","price","is_free","is_active"}` |
| PUT | `/api/admin/room-objects/:id` | Admin | Cualquier campo |
| DELETE | `/api/admin/room-objects/:id` | Admin | — |

---

## 11. Products

| Método | Endpoint | Auth | Params / Body |
|---|---|---|---|
| GET | `/api/products` | Ninguna | `limit`, `offset`, `type` |
| GET | `/api/products/:id` | Ninguna | — |
| GET | `/api/admin/products` | Admin | `limit`, `offset`, `type` |
| POST | `/api/admin/products` | Admin | `{"name","type","description","price","currency","image_url","stock","metadata","is_active"}` |
| PUT | `/api/admin/products/:id` | Admin | Cualquier campo |
| DELETE | `/api/admin/products/:id` | Admin | — |

---

## 12. Orders

| Método | Endpoint | Auth | Body / Notas |
|---|---|---|---|
| POST | `/api/orders` | Usuario | `{"product_id"}`. Total calculado por backend |
| GET | `/api/orders` | Usuario | `limit`, `offset` |
| GET | `/api/orders/:id` | Usuario | Solo ordenes del propio usuario |
| GET | `/api/admin/orders` | Admin | `limit`, `offset`, `status`, `user_id` |
| PUT | `/api/admin/orders/:id` | Admin | `{"status":"paid"}` desbloquea producto en `user_assets` |
| DELETE | `/api/admin/orders/:id` | Admin | — |
| GET | `/api/user/assets` | Usuario | Productos desbloqueados |

---

## 13. Reports

| Método | Endpoint | Auth | Body / Notas |
|---|---|---|---|
| POST | `/api/reports` | Usuario | `{"target_type","target_id","reason"}` |
| GET | `/api/admin/reports` | Admin | `limit`, `offset`, `status`, `target_type` |
| GET | `/api/admin/reports/:id` | Admin | — |
| PUT | `/api/admin/reports/:id` | Admin | `{"status":"resolved"}` |

---

## 14. Admin

| Método | Endpoint | Auth | Notas |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Métricas generales |
| GET | `/api/admin/users` | Admin | `limit`, `offset`, `status`, `role` |
| GET | `/api/admin/users/:id` | Admin | Sin exponer `password_hash` |
| PUT | `/api/admin/users/:id/status` | Admin | `{"status":"suspended"}` (active, suspended, banned) |

---

## Casos de prueba recomendados

### Positivas

- `POST /api/auth/register` con datos válidos → 201
- `POST /api/auth/login` con credenciales válidas → 200 + token
- `POST /api/favorites` con token → 201
- `POST /api/orders` con producto válido → 201
- `PUT /api/admin/orders/:id` con `{"status":"paid"}` → 200 y `user_assets` actualizado
- `GET /api/admin/dashboard` con admin → 200

### Negativas

- `GET /api/products/abc` → 400
- `GET /api/products/999999` → 404
- `POST /api/orders` duplicado → 409
- `POST /api/orders` con producto inexistente → 404
- `POST /api/reports` sin `reason` → 400

### Sin autenticación

- `POST /api/favorites` sin token → 401
- `GET /api/orders` sin token → 401
- `GET /api/admin/dashboard` sin token → 401

### Con rol incorrecto

- `GET /api/admin/users` con token de usuario → 403
- `POST /api/admin/products` con token de usuario → 403
- `PUT /api/admin/users/:id/status` con token de usuario → 403

### Datos inválidos

- `POST /api/auth/register` con email sin `@` → 400
- `POST /api/admin/featured-tracks` con `category` no permitida → 400
- `PUT /api/admin/orders/:id` con `status` desconocido → 400

### Datos duplicados

- `POST /api/auth/register` con email existente → 409
- `POST /api/favorites` repetido → 200 (upsert, no duplicado real)
- `POST /api/orders` mismo producto mientras está `pending` → 409
