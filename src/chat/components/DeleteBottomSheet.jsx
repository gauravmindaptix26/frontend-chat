import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export default function DeleteBottomSheet({ message, onClose, onDelete }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!message) return null;
  const isSelf = message?.isSelf;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
      <div
        className="w-full max-w-md rounded-t-2xl bg-[#181526] text-white p-4 space-y-3"
        ref={sheetRef}
      >
        <div className="h-1 w-12 bg-white/20 rounded-full mx-auto" />
        <div className="text-center text-sm text-white/70">Delete this message?</div>
        <button
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
          onClick={() => onDelete?.("me")}
        >
          Delete for me
        </button>
        {isSelf && (
          <button
            className="w-full py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white focus:outline-none focus:ring-2 focus:ring-red-300/60"
            onClick={() => onDelete?.("all")}
          >
            Delete for everyone
          </button>
        )}
        <button
          className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
