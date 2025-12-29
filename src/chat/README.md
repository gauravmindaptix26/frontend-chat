## ZegoCloud Chat (ZIM)

This app uses **ZegoCloud ZIM (Instant Messaging)** for real-time chat.

### Required environment variables

- `VITE_ZEGO_APP_ID` (number)
- `VITE_ZEGO_TOKEN_ENDPOINT` (URL) — must return a ZIM token for a given `userID`
- (Optional) `VITE_ZEGO_ROOM_ID` (default: `global`)

Example `.env`:

```bash
VITE_ZEGO_APP_ID=123456789
VITE_ZEGO_TOKEN_ENDPOINT=http://localhost:3001/api/token
VITE_ZEGO_ROOM_ID=global
```

### Token endpoint contract

The frontend calls:

`GET {VITE_ZEGO_TOKEN_ENDPOINT}?userID=<userID>`

Expected response:

```json
{ "token": "YOUR_ZEGO_ZIM_TOKEN" }
```

Notes:
- Do **not** generate tokens in the browser (it requires your Zego server secret).
- Implement token generation on a backend (Node/Express, etc.) using Zego's official token generation method.
