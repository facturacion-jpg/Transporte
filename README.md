# Transporte

Sistema de solicitudes de transporte para Wilson.

## Deploy

- Frontend: GitHub Pages mediante GitHub Actions.
- Backend: Google Apps Script conectado a Google Sheets.
- URL pública: https://facturacion-jpg.github.io/Transporte/

El workflow `.github/workflows/deploy.yml` compila con el secreto
`VITE_APPS_SCRIPT_URL`, que debe configurarse en
**Settings → Secrets and variables → Actions**.

En GitHub: **Settings → Pages → Source → GitHub Actions**.
