import React from "react";
import { ZIMMessageType } from "../zego/zimConstants";

const previewText = (message) => {
  if (!message) return "";
  if (message.type === ZIMMessageType.Text) return message.message;
  return "New message";
};

const ConversationListItem = ({
  title,
  subtitle,
  active,
  unreadCount,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
        active
          ? "bg-white/15 border-white/20"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-white font-medium truncate">{title}</div>
          <div className="text-purple-200 text-sm truncate">
            {subtitle || " "}
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="shrink-0 text-xs px-2 py-1 rounded-full bg-pink-500/90 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </div>
    </button>
  );
};

export default ConversationListItem;
export { previewText };
