import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import CanvasPage from "./features/canvas/components/CanvasPage";

import LandingPage from "./pages/LandingPage";
import MultiCanvasLobby from "./features/canvas/pages/MultiCanvasLobby";
import MultiCanvasJoin from "./features/canvas/pages/MultiCanvasJoin";

import Profile from "./features/auth/pages/Profile";
import MyCanvases from "./features/canvas/pages/MyCanvases";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-canvases" element={<MyCanvases />} />
        <Route path="/my-canvases" element={<MyCanvases />} />

        <Route path="/canvas/:roomCode" element={<CanvasPage />} />
        <Route path="/canvas" element={<Navigate to={`/canvas/${Math.random().toString(36).substring(2, 8).toUpperCase()}`} />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;