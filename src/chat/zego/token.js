export async function fetchZegoToken(userID) {
  const endpoint = import.meta.env.VITE_ZEGO_TOKEN_ENDPOINT;
  if (!endpoint) throw new Error("Missing VITE_ZEGO_TOKEN_ENDPOINT in frontend/.env");

  // ✅ HARD GUARD: userID must be string
  if (typeof userID !== "string") {
    throw new Error(`userID must be a string, got: ${typeof userID}`);
  }

  const cleanUserID = userID.trim();
  if (!cleanUserID) throw new Error("userID is empty");

  const url = `${endpoint}?userID=${encodeURIComponent(cleanUserID)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token API failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data?.token || typeof data.token !== "string") {
    throw new Error("Token API did not return a valid token string");
  }
  return data.token;
}
