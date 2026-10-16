# Class group listener

The school group does not allow bots. This process signs in as a parent, watches that one group, and posts each new message to the app.

Run it somewhere that stays awake. Render's free web services sleep. Use a **Background Worker**.

## Once, on your computer

1. Open [my.telegram.org](https://my.telegram.org), create an application, and copy the api id and api hash.
2. In this folder, create a `.env` file (it stays on this machine):

```
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
```

3. `npm install` then `npm run login`. Telegram sends a code. The script prints `TELEGRAM_SESSION_STRING`. That string is the parent's login. Do not commit it.

The group id is the negative number Telegram shows for the class (a supergroup looks like `-100…`). The family's invite code is on Setup.

## Render

New **Background Worker**. Root directory: `workers/telegram-userbot`. Build command: `npm install`. Start command: `npm start`.

Environment variables:

| Name | Value |
|---|---|
| `TELEGRAM_API_ID` | Number from my.telegram.org |
| `TELEGRAM_API_HASH` | From my.telegram.org |
| `TELEGRAM_SESSION_STRING` | Printed by `npm run login` |
| `TARGET_CHAT_ID` | The class group id |
| `VERCEL_RECEIVER_URL` | `https://YOUR-APP.vercel.app/api/intake/userbot` |
| `USERBOT_WEBHOOK_SECRET` | Same long random value as on Vercel |
| `FAMILY_INVITE_CODE` | The family's invite code, so the first message can link the group |

On Vercel, set `USERBOT_WEBHOOK_SECRET` to that same value and redeploy.

Photos are posted as base64. One larger than 3.5 MB is skipped so the request fits Vercel's limit. The text is still saved. A photo is not sent to Gemini until a parent presses **Read this photo**.
