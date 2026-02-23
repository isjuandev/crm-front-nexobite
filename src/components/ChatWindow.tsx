import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, MoreVertical, Search, Paperclip, Smile, Bot } from 'lucide-react';
import { Conversation, Message } from '../hooks/useConversations';
import { messageService } from '../services/api';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
    activeConversation: Conversation | null;
    messages: Message[];
    onToggleBot: (conversationId: string, botEnabled: boolean) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    activeConversation,
    messages,
    onToggleBot
}) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeConversation) return;

        const messageContent = inputText;
        setInputText('');

        try {
            await messageService.sendMessage(activeConversation.id, messageContent);
            // el envío real se actualiza via Socket (o optimísticamente si quisiéramos)
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            // Restaurar el texto en caso de error
            setInputText(messageContent);
        }
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] h-full hidden sm:flex">
                <div className="bg-white rounded-full p-6 shadow-sm mb-4">
                    <Phone className="w-16 h-16 text-gray-300" />
                </div>
                <h2 className="text-2xl font-light text-gray-600 mb-2">WhatsApp Web CRM</h2>
                <p className="text-gray-500 text-sm max-w-md text-center">
                    Envía y recibe mensajes vinculando el webhook de Meta.
                    Selecciona un chat en la barra lateral para empezar a mensajear.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#efeae2]">
            {/* Header */}
            <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden">
                        <span className="text-slate-600 font-medium">
                            {activeConversation.contact.name?.charAt(0) || '*'}
                        </span>
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800">
                            {activeConversation.contact.name || activeConversation.contact.phone}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {activeConversation.contact.phone}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-gray-600">
                    {/* Bot Toggle Switch */}
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs font-medium text-gray-500 hidden md:block">
                            {activeConversation.botEnabled ? 'Bot Activo' : 'Bot Pausado'}
                        </span>
                        <button
                            onClick={() => onToggleBot(activeConversation.id, !activeConversation.botEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${activeConversation.botEnabled ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                            title={activeConversation.botEnabled ? 'Desactivar respuesta automática (n8n)' : 'Activar respuesta automática (n8n)'}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activeConversation.botEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><Search className="w-5 h-5" /></button>
                    <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png')", backgroundRepeat: 'repeat', opacity: 0.9 }}>
                <div className="max-w-4xl mx-auto">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3">
                <button className="text-gray-500 hover:text-gray-700 p-1">
                    <Smile className="w-6 h-6" />
                </button>
                <button className="text-gray-500 hover:text-gray-700 p-1">
                    <Paperclip className="w-6 h-6" />
                </button>

                <form onSubmit={handleSend} className="flex-1 flex items-center bg-white rounded-lg px-4 py-2 border border-blue-50 focus-within:ring-1 focus-within:ring-green-400">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Escribe un mensaje"
                        className="flex-1 outline-none bg-transparent text-gray-700"
                        autoFocus
                    />
                </form>

                <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className={`p-2 rounded-full flex items-center justify-center ${inputText.trim()
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                        } transition-colors`}
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </button>
            </div>
        </div>
    );
};
