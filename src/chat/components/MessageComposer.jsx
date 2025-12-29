import React, { useEffect, useRef, useState } from "react";
import { ZIMMessageType } from "../zego/zimConstants";

export default function MessageComposer({ onSend, disabled, onTyping }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText("");
    await onSend?.({
      type: ZIMMessageType.Text,
      message: trimmed,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="px-6 pb-5 pt-3 border-t border-white/10 bg-white/5 backdrop-blur"
    >
      <div className="flex items-end gap-3">
        <button
          type="button"
          className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          aria-label="Add emoji"
        >
          🙂
        </button>
        <button
          type="button"
          className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          aria-label="Attach file"
        >
          📎
        </button>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={disabled ? "Connecting..." : "Type a message..."}
            className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none resize-none"
          />
        </div>
        <button
          type="submit"
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="h-11 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-900/30 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.99] transition"
        >
          Send
        </button>
      </div>
    </form>
  );
}
