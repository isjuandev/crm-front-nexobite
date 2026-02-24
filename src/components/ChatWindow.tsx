import React, { useEffect, useRef, useState } from 'react';
import { Phone, MoreVertical, Search, Bot } from 'lucide-react';
import { Conversation, Message } from '../hooks/useConversations';
import { messageService } from '../services/api';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TemplatesModal } from './TemplatesModal';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (messageContent: string) => {
        if (!activeConversation) return;
        try {
            await messageService.sendMessage(activeConversation.id, messageContent);
            // el envío real se actualiza via Socket
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            throw error; // Re-throw to restore input text in MessageInput
        }
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] h-full hidden sm:flex">
                <div className="bg-white rounded-full p-6 shadow-sm mb-4">
                    <Phone className="w-16 h-16 text-gray-300" />
                </div>
                <h2 className="text-2xl font-light text-gray-600 mb-2">CRM NexoBite - WhatsApp</h2>
                <p className="text-gray-500 text-sm max-w-md text-center">
                    Bienvenido a tu CRM NexoBite
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
            <MessageInput
                onSendMessage={handleSendMessage}
                onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            />

            {/* Templates Modal */}
            <TemplatesModal
                isOpen={isTemplatesModalOpen}
                onClose={() => setIsTemplatesModalOpen(false)}
                conversationId={activeConversation.id}
            />
        </div>
    );
};
