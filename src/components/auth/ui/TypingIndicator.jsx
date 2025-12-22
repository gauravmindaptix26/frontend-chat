import React, { useEffect, useState } from "react";

const TypingIndicator = ({ delay }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!show) return null;

  return (
    <div className="flex space-x-1 bg-white/90 px-4 py-3 rounded-3xl shadow-lg">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
