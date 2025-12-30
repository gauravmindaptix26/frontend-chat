export async function fetchZegoToken({ authToken }) {
  const envEndpoint = import.meta.env.VITE_ZEGO_TOKEN_ENDPOINT;
  const endpoint =
    envEndpoint && envEndpoint.trim()
      ? envEndpoint.trim()
      : typeof window !== "undefined"
        ? `${window.location.origin.replace(/\/$/, "")}/api/token`
        : "";
  if (!endpoint) throw new Error("Missing token endpoint (set VITE_ZEGO_TOKEN_ENDPOINT).");

  if (!authToken || typeof authToken !== "string") {
    throw new Error("Missing Auth0 access token for Zego token exchange");
  }

  const url = new URL(endpoint, typeof window !== "undefined" ? window.location.origin : undefined);

  let res;
  try {
    res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch (err) {
    const origin = typeof window !== "undefined" ? window.location.origin : "server";
    throw new Error(
      `Token API network error from ${origin} to ${url.toString()}: ${err?.message || err}`,
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token API failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data?.token || typeof data.token !== "string") {
    throw new Error("Token API did not return a valid token string");
  }
  return data;
}
