import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect,
    logout,
    user,
  } = useAuth0();

  const dbConnection = import.meta.env.VITE_AUTH0_DB_CONNECTION;
  const googleConnection =
    import.meta.env.VITE_AUTH0_GOOGLE_CONNECTION ?? "google-oauth2";
 
  const login = () =>
    loginWithRedirect({
      authorizationParams: dbConnection ? { connection: dbConnection } : {},
      appState: { returnTo: "/chat" },
    });

  const signupWithDb = () =>
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        ...(dbConnection ? { connection: dbConnection } : {}),
      },
      appState: { returnTo: "/chat" },
    });

  const loginWithGoogle = () =>
    loginWithRedirect({
      authorizationParams: { connection: googleConnection },
      appState: { returnTo: "/chat" },
    });

  const auth0Logout = () =>
    logout({
      logoutParams: { returnTo: window.location.origin },
    });

  return (
    <div className="lg:w-1/2 p-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center">
          <MessageCircle className="text-white" />
        </div>
        <h1 className="text-3xl text-white mt-4">
          {isAuthenticated
            ? `Welcome${user?.name ? `, ${user.name}` : ""}`
            : isLogin
              ? "Welcome Back"
              : "Create Account"}
        </h1>
      </div>

      <button
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white"
        onClick={
          isAuthenticated ? auth0Logout : isLogin ? login : signupWithDb
        }
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : isAuthenticated ? "Logout" : isLogin ? "Sign In" : "Sign Up"}
      </button>

      {!isAuthenticated && (
        <p
          className="text-center text-purple-200 mt-4 cursor-pointer"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Create account" : "Already have account?"}
        </p>
      )}

      {!isAuthenticated && (
        <div className="mt-6">
          <div className="flex items-center gap-4">
            <div className="h-px bg-white/20 flex-1" />
            <span className="text-purple-200 text-sm">or</span>
            <div className="h-px bg-white/20 flex-1" />
          </div>

          <button
            className="w-full mt-4 py-4 rounded-xl text-white border border-white/20 hover:bg-white/10 transition"
            onClick={loginWithGoogle}
            disabled={isLoading}
            type="button"
          >
            Continue with Google
          </button>
        </div>
      )}

      {error && !isAuthenticated && (
        <p className="text-center text-red-200 mt-4">Error: {error.message}</p>
      )}
    </div>
  );
};

export default AuthForm;
