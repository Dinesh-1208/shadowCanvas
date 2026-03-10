import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

export default function AIChatPanel({ isOpen, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    
    // Smooth mount/unmount logic
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for exit animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you create diagrams today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        
        const newUserMessage = { id: Date.now(), role: 'user', content: inputValue.trim() };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = { id: Date.now() + 1, role: 'assistant', content: 'I am a simulated AI. Backend integration is coming soon! For now, I cannot modify the canvas.' };
            setMessages(prev => [...prev, aiResponse]);
        }, 1200);
    };

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`absolute top-20 right-4 w-80 h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-40 pointer-events-auto transition-all duration-300 ease-in-out origin-right ${isOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-[#b2a4ff]/20 rounded-t-2xl shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-[#b2a4ff] p-1.5 rounded-lg text-white shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">AI Assistant</h3>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-gray-50/50">
                {messages.map(msg => (
                    <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                    >
                        <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-[#1a103d] text-white rounded-tr-sm' 
                            : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 rounded-b-2xl shrink-0">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask me to build a diagram..."
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#b2a4ff] focus:ring-2 focus:ring-[#b2a4ff]/20 outline-none rounded-xl text-sm transition-all text-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute right-1 p-1.5 bg-[#b2a4ff] text-white rounded-lg hover:bg-[#9d8beb] transition-colors disabled:opacity-50 disabled:hover:bg-[#b2a4ff]"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
