import React from "react";
import { useLongPress } from "../hooks/useLongPress";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MessageBubble({
  msg,
  isSelf,
  selfUserID,
  onOpenPopover,
}) {
  const reply = (() => {
    try {
      if (!msg.extendedData) return null;
      const parsed = JSON.parse(msg.extendedData);
      return parsed?.replyTo ?? null;
    } catch {
      return null;
    }
  })();

  const reactions = msg.reactions ?? [];
  const reactionSummary = reactions.reduce((acc, r) => {
    acc[r.reactionType] = (acc[r.reactionType] ?? 0) + 1;
    return acc;
  }, {});

  const isRead = msg.receiptStatus === 2;
  const isPending = !msg.messageID && !!msg.localMessageID;
  const tick = isPending ? "⏳" : isRead ? "✓✓" : msg.messageID ? "✓" : "⏳";
  const tickColor = isRead ? "text-emerald-300" : "text-white/70";

  const longPressHandlers = useLongPress(
    (_, target) => onOpenPopover?.(target),
    (_, target) => onOpenPopover?.(target),
  );

  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => onOpenPopover?.(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenPopover?.(e.currentTarget);
          }
        }}
        className={`group relative max-w-[75%] rounded-2xl px-4 py-3 transition transform hover:-translate-y-[1px] ${
          isSelf
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            : "bg-white/10 text-white border border-white/10"
        }`}
        {...longPressHandlers}
      >
        {!isSelf && (
          <div className="text-xs text-purple-200 mb-1 break-all">
            {msg.senderUserID}
          </div>
        )}

        {reply && (
          <div className="text-xs text-purple-200 mb-2 border-l-2 border-white/30 pl-2">
            Replying to: {reply.text ?? ""}
          </div>
        )}

        <div
          className={`whitespace-pre-wrap break-words ${
            msg.revoked ? "italic text-purple-200" : ""
          }`}
        >
          {msg.revoked ? "Message deleted" : msg.message}
        </div>

        <div
          className={`text-[11px] mt-1 flex items-center gap-2 ${
            isSelf ? "text-white/80" : "text-purple-200"
          }`}
        >
          {formatTime(msg.timestamp)}
          {isSelf && <span className={tickColor}>{tick}</span>}
        </div>

        {Object.keys(reactionSummary).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {Object.entries(reactionSummary).map(([emoji, count]) => {
              const isMine = reactions.some(
                (r) => r.reactionType === emoji && r.userID === selfUserID,
              );
              return (
                <span
                  key={`${msg.messageID ?? msg.localMessageID}-${emoji}`}
                  className={`px-2 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-1 ${
                    isMine ? "ring-1 ring-white/60" : ""
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px]">{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
