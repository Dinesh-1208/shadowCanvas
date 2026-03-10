import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Mic, MicOff, Loader2 } from 'lucide-react';
import { generateDiagram } from '../../../utils/api';
import { parseSvgToCanvasElements } from '../../../utils/svgParser';

export default function AIChatPanel({ isOpen, onClose, addAiElements, pan, zoom, existingElements }) {
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
            
            if (response.success && response.elements) {
                // Build a concise summary for the chat
                const connections = response.connections || [];
                const summary = response.elements
                    .map(el => {
                        if (el.type === 'rectangle') return `\u25ad Rectangle${el.text ? ` "${el.text}"` : ''}`;
                        if (el.type === 'circle')    return `\u25ce Circle${el.text ? ` "${el.text}"` : ''}`;
                        if (el.type === 'text')      return `T "${el.text || ''}"`;
                        return el.type;
                    })
                    .concat(
                        connections.map(c => `\u2192 ${c.from} \u2014 ${c.to}${c.label ? ` (${c.label})` : ''}`)
                    )
                    .join('\n');

                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `\uD83C\uDFA8 Generated diagram with ${response.elements.length} shape(s) and ${connections.length} connection(s):\n${summary}`
                }]);

                // Parse JSON elements + connections into canvas objects
                if (typeof addAiElements === 'function') {
                    // Compute approximate canvas-space center of the current viewport
                    const z = zoom || 1;
                    const p = pan || { x: 0, y: 0 };
                    // Canvas viewport is roughly 1200×700px (approximate, no DOM measure needed)
                    const viewportCenter = {
                        x: (-p.x / z) + (600 / z),
                        y: (-p.y / z) + (350 / z),
                    };

                    const canvasElements = parseSvgToCanvasElements(response.elements, connections, {
                        viewportCenter,
                        existingElements: existingElements || [],
                    });
                    
                    if (canvasElements.length > 0) {
                        addAiElements(canvasElements);
                        setMessages(prev => [...prev, {
                            id: Date.now() + 2,
                            role: 'assistant',
                            content: `\u2705 Diagram added to canvas. (${canvasElements.length} shape${canvasElements.length > 1 ? 's' : ''} placed) You can drag, resize, or delete them like any other element.`
                        }]);
                    } else {
                        setMessages(prev => [...prev, {
                            id: Date.now() + 2,
                            role: 'assistant',
                            content: '\u26A0\uFE0F The diagram was generated but no renderable shapes were found. Try rephrasing your prompt.'
                        }]);
                    }
                }
            } else {
                throw new Error(response.error || 'Invalid format received');
            }
        } catch (error) {
            console.error('Gemini AI API Error:', error);
            const msg = error?.response?.data?.error || error?.message || 'Unknown error';
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: `❌ Error: ${msg}`
            }]);
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
            <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden flex flex-col gap-3 bg-gray-50/50">
                {messages.map(msg => {
                    const isUser = msg.role === 'user';

                    // Heuristic: treat content starting with { or < as a code block
                    const isCode = !isUser &&
                        (msg.content.trimStart().startsWith('{') ||
                         msg.content.trimStart().startsWith('<'));

                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col w-[75%] ${
                                isUser ? 'self-end items-end' : 'self-start items-start'
                            }`}
                        >
                            <div
                                className={`w-full rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                    isUser
                                        ? 'bg-[#1a103d] text-white rounded-tr-sm px-3 py-2.5'
                                        : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                                }`}
                            >
                                {isCode ? (
                                    /* Sandboxed code block — only scrolls vertically inside itself */
                                    <pre
                                        style={{
                                            margin: 0,
                                            padding: '10px 12px',
                                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                            fontSize: '11px',
                                            lineHeight: '1.5',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            overflowX: 'hidden',
                                            overflowY: 'auto',
                                            maxHeight: '200px',
                                            backgroundColor: '#f8f7ff',
                                            borderRadius: '12px',
                                        }}
                                    >
                                        {msg.content}
                                    </pre>
                                ) : (
                                    /* Normal chat text — wraps cleanly */
                                    <p
                                        style={{
                                            margin: 0,
                                            padding: isUser ? 0 : '10px 12px',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                        }}
                                    >
                                        {msg.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
                
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
