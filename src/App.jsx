import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./auth/ProtectedRoute";

const ChatPage = lazy(() => import("./chat/ChatPage"));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
