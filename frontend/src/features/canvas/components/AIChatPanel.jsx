import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Mic, MicOff, Loader2 } from 'lucide-react';
import { generateDiagram } from '../../../utils/api';

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

    const initialMessages = [
        { id: 1, role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you create diagrams today?' }
    ];
    
    // Core States
    const [messages, setMessages] = useState(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    // Voice/Mic States
    const [isListening, setIsListening] = useState(false);
    const [recognitionSupported, setRecognitionSupported] = useState(true);
    
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    // Setup Web Speech API explicitly on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setInputValue(prev => (prev ? prev + ' ' : '') + finalTranscript);
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "Microphone access was denied. Please allow microphone permissions to use voice chat." }]);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setRecognitionSupported(false);
        }
    }, []);

    const toggleListening = (e) => {
        e.preventDefault(); // Prevent accidental form submissions
        if (!recognitionSupported) {
            setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "Voice recognition is not supported in this browser." }]);
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Could not start recognition:", err);
                setIsListening(false);
            }
        }
    };
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        
        // Stop listening if sending manually while voice is active
        if (isListening && recognitionRef.current) {
             recognitionRef.current.stop();
             setIsListening(false);
        }

        const promptText = inputValue.trim();
        if (!promptText) return;
        
        const newUserMessage = { id: Date.now(), role: 'user', content: promptText };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsThinking(true);

        try {
            const response = await generateDiagram(promptText);
            
            if (response.success && response.svg) {
                const aiResponse = { 
                    id: Date.now() + 1, 
                    role: 'assistant', 
                    content: response.svg 
                };
                setMessages(prev => [...prev, aiResponse]);
            } else {
                throw new Error("Invalid format received");
            }
        } catch (error) {
            console.error("Gemini AI API Error:", error);
            const errorResponse = { 
                id: Date.now() + 1, 
                role: 'assistant', 
                content: "I'm sorry, I encountered an error communicating with the AI. Please ensure the backend is connected and try again." 
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsThinking(false);
        }
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
                        <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm overflow-x-auto ${
                            msg.role === 'user' 
                            ? 'bg-[#1a103d] text-white rounded-tr-sm' 
                            : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm font-mono whitespace-pre text-xs'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex flex-col self-start max-w-[85%]">
                         <div className="p-3 bg-white border border-gray-100 text-[#b2a4ff] rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-semibold">Generating diagram...</span>
                         </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 rounded-b-2xl shrink-0">
                <div className="relative flex items-center gap-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Ask me to build a diagram..."}
                        className={`w-full pl-3 py-2.5 bg-gray-50 border border-gray-200 outline-none rounded-xl text-sm transition-all text-gray-700 ${
                            isListening ? 'pr-[70px] border-[#b2a4ff] ring-2 ring-[#b2a4ff]/20 bg-indigo-50/50' : 'pr-[70px] focus:border-[#b2a4ff] focus:ring-2 focus:ring-[#b2a4ff]/20'
                        }`}
                        disabled={isThinking}
                    />
                    
                    <div className="absolute right-1 flex items-center gap-1">
                         <button
                            type="button"
                            onClick={toggleListening}
                            disabled={isThinking || !recognitionSupported}
                            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 ${
                                isListening 
                                ? 'bg-red-50 text-red-500 animate-pulse hover:bg-red-100' 
                                : 'text-gray-400 hover:text-[#b2a4ff] hover:bg-indigo-50 bg-transparent'
                            }`}
                        >
                            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>

                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isThinking}
                            className="p-1.5 bg-[#b2a4ff] text-white rounded-lg hover:bg-[#9d8beb] transition-colors disabled:opacity-50 disabled:hover:bg-[#b2a4ff] flex flex-center"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
