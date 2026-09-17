# LPS Twitch — adopción y entrega Stream Avatars

## Flujo

1. El viewer pone nick de Twitch + código en la web.
2. Apps Script (proyecto **nuevo**, no el del album) valida el código en la hoja `TWITCH`, escribe `adopter` y deja `deliveryStatus=pending`.
3. El Lua de Stream Avatars pide `claimNext`, ejecuta `!gift nick avatar saId` y confirma `delivered`.

Los puntos del canal se canjean a mano (vos das el código). La web no descuenta moneda de Stream Avatars.

## Columnas nuevas en `TWITCH` (el script las crea solo)

| Columna | Uso |
|---|---|
| `saId` | ID/nombre exacto del avatar en Stream Avatars (**la tenés que llenar vos**) |
| `adoptionId` | `TW-{id}` |
| `twitchName` | nick normalizado |
| `deliveryStatus` | `pending` / `processing` / `delivered` / `error` |
| `adoptedAt` | fecha de canje |
| `deliveredAt` | fecha de `!gift` |
| `deliveryAttempts` | reintentos |
| `lastError` | último error |
| `processingAt` | reserva temporal |

No borra `id`, `code`, `adopter`, `price` ni el resto.

`Nombre exacto` en la hoja hoy tiene animaciones (`idle`, `run`, `sit`). **No** se usa como ID de avatar. Poné el ID real en `saId`.

## Desplegar Apps Script

1. Abrí la Google Sheet del album.
2. Extensiones → Apps Script → **proyecto nuevo** (no toques el script del album).
3. Pegá `apps-script/TwitchAdoption.gs`.
4. Project Settings → Script properties:
   - `SHARED_SECRET` = un string largo random
   - `AUTOMATION_ENABLED` = `true`
5. Deploy → New deployment → Type: **Web app**
   - Execute as: Me
   - Who has access: Anyone
6. Copiá la URL `/exec`.
7. Pegala en `src/data/adoptConfig.ts` (`ADOPT_SCRIPT_URL`) y redeploy/push de la web.
8. La misma URL va en el Lua (`APPS_SCRIPT_URL`).

## Instalar el Lua

1. En Stream Avatars, Custom Command / Script → Run as **On Connect**.
2. Pegá `stream-avatars/gift-adoptions.lua`.
3. Completá `APPS_SCRIPT_URL`, `SHARED_SECRET`, `POLL_INTERVAL`.
4. Connect. F5 recarga el script.

Los pets en SA: Gift only, costo 0.

## Probar con un pet

1. Llená `saId` de un pet de prueba.
2. Usá su `code` en la web con un nick de Twitch de prueba.
3. En la hoja: `adopter` + `pending`.
4. Con SA conectado, en ≤ 12s debería pasar a `processing` y luego `delivered`.
5. El nick debería ver el pet en My Avatars.

## Reintentar un error

En `TWITCH`, esa fila: `deliveryStatus` → `pending` (o dejala en `error` si `deliveryAttempts` < 5). El Lua la vuelve a tomar.

## Apagar la automatización

Script property `AUTOMATION_ENABLED` = `false`. La web sigue canjeando códigos; no se envían gifts.

## Secreto

Nunca en el frontend. Solo Script properties + el Lua local (no lo subas con el valor real).
