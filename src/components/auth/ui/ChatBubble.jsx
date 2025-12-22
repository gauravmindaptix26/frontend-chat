import React, { useEffect, useState } from "react";

const ChatBubble = ({ text, isUser, delay }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} transition-all duration-700 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className={`px-6 py-3 rounded-3xl shadow-lg max-w-xs ${
          isUser
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            : "bg-white/90 text-gray-800"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;
