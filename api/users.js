// User search endpoint for Vercel (frontend-root deploys).
// Verifies Auth0 bearer token and queries Auth0 Management API.

const { createRemoteJWKSet, jwtVerify } = require("jose");

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

let jwks = null;
let mgmtTokenCache = null;

async function verifyAuth0Token(req) {
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

async function getMgmtToken() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_MGMT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET;
  const audience =
    process.env.AUTH0_MGMT_AUDIENCE || `https://${domain}/api/v2/`;

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Auth0 Management API credentials not configured");
  }

  const now = Date.now();
  if (mgmtTokenCache && mgmtTokenCache.expiresAt > now + 30_000) {
    return mgmtTokenCache.token;
  }

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth0 mgmt token failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data.access_token || !data.expires_in) {
    throw new Error("Invalid mgmt token response");
  }

  mgmtTokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return mgmtTokenCache.token;
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
    await verifyAuth0Token(req);
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters" });
    }

    const mgmtToken = await getMgmtToken();
    const domain = process.env.AUTH0_DOMAIN;
    const searchUrl = new URL(`https://${domain}/api/v2/users`);
    searchUrl.searchParams.set(
      "q",
      `name:${q}* OR email:${q}*`
    );
    searchUrl.searchParams.set("search_engine", "v3");
    searchUrl.searchParams.set("per_page", "5");

    const resp = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${mgmtToken}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Auth0 search failed: ${resp.status} ${text}`);
    }

    const users = await resp.json();
    const results = (users || []).map((u) => {
      const email = u.email || "";
      const sub = u.user_id || "";
      const userId = sanitizeUserId(email || sub);
      return {
        userId,
        name: u.name || email || sub,
        email,
        picture: u.picture || "",
      };
    });

    return res.status(200).json({ results });
  } catch (e) {
    const status = e.message?.includes("Missing Authorization") ? 401 : 500;
    return res.status(status).json({ error: e.message || "User search failed" });
  }
};
