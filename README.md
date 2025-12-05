# Frontend de Prueba - Gestión Académica

Pequeño frontend React (Vite) para probar los endpoints del backend `concurrente_moodle`.

Requisitos
- Node.js 16+ (recomendado 18+)
- npm

Instalación y ejecución

```bash
cd gestion-frontend
npm install
npm run dev
```

La app de desarrollo quedará en `http://localhost:5173` (por defecto) y realiza llamadas directas al backend en `http://localhost:8080`.

Endpoints incluidos en la UI
- `GET /api/moodle/config`
- `GET /api/moodle/test`
- `POST /api/moodle/sync/alumnos/all`
- `GET /api/alumnos`
- `GET /api/grupos`
- `GET /api/programas`
- `GET /api/alumnos/{id}` (campo para indicar id)

Notas
- El backend debe estar corriendo en `http://localhost:8080`.
- CORS ya está habilitado en el backend para `/api/**`, así que las llamadas desde este frontend deben funcionar.
