const PREFIX = "profile:v1:";

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export function getProfileStorageKey(userKey) {
  return `${PREFIX}${userKey}`;
}

export function loadProfile(userKey) {
  const raw = localStorage.getItem(getProfileStorageKey(userKey));
  const parsed = safeParse(raw);
  if (!parsed) return null;

  return {
    email: typeof parsed.email === "string" ? parsed.email : "",
    displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
    photo: typeof parsed.photo === "string" ? parsed.photo : "",
    updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
  };
}

export function saveProfile(userKey, profile) {
  const payload = {
    email: profile.email ?? "",
    displayName: profile.displayName ?? "",
    photo: profile.photo ?? "",
    updatedAt: Date.now(),
  };
  localStorage.setItem(getProfileStorageKey(userKey), JSON.stringify(payload));
  return payload;
}

export function ensureProfileInitialized({
  userKey,
  email,
  defaultName,
  defaultPhoto,
}) {
  const existing = loadProfile(userKey);
  if (existing) return existing;

  const derivedName =
    (defaultName && String(defaultName).trim()) ||
    (email ? String(email).split("@")[0] : "") ||
    "User";

  return saveProfile(userKey, {
    email: String(email ?? ""),
    displayName: derivedName,
    photo: String(defaultPhoto ?? ""),
  });
}
