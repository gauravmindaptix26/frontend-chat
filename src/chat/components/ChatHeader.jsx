import React from "react";

export default function ChatHeader({ title, subtitle, onLogout, photo, typingLabel }) {
  return (
    <header className="px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur flex items-center gap-4">
      {photo ? (
        <img
          src={photo}
          alt={title ?? "chat"}
          className="h-12 w-12 rounded-full object-cover border border-white/10"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-semibold">
          {title?.[0]?.toUpperCase() ?? "C"}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-semibold text-lg truncate">{title ?? "Select a chat"}</div>
        <div className="text-sm text-purple-200 truncate">
          {typingLabel || subtitle || ""}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="ml-auto px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition"
      >
        Logout
      </button>
    </header>
  );
}
