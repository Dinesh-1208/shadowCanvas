import React, { useMemo } from "react";
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

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => chars[v % chars.length]).join('');
}

function RandomCanvasRedirect() {
  // eslint-disable-next-line react-hooks/purity
  const roomCode = useMemo(() => generateRoomCode(), []);
  return <Navigate to={`/canvas/${roomCode}`} replace />;
}

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
        <Route path="/multi-canvas-lobby" element={<MultiCanvasLobby />} />
        <Route path="/multi-canvas-join" element={<MultiCanvasJoin />} />

        <Route path="/canvas/:roomCode" element={<CanvasPage />} />
        <Route path="/canvas" element={<RandomCanvasRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
