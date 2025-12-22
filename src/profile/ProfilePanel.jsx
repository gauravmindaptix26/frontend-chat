import React, { useMemo, useState } from "react";

const initials = (name) => {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

const Avatar = ({ photo, name }) => {
  if (photo) {
    return (
      <img
        src={photo}
        alt="Profile"
        className="w-12 h-12 rounded-2xl object-cover border border-white/10"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-semibold">
      {initials(name)}
    </div>
  );
};

export default function ProfilePanel({ profile, onSave, onClose }) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [photo, setPhoto] = useState(profile?.photo ?? "");
  const [error, setError] = useState("");

  const canSave = useMemo(() => {
    const nameOk = String(displayName ?? "").trim().length >= 2;
    return nameOk;
  }, [displayName]);

  const onPickPhoto = async (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Image too large. Please use an image under 1MB.");
      return;
    }

    const reader = new FileReader();
    const result = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    if (typeof result === "string") setPhoto(result);
  };

  const save = () => {
    setError("");
    const name = String(displayName ?? "").trim();
    if (name.length < 2) {
      setError("Please enter a valid name.");
      return;
    }

    onSave?.({
      ...profile,
      displayName: name,
      photo,
    });
    onClose?.();
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar photo={photo} name={displayName} />
          <div className="min-w-0">
            <div className="text-white font-semibold truncate">Profile</div>
            <div className="text-purple-200 text-sm truncate">
              Save your name and photo
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-purple-200 hover:text-white transition text-sm"
        >
          Close
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <div className="text-sm text-purple-200 mb-1">Display name</div>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-white/10 text-white placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
            placeholder="Enter your name"
          />
        </label>

        <label className="block">
          <div className="text-sm text-purple-200 mb-1">Profile photo</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
            className="block w-full text-sm text-purple-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/15"
          />
        </label>

        {error && <div className="text-red-200 text-sm">{error}</div>}

        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50"
        >
          Save profile
        </button>
      </div>
    </div>
  );
}

