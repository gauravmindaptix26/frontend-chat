import React from "react";
import { Sparkles } from "lucide-react";
import ChatBubble from "./auth/ui/ChatBubble";
import TypingIndicator from "./auth/ui/TypingIndicator";


const HeroSection = () => {
  return (
    <div className="lg:w-1/2 p-12 flex flex-col justify-center relative">
      <div className="text-center mb-10">
        <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-4 animate-spin-slow" />
        <h2 className="text-3xl font-bold text-white">Connect. Chat. Enjoy.</h2>
        <p className="text-purple-200">Real-time secure chat</p>
      </div>

      <div className="space-y-4">
        <ChatBubble text="Hey! How are you? 👋" delay={500} />
        <ChatBubble text="Awesome chat app 😍" isUser delay={1500} />
        <TypingIndicator delay={2500} />
        <ChatBubble text="Welcome onboard ✨" delay={3500} />
      </div>
    </div>
  );
};

export default HeroSection;
