import React, { useState, useEffect } from "react";
import { MoveRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "py-4 bg-white/10 backdrop-blur-xl border-b border-white/10 shadow-lg"
        : "py-6 bg-transparent"
        }`}
    >
      <div className="flex items-center justify-between px-8 max-w-7xl mx-auto">
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
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleGetStarted}
            className="bg-[#1a103d] hover:bg-[#251854] text-white rounded-full px-6 py-2 flex items-center gap-2 border-none"
          >
            Get Started
            <MoveRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
