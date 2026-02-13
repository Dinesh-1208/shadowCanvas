import React from "react";
import { MoveRight } from "lucide-react";
import { Button } from "./ui/button";

import { Link } from "react-router-dom";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  // Simple check for token presence
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    window.location.reload(); // Simple reload to clear state and reset UI
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 mx-auto max-w-7xl mt-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
        </div>
        <span className="text-white font-bold tracking-tighter text-xl uppercase">
          ShadowCanvas
        </span>
      </div>

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
          <button
            onClick={handleLogout}
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Logout
          </button>
        ) : (
          <Link to="/login" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Login
          </Link>
        )}

        <Link to={isAuthenticated ? "/canvas" : "/login"}>
          <Button className="bg-[#1a103d] hover:bg-[#251854] text-white rounded-full px-6 py-2 flex items-center gap-2 border-none">
            {isAuthenticated ? "Open Canvas" : "Get Started"}
            <MoveRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
