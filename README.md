# Flowo

Un solo lugar para tirar ideas (braindump), convertirlas en pendientes con etiquetas y frecuencia, y dar seguimiento a hábitos diarios.

Este repositorio contiene:

- `index.html`, `css/`, `js/` — el sitio (frontend). Funciona solo, sin backend, guardando todo en el navegador (`localStorage`).
- `backend/` — una API REST opcional en Node/Express, por si más adelante quieres que tus datos vivan en un servidor y no solo en tu navegador.

## 1. Probarlo en tu computadora

No necesitas instalar nada para el frontend. Dos opciones:

**Opción A — abrir el archivo directo**
Haz doble clic en `index.html`. Funciona, pero algunos navegadores son estrictos con `localStorage` al abrir archivos directamente.

**Opción B — servidor local rápido (recomendado)**
Con Python instalado, desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` en tu navegador.

## 2. Publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `flowo`).
2. Sube todos estos archivos a la rama `main`.
3. En el repositorio, ve a **Settings → Pages**.
4. En "Source", selecciona la rama `main` y la carpeta `/ (root)`.
5. Guarda. En unos minutos tu sitio estará en algo como:
   `https://tu-usuario.github.io/flowo/`

Con esto ya tienes la página pública y funcional (usando `localStorage`, cada persona que la visite tiene sus propios datos guardados solo en su navegador).

## 3. El backend (opcional, para cuando quieras sincronizar entre dispositivos)

`backend/` es una API REST pequeña con tres recursos: `notes`, `tasks` y `habits`, guardados en `backend/data/db.json`.

### Correrlo localmente

```bash
cd backend
npm install
npm start
```

Esto levanta el servidor en `http://localhost:3000` con endpoints como:

- `GET /api/notes` / `POST /api/notes`
- `GET /api/tasks` / `POST /api/tasks` / `PATCH /api/tasks/:id` / `DELETE /api/tasks/:id`
- `GET /api/habits` / `POST /api/habits` / `POST /api/habits/:id/toggle`

### Desplegarlo

GitHub Pages **no** puede correr este backend (solo sirve archivos estáticos). Para tenerlo en línea, despliega la carpeta `backend/` en un servicio gratuito como:

- [Render](https://render.com) (Web Service, build command `npm install`, start command `npm start`)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)

### Conectar el frontend con el backend

Por ahora, `js/storage.js` guarda todo en `localStorage` y el frontend funciona de forma independiente. Cuando quieras conectarlo al backend desplegado:

1. En `js/storage.js`, cambia las funciones (`getNotes`, `addNote`, etc.) para que hagan `fetch` a tu URL del backend en lugar de leer/escribir `localStorage`. Por ejemplo:

   ```js
   const API_URL = 'https://tu-backend.onrender.com';

   async function getNotes() {
     const res = await fetch(`${API_URL}/api/notes`);
     return res.json();
   }
   ```

2. El resto de `app.js` no necesita cambios — ya está separado de `storage.js` justo para que esta migración sea sencilla.

## Estructura del proyecto

```
flowo/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── storage.js   ← capa de datos (localStorage hoy, API después)
│   └── app.js        ← interacciones de la interfaz
├── backend/
│   ├── server.js
│   ├── package.json
│   └── data/
│       ├── db.json          (ignorado por git, se crea solo)
│       └── db.example.json
└── README.md
```

## Accesibilidad

- Navegación por teclado completa: tabs, formularios y el diálogo de "convertir en pendiente" (con `Escape` para cerrar y foco atrapado dentro del diálogo).
- Enlace "Saltar al contenido principal" para usuarios de lector de pantalla.
- Contraste de color verificado en modo claro y oscuro (botón en la esquina superior derecha).
- Mensajes de estado (`role="status"`) cuando se guarda una idea.
- Respeta `prefers-reduced-motion` y `prefers-color-scheme`.

## Próximos pasos sugeridos

1. Conectar Google Calendar para que los pendientes con fecha aparezcan ahí automáticamente.
2. Notificaciones para ideas del braindump sin organizar después de X días.
3. Vista de calendario para los pendientes (diario/semanal/mensual/anual).
4. Migrar `backend/data/db.json` a una base de datos real (Postgres/Supabase) si vas a tener muchos usuarios.
5. Autenticación (login) si quieres que cada persona tenga su propia cuenta.
