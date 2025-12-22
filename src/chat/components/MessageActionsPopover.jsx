import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const PopoverContent = ({
  anchor,
  message,
  onClose,
  onReact,
  onReply,
  onForward,
  onDeleteRequest,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      onClose?.();
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!anchor || !message) return null;

  const style = {
    position: "absolute",
    top: anchor.top - 10,
    left: anchor.left,
    transform: "translate(-10%, -100%)",
    zIndex: 50,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl px-3 py-2 text-white"
    >
      <div className="flex items-center gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="px-2 py-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            onClick={() => onReact?.(message, emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3 text-sm">
        <button
          className="hover:text-purple-100 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md px-1"
          onClick={() => onReply?.(message)}
        >
          Reply
        </button>
        <button
          className="hover:text-purple-100 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md px-1"
          onClick={() => onForward?.(message)}
        >
          Forward
        </button>
        <button
          className="text-red-200 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-200/40 rounded-md px-1"
          onClick={() => onDeleteRequest?.(message)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default function MessageActionsPopover(props) {
  return ReactDOM.createPortal(<PopoverContent {...props} />, document.body);
}
