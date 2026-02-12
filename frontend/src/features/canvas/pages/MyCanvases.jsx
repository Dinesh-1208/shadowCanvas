import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

const MyCanvases = () => {
    return (
        <div className="min-h-screen bg-[#b2a4ff] relative overflow-hidden flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center">
                <h1 className="text-4xl text-white font-bold">My Canvases (Coming Soon)</h1>
            </div>
            <Footer />
        </div>
    );
};

export default MyCanvases;
