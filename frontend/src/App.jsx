import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import SharedLinkJoin from "./features/canvas/pages/SharedLinkJoin";

const RandomRedirect = () => {
  const [roomCode, setRoomCode] = React.useState(null);

  React.useEffect(() => {
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  if (!roomCode) return null;
  return <Navigate to={`/canvas/${roomCode}`} replace />;
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-canvases" element={<ProtectedRoute><MyCanvases /></ProtectedRoute>} />
        <Route path="/multi-canvas-lobby" element={<ProtectedRoute><MultiCanvasLobby /></ProtectedRoute>} />
        <Route path="/multi-canvas-join" element={<ProtectedRoute><MultiCanvasJoin /></ProtectedRoute>} />

        <Route path="/multi-canvas" element={<ProtectedRoute><MultiCanvasLobby /></ProtectedRoute>} />
        <Route path="/multi-canvas-join" element={<ProtectedRoute><MultiCanvasJoin /></ProtectedRoute>} />
        <Route path="/canvas/shared/:token" element={<ProtectedRoute><SharedLinkJoin /></ProtectedRoute>} />
        <Route path="/canvas/:roomCode" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
        <Route path="/canvas" element={<ProtectedRoute><RandomRedirect /></ProtectedRoute>} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;