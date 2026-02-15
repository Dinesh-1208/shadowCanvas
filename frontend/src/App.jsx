import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import CanvasPage from "./features/canvas/components/CanvasPage";
import PrivateRoute from "./components/PrivateRoute";

import LandingPage from "./pages/LandingPage";
import MultiCanvasInitialization from "./features/canvas/pages/MultiCanvasInitialization";

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
        <Route path="/multi-canvas-lobby" element={<MultiCanvasLobby />} />
        <Route path="/multi-canvas-join" element={<MultiCanvasJoin />} />
        <Route path="/multi-canvas-init" element={<MultiCanvasInitialization />} />

        <Route path="/canvas" element={<CanvasPage />} />
      </Routes>
    </Router>
  );
}

export default App;
