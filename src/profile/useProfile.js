import { useEffect, useMemo, useState } from "react";
import { ensureProfileInitialized, loadProfile, saveProfile } from "./profileStorage";

export function useProfile({ userKey, email, defaultName, defaultPhoto }) {
  const stableKey = useMemo(() => String(userKey ?? ""), [userKey]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!stableKey) return;

    const initialized = ensureProfileInitialized({
      userKey: stableKey,
      email,
      defaultName,
      defaultPhoto,
    });
    setProfile(initialized);

    const onStorage = (e) => {
      if (e.key !== `profile:v1:${stableKey}`) return;
      setProfile(loadProfile(stableKey));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [defaultName, defaultPhoto, email, stableKey]);

  const updateProfile = (next) => {
    if (!stableKey) return;
    const saved = saveProfile(stableKey, next);
    setProfile(saved);
  };

  return { profile, updateProfile };
}
