import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Footer = () => {
    return (
        <footer className="relative mt-20 border-t border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
                            </div>
                            <span className="text-white font-bold tracking-tighter text-xl uppercase">
                                ShadowCanvas
                            </span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                            The next generation whiteboard powered by AI. Visualize your thoughts, collaborate in real-time, and build faster.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-white/40 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-white/40 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-white/40 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="grid grid-cols-2 gap-8 lg:col-span-2">
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white font-semibold text-sm">Product</h3>
                            <ul className="flex flex-col gap-2">
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Features</a></li>
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Templates</a></li>
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Integrations</a></li>
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</a></li>
                            </ul>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white font-semibold text-sm">Company</h3>
                            <ul className="flex flex-col gap-2">
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">About Us</a></li>
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Careers</a></li>
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Blog</a></li>
                                <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter Section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-semibold text-sm">Stay Updated</h3>
                        <p className="text-white/60 text-sm">Subscribe to our newsletter for the latest updates.</p>
                        <div className="flex flex-col gap-3">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-indigo-500"
                            />
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-white/40 text-xs">
                        © 2026 ShadowCanvas Inc. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-white/40 text-xs">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies Settings</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
