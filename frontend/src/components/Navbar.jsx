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
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-2.5 mx-auto max-w-6xl mt-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-300">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45"></div>
        </div>
        <span className="text-white font-bold tracking-tighter text-lg uppercase">
          ShadowCanvas
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        <a href="#features" className="text-white/80 hover:text-white transition-colors text-[13px] font-bold uppercase tracking-wider">
          Features
        </a>
        <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors text-[13px] font-bold uppercase tracking-wider">
          How it Works
        </a>
        <a href="#security" className="text-white/80 hover:text-white transition-colors text-[13px] font-bold uppercase tracking-wider">
          Security
        </a>
        <a href="#more" className="text-white/80 hover:text-white transition-colors text-[13px] font-bold uppercase tracking-wider">
          More
        </a>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/my-canvases" className="text-white/80 hover:text-white transition-colors text-[13px] font-bold uppercase tracking-wider">
              My Canvases
            </Link>
            <Link to="/profile" className="text-white/80 hover:text-white transition-colors text-[13px] font-bold uppercase tracking-wider">
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase transition-all shadow-lg hover:shadow-red-500/30 active:scale-95"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register">
              <Button className="bg-[#1a103d] hover:bg-[#251854] text-white rounded-full px-5 py-1.5 text-xs font-black uppercase flex items-center gap-2 border-none">
                Get Started
                <MoveRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
