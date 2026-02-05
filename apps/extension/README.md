# Aschedual Extension Placeholder

This folder intentionally contains only a minimal MV3 scaffold.

## Current scope
- Manifest scaffold only
- No popup/background/content implementation in this repo phase

## Planned handshake contract
1. Extension opens `${APP_URL}/extension/connect`.
2. User signs in if needed.
3. Web app mints short-lived token via `POST /api/extension/token`.
4. Web page posts `{ source: "aschedual-extension-connect", token }` with `window.postMessage`.
5. Extension stores token and uses Bearer auth for API calls.

## Canonical settings URL
The extension should open `${APP_URL}/settings/integrations?source=extension`.
