"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Maximize2, Minimize2, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

export function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Si no está autenticado, no mostramos el widget
    if (!user) return null;

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsgText = input.trim();
        setInput('');
        const userMsg: Message = { id: Date.now().toString(), text: userMsgText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await apiFetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMsgText }),
            });

            const data = await response.json();

            if (data.reply) {
                const botMsg: Message = { id: Date.now().toString() + "-ai", text: data.reply, sender: 'bot' };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { id: Date.now().toString() + "-err", sender: 'bot', text: `Lo siento, ocurrió un error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-white rounded-2xl shadow-2xl w-[350px] sm:w-[400px] flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-5">
                    <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Asistente HXM</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 border border-indigo-600"></div>
                                    <span className="text-[10px] text-indigo-100 font-medium tracking-wide uppercase">En línea</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={toggleOpen} className="text-indigo-100 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors focus:outline-none">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 h-[400px] overflow-y-auto flex flex-col space-y-4 bg-gray-50/50 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center flex flex-col items-center justify-center h-full text-gray-500 animate-in fade-in zoom-in duration-300">
                                <div className="bg-indigo-50 p-4 rounded-full mb-3 shadow-sm border border-indigo-100 text-indigo-500">
                                    <Bot size={32} />
                                </div>
                                <h4 className="font-bold text-gray-800 mb-1">¡Hola, {user.fullName?.split(' ')[0] || 'equipo'}!</h4>
                                <p className="text-xs text-gray-500 max-w-[200px]">
                                    Soy tu asistente IA. ¿En qué puedo ayudarte hoy con políticas de RRHH o el Código del Trabajo?
                                </p>
                            </div>
                        )}
                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                <div className={`flex items-end gap-2 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${m.sender === 'user' ? 'bg-indigo-600' : 'bg-white border border-gray-200'}`}>
                                        {m.sender === 'user' ?
                                            <User size={14} className="text-white" /> :
                                            <Bot size={16} className="text-indigo-600" />
                                        }
                                    </div>
                                    <div className={`rounded-2xl p-3 text-sm shadow-sm ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in">
                                <div className="flex items-end gap-2 max-w-[85%]">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                        <Bot size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Escribe tu consulta..."
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 pr-10 outline-none transition-shadow"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-sm focus:outline-none flex-shrink-0 flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    onClick={toggleOpen}
                    className="bg-indigo-600 text-white flex items-center justify-center rounded-full h-14 w-14 shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all focus:outline-none group relative border-2 border-white/20"
                >
                    <Bot size={28} className="group-hover:animate-pulse" />
                    <span className="absolute flex h-3 w-3 top-0 right-0 -mt-1 -mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                    </span>
                </button>
            )}
        </div>
    );
}
