import React, { useEffect, useRef, useState } from 'react';
import { Phone, MoreVertical, Search, Bot, Tag, CheckCircle, Clock, Ban, MailOpen, Info } from 'lucide-react';
import { Conversation, Message, Label } from '../hooks/useConversations';
import { cn } from './MessageBubble';
import { messageService } from '../services/api';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TemplatesModal } from './TemplatesModal';
import { LabelManager } from './LabelManager';

interface ChatWindowProps {
    activeConversation: Conversation | null;
    messages: Message[];
    availableLabels: Label[];
    onToggleBot: (conversationId: string, botEnabled: boolean) => void;
    onChangeStatus: (conversationId: string, status: 'open' | 'closed' | 'pending' | 'unread') => void;
    onAssignLabel: (conversationId: string, labelId: string) => void;
    onRemoveLabel: (conversationId: string, labelId: string) => void;
    onShowInfo?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    activeConversation,
    messages,
    availableLabels,
    onToggleBot,
    onChangeStatus,
    onAssignLabel,
    onRemoveLabel,
    onShowInfo
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
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            throw error;
        }
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-secondary h-full sm:flex animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-elevated flex items-center justify-center shadow-md border border-border mb-5">
                    <Phone className="w-10 h-10 text-accent opacity-50" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">NexoBite CRM</h2>
                <p className="text-muted text-sm max-w-xs text-center leading-relaxed">
                    Selecciona una conversación para comenzar a gestionar tus leads.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-(--bg-chat) relative">
            {/* Background pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04]"
                style={{
                    backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png')",
                    backgroundRepeat: 'repeat',
                    backgroundSize: '450px',
                    filter: 'invert(1)',
                }}
            />

            {/* Header */}
            <header className="h-16 bg-(--chat-header-bg) backdrop-blur-xl flex items-center justify-between px-4 border-b border-border z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-(--accent-soft) flex items-center justify-center overflow-hidden border border-border">
                            {activeConversation.contact.avatarUrl ? (
                                <img src={activeConversation.contact.avatarUrl} alt={activeConversation.contact.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-accent font-bold text-base">
                                    {activeConversation.contact.name?.charAt(0) || activeConversation.contact.phone.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                            activeConversation.status === 'open' ? 'bg-success' :
                                activeConversation.status === 'pending' ? 'bg-warning' :
                                    'bg-muted'
                        )} />
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-foreground leading-tight truncate text-sm">
                                {activeConversation.contact.name || activeConversation.contact.phone}
                            </h2>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0",
                                activeConversation.status === 'open' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                    activeConversation.status === 'pending' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                        activeConversation.status === 'unread' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                            "bg-tertiary text-muted border-border"
                            )}>
                                {activeConversation.status === 'open' ? 'Abierto' :
                                    activeConversation.status === 'pending' ? 'Pendiente' :
                                        activeConversation.status === 'unread' ? 'Sin leer' : 'Cerrado'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-muted font-medium">
                                {activeConversation.contact.phone}
                            </p>
                            <div className="flex gap-1 items-center">
                                {activeConversation.labels?.slice(0, 2).map(cl => (
                                    <span key={cl.labelId} className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: cl.label.color }} title={cl.label.name} />
                                ))}
                                {activeConversation.labels?.length > 2 && (
                                    <span className="text-[9px] text-muted font-bold">
                                        +{activeConversation.labels.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-(--text-secondary)">
                    {/* Bot Toggle */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary rounded-full border border-border">
                        <Bot className={cn("w-3.5 h-3.5", activeConversation.botEnabled ? "text-success" : "text-muted")} />
                        <span className="text-[9px] font-black hidden sm:block uppercase tracking-wider text-muted">Bot</span>
                        <button
                            onClick={() => onToggleBot(activeConversation.id, !activeConversation.botEnabled)}
                            className={cn(
                                "relative inline-flex h-4 w-7 items-center rounded-full transition-all focus:outline-none",
                                activeConversation.botEnabled ? "bg-success" : "bg-muted"
                            )}
                            title={activeConversation.botEnabled ? 'Desactivar bot' : 'Activar bot'}
                        >
                            <span className={cn(
                                "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-sm",
                                activeConversation.botEnabled ? "translate-x-3.5" : "translate-x-0.5"
                            )} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    {/* Status Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                            className="p-2 rounded-xl hover:bg-tertiary transition-all"
                            title="Cambiar estado"
                        >
                            <CheckCircle className="w-5 h-5" />
                        </button>
                        {isStatusMenuOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-elevated rounded-xl shadow-xl border border-border z-50 py-1.5 overflow-hidden animate-slide-up">
                                {[
                                    { id: 'open', label: 'Abierto', color: 'text-green-500', icon: CheckCircle },
                                    { id: 'pending', label: 'Pendiente', color: 'text-amber-500', icon: Clock },
                                    { id: 'unread', label: 'Sin leer', color: 'text-red-500', icon: MailOpen },
                                    { id: 'closed', label: 'Cerrado', color: 'text-muted', icon: Ban },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { onChangeStatus(activeConversation.id, s.id as any); setIsStatusMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-(--sidebar-hover) flex items-center gap-3 transition-colors text-(--text-secondary)"
                                    >
                                        <s.icon className={cn("w-4 h-4", s.color)} />
                                        <span className={activeConversation.status === s.id ? "font-black text-foreground" : ""}>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={() => setIsLabelManagerOpen(true)}
                        className="p-2 rounded-xl hover:bg-tertiary transition-all" title="Etiquetas">
                        <Tag className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-tertiary transition-all" title="Buscar">
                        <Search className="w-5 h-5" />
                    </button>
                    {onShowInfo && (
                        <button
                            onClick={onShowInfo}
                            className="p-2 rounded-xl hover:bg-tertiary transition-all"
                            title="Ver perfil del contacto"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    )}
                    <button className="p-2 rounded-xl hover:bg-tertiary transition-all" title="Más opciones">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <LabelManager
                isOpen={isLabelManagerOpen}
                onClose={() => setIsLabelManagerOpen(false)}
                conversation={activeConversation}
                availableLabels={availableLabels}
                onAssignLabel={(labelId) => onAssignLabel(activeConversation.id, labelId)}
                onRemoveLabel={(labelId) => onRemoveLabel(activeConversation.id, labelId)}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative z-10">
                <div className="max-w-4xl mx-auto">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="z-10 shrink-0">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    onOpenTemplates={() => setIsTemplatesModalOpen(true)}
                />
            </div>

            <TemplatesModal
                isOpen={isTemplatesModalOpen}
                onClose={() => setIsTemplatesModalOpen(false)}
                conversationId={activeConversation.id}
            />
        </div>
    );
};