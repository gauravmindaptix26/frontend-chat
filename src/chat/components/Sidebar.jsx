import React from "react";
import ConversationList from "./ConversationList";

export default function Sidebar({
  profile,
  onEditProfile,
  conversations,
  active,
  onSelect,
  onStartNewChat,
  isConnected,
  typingStatus,
  onSearch,
  searchResults,
  searchLoading,
  searchError,
}) {
  const displayName =
    profile?.displayName?.trim() ||
    (profile?.email ? profile.email.split("@")[0] : "User");
  const photo = profile?.photo;
  return (
    <div className="h-full w-full rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 flex flex-col gap-4 shadow-xl shadow-purple-900/30">
      <div className="flex items-center gap-3">
        {photo ? (
          <img
            src={photo}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-semibold">
            {displayName?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold truncate">{displayName}</div>
          <button
            className="text-xs text-purple-200 hover:text-white"
            onClick={onEditProfile}
          >
            Edit profile
          </button>
        </div>
        <div
          className={`ml-auto text-xs px-2 py-1 rounded-full ${
            isConnected
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-yellow-500/20 text-yellow-200"
          }`}
        >
          {isConnected ? "Online" : "Connecting"}
        </div>
      </div>

      <div>
        <input
          placeholder="Search chats..."
          className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <div className="mt-2 space-y-1">
          {searchLoading && (
            <div className="text-xs text-purple-200">Searching...</div>
          )}
          {searchError && (
            <div className="text-xs text-red-200 break-words">{searchError}</div>
          )}
          {!searchLoading &&
            !searchError &&
            (searchResults || []).map((r) => (
              <button
                key={r.userId || r.email || r.name}
                className="w-full text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-white"
                onClick={() => onStartNewChat?.(r.userId || r.email || r.name)}
                type="button"
              >
                <div className="font-semibold truncate">{r.name || r.email}</div>
                <div className="text-xs text-purple-200 truncate">{r.email}</div>
              </button>
            ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
        <div className="text-xs text-purple-200 mb-2">Start a new chat</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = e.target.elements.newChat?.value;
            if (val?.trim()) onStartNewChat?.(val.trim());
            e.target.reset();
          }}
          className="flex gap-2"
        >
          <input
            name="newChat"
            placeholder="Enter email/userID..."
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm hover:scale-[1.01] transition"
          >
            Chat
          </button>
        </form>
      </div>

      <div className="flex-1 min-h-0">
        <ConversationList
          conversations={conversations}
          active={active}
          onSelect={onSelect}
          typingStatus={typingStatus}
        />
      </div>
    </div>
  );
}
