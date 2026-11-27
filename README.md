# Transporte

Sistema de solicitudes de transporte para Wilson.

## Deploy

- Frontend: GitHub Pages mediante GitHub Actions.
- Backend: Google Apps Script conectado a Google Sheets.
- URL pública: https://facturacion-jpg.github.io/Transporte/

El workflow `.github/workflows/deploy.yml` compila automáticamente en cada push a `main`.

En GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

La URL de Apps Script está como valor por defecto en `src/api/api.js` porque es un
endpoint público. Opcionalmente se puede sobrescribir con la variable de entorno
`VITE_APPS_SCRIPT_URL` (en local, en `.env`; en GitHub, como secret o variable).
