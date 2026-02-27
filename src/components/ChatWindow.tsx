import React, { useEffect, useRef, useState } from 'react';
import { Phone, MoreVertical, Search, Bot } from 'lucide-react';
import { Conversation, Message, Label } from '../hooks/useConversations';
import { cn } from './MessageBubble';
import { messageService } from '../services/api';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TemplatesModal } from './TemplatesModal';

import { LabelManager } from './LabelManager';
import { Tag, CheckCircle, Clock, Ban, MailOpen } from 'lucide-react';

interface ChatWindowProps {
    activeConversation: Conversation | null;
    messages: Message[];
    availableLabels: Label[];
    onToggleBot: (conversationId: string, botEnabled: boolean) => void;
    onChangeStatus: (conversationId: string, status: 'open' | 'closed' | 'pending' | 'unread') => void;
    onAssignLabel: (conversationId: string, labelId: string) => void;
    onRemoveLabel: (conversationId: string, labelId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    activeConversation,
    messages,
    availableLabels,
    onToggleBot,
    onChangeStatus,
    onAssignLabel,
    onRemoveLabel
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
    const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

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
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-gray-800 leading-tight">
                                {activeConversation.contact.name || activeConversation.contact.phone}
                            </h2>
                            {/* Status Pill */}
                            <div className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                activeConversation.status === 'open' ? "bg-green-100 text-green-700" :
                                    activeConversation.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                        activeConversation.status === 'unread' ? "bg-red-100 text-red-700" :
                                            "bg-gray-100 text-gray-700"
                            )}>
                                {activeConversation.status === 'open' ? 'Abierto' :
                                    activeConversation.status === 'pending' ? 'Pendiente' :
                                        activeConversation.status === 'unread' ? 'Sin leer' : 'Cerrado'}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500">
                                {activeConversation.contact.phone}
                            </p>
                            {/* Visual Label Chips in header */}
                            <div className="flex gap-1">
                                {activeConversation.labels?.slice(0, 2).map(cl => (
                                    <span
                                        key={cl.labelId}
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: cl.label.color }}
                                        title={cl.label.name}
                                    />
                                ))}
                                {activeConversation.labels?.length > 2 && (
                                    <span className="text-[10px] text-gray-400">+{activeConversation.labels.length - 2}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                    {/* Bot Toggle Switch */}
                    <div className="flex items-center gap-2 mr-1">
                        <span className="text-[10px] font-semibold text-gray-400 hidden xl:block uppercase tracking-tight">
                            Bot: {activeConversation.botEnabled ? 'ON' : 'OFF'}
                        </span>
                        <button
                            onClick={() => onToggleBot(activeConversation.id, !activeConversation.botEnabled)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${activeConversation.botEnabled ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                            title={activeConversation.botEnabled ? 'Desactivar bot' : 'Activar bot'}
                        >
                            <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${activeConversation.botEnabled ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1" />

                    {/* Status Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                            className="hover:bg-gray-200 p-2 rounded-full transition-colors"
                            title="Cambiar estado"
                        >
                            <CheckCircle className="w-5 h-5" />
                        </button>

                        {isStatusMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                {[
                                    { id: 'open', label: 'Abierto', color: 'text-green-600', icon: CheckCircle },
                                    { id: 'pending', label: 'Pendiente', color: 'text-yellow-600', icon: Clock },
                                    { id: 'unread', label: 'Sin leer', color: 'text-red-600', icon: MailOpen },
                                    { id: 'closed', label: 'Cerrado', color: 'text-gray-600', icon: Ban },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            onChangeStatus(activeConversation.id, s.id as any);
                                            setIsStatusMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <s.icon className={cn("w-4 h-4", s.color)} />
                                        <span className={activeConversation.status === s.id ? "font-bold" : ""}>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Label Manager Button */}
                    <button
                        onClick={() => setIsLabelManagerOpen(true)}
                        className="hover:bg-gray-200 p-2 rounded-full transition-colors"
                        title="Etiquetas"
                    >
                        <Tag className="w-5 h-5" />
                    </button>

                    <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><Search className="w-5 h-5" /></button>
                    <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Modals */}
            <LabelManager
                isOpen={isLabelManagerOpen}
                onClose={() => setIsLabelManagerOpen(false)}
                conversation={activeConversation}
                availableLabels={availableLabels}
                onAssignLabel={(labelId) => onAssignLabel(activeConversation.id, labelId)}
                onRemoveLabel={(labelId) => onRemoveLabel(activeConversation.id, labelId)}
            />

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
