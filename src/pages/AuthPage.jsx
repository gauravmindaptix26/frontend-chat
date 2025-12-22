import React from "react";
import FloatingParticles from "../components/auth/ui/FloatingParticles.jsx";
import AuthForm from "../components/auth/AuthForm.jsx";
import HeroSection from "../components/HeroSection.jsx";

const AuthPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative">
      <FloatingParticles />

      <div className="max-w-6xl w-full bg-white/10 backdrop-blur-xl rounded-3xl flex flex-col lg:flex-row overflow-hidden">
        <AuthForm />
        <HeroSection />
      </div>
    </div>
  );
};

export default AuthPage;
