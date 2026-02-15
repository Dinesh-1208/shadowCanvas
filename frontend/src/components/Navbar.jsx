import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 mx-auto max-w-7xl mt-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
        </div>
        <span className="text-white font-bold tracking-tighter text-xl uppercase">
          ShadowCanvas
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
          Features
        </a>
        <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
          How it Works
        </a>
        <a href="#security" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
          Security
        </a>
        <a href="#more" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
          More
        </a>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/my-canvases" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              My Canvases
            </Link>
            <Link to="/profile" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              My Profile
            </Link>
            <Button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-6 py-2 transition-colors"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Login
            </Link>
            <Link to="/register">
              <Button className="bg-[#1a103d] hover:bg-[#251854] text-white rounded-full px-6 py-2 flex items-center gap-2 border-none">
                Get Started
                <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
