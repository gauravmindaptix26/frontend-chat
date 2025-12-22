import React from "react";

export default function ConversationList({ conversations = [], active, onSelect, typingStatus }) {
  return (
    <div className="h-full overflow-y-auto space-y-2 pr-1">
      {conversations.map((c) => {
        const isActive = active && active.id === c.id && active.type === c.type;
        const isTyping =
          typingStatus &&
          typingStatus.id === c.id &&
          typingStatus.type === c.type &&
          c.type === 0; // only for peer chats
        return (
          <button
            key={`${c.type}-${c.id}`}
            onClick={() => onSelect?.(c)}
            className={`w-full text-left rounded-2xl px-4 py-3 border transition transform hover:translate-x-1 ${
              isActive
                ? "bg-white/15 border-white/30 shadow-lg shadow-purple-900/40"
                : "bg-white/5 border-white/10 hover:border-white/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-sm font-semibold text-white">
                {c.title?.[0]?.toUpperCase() ?? "C"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{c.title}</div>
                <div className="text-xs text-purple-200 truncate">
                  {isTyping ? "typing..." : c.lastMessage?.message ?? c.subtitle ?? ""}
                </div>
              </div>
              {c.unreadCount > 0 && (
                <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-pink-500 text-white">
                  {c.unreadCount}
                </span>
              )}
            </div>
          </button>
        );
      })}
      {conversations.length === 0 && (
        <div className="text-sm text-purple-200">No conversations yet.</div>
      )}
    </div>
  );
}
