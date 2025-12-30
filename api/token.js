// Standalone token endpoint for Vercel (frontend-root deploys).
// Generates a Zego token after verifying the Auth0 bearer token.

const crypto = require("node:crypto");

let joseModule = null;
async function getJose() {
  if (joseModule) return joseModule;
  joseModule = await import("jose");
  return joseModule;
}

const sanitizeUserId = (raw) =>
  String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._@-]/g, "_")
    .slice(0, 64);

const getAllowedOrigin = (req) => {
  const configured = process.env.FRONTEND_ORIGIN || "*";
  const origins = configured
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.includes("*")) return "*";
  const reqOrigin = req.headers.origin;
  if (reqOrigin && origins.includes(reqOrigin)) return reqOrigin;
  return origins[0] || "*";
};

function rndNum(min, max) {
  return Math.ceil(min + (max - min) * Math.random());
}

function makeRandomIv() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const result = [];
  for (let i = 0; i < 16; i++) result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  return result.join("");
}

function getAlgorithm(secretStr) {
  const keyLen = Buffer.from(secretStr).length;
  if (keyLen === 16) return "aes-128-cbc";
  if (keyLen === 24) return "aes-192-cbc";
  if (keyLen === 32) return "aes-256-cbc";
  throw new Error("ZEGO_SERVER_SECRET must be 16/24/32 bytes (usually 32 chars)");
}

function aesEncrypt(plainText, secret, iv) {
  const algorithm = getAlgorithm(secret);
  const key = Buffer.from(secret);
  const ivBuf = Buffer.from(iv);
  const cipher = crypto.createCipheriv(algorithm, key, ivBuf);
  return Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
}

// Token04 generator (per Zego docs)
function generateToken04(appId, userID, secret, effectiveTimeInSeconds, payload = "") {
  if (!appId || typeof appId !== "number") throw new Error("appID invalid");
  if (!userID || typeof userID !== "string") throw new Error("userID invalid");
  if (!secret || typeof secret !== "string") throw new Error("secret invalid");
  if (!effectiveTimeInSeconds || typeof effectiveTimeInSeconds !== "number")
    throw new Error("effectiveTimeInSeconds invalid");

  const createTime = Math.floor(Date.now() / 1000);

  const tokenInfo = {
    app_id: appId,
    user_id: userID,
    nonce: rndNum(-2147483648, 2147483647),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload: payload || "",
  };

  const plainText = JSON.stringify(tokenInfo);
  const iv = makeRandomIv();
  const encryptBuf = aesEncrypt(plainText, secret, iv);

  const b1 = new Uint8Array(8);
  const b2 = new Uint8Array(2);
  const b3 = new Uint8Array(2);

  new DataView(b1.buffer).setBigInt64(0, BigInt(tokenInfo.expire), false);
  new DataView(b2.buffer).setUint16(0, iv.length, false);
  new DataView(b3.buffer).setUint16(0, encryptBuf.byteLength, false);

  const buf = Buffer.concat([
    Buffer.from(b1),
    Buffer.from(b2),
    Buffer.from(iv),
    Buffer.from(b3),
    Buffer.from(encryptBuf),
  ]);

  return "04" + buf.toString("base64");
}

function buildZegoToken(userID) {
  const appId = Number(process.env.ZEGO_APP_ID);
  const secret = process.env.ZEGO_SERVER_SECRET;
  const expireSeconds = Number(process.env.ZEGO_TOKEN_EXPIRE_SECONDS || 3600);

  if (!appId) throw new Error("ZEGO_APP_ID missing/invalid");
  if (!secret) throw new Error("ZEGO_SERVER_SECRET missing");

  return generateToken04(appId, userID, secret, expireSeconds, "");
}

let jwks = null;

async function verifyAuth0Token(req) {
  const { createRemoteJWKSet, jwtVerify } = await getJose();
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new Error("Missing Authorization bearer token");

  const domain = process.env.AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE || process.env.AUTH0_CLIENT_ID;
  if (!domain) throw new Error("AUTH0_DOMAIN not configured");
  if (!audience) throw new Error("AUTH0_AUDIENCE or AUTH0_CLIENT_ID not configured");

  const issuer = `https://${domain}/`;
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));
  }

  const { payload } = await jwtVerify(token, jwks, { issuer, audience });
  return payload;
}

module.exports = async function handler(req, res) {
  const origin = getAllowedOrigin(req);
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const claims = await verifyAuth0Token(req);
    const rawUserId = claims.email || claims.sub;
    const userID = sanitizeUserId(rawUserId);

    if (!userID) {
      return res.status(400).json({ error: "Could not derive userID from Auth0 token" });
    }

    const token = buildZegoToken(userID);
    return res.status(200).json({ token, userID });
  } catch (e) {
    const status = e.message?.includes("Missing Authorization") ? 401 : 500;
    return res.status(status).json({ error: e.message || "Token generation failed" });
  }
};
