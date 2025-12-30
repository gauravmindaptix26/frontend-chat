import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import FloatingParticles from "../components/auth/ui/FloatingParticles.jsx";
import AuthForm from "../components/auth/AuthForm.jsx";
import HeroSection from "../components/HeroSection.jsx";

const AuthPage = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      const returnTo = location.state?.from || "/chat";
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, location.state?.from, navigate]);

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
