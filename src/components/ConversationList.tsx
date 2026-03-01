import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { User, Check, CheckCheck, Search, Moon, Sun } from 'lucide-react';

import { Conversation } from '../hooks/useConversations';
import { cn } from './MessageBubble';

interface ConversationListProps {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    onSelect: (conv: Conversation) => void;
    filter: 'all' | 'open' | 'pending' | 'unread' | 'closed';
    setFilter: (f: 'all' | 'open' | 'pending' | 'unread' | 'closed') => void;
    loading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    activeConversation,
    onSelect,
    filter,
    setFilter,
    loading
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Initialize theme based on current document state
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };


    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations;
        const term = searchTerm.toLowerCase();
        return conversations.filter(c => {
            const nameMatch = (c.contact.name || '').toLowerCase().includes(term);
            const phoneMatch = c.contact.phone.includes(term);
            const labelMatch = c.labels?.some(cl => cl.label.name.toLowerCase().includes(term));
            return nameMatch || phoneMatch || labelMatch;
        });
    }, [conversations, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-background border-r border-border w-full sm:w-80 md:w-96 shrink-0">
            {/* Header */}
            <div className="p-4 bg-(--sidebar-header) backdrop-blur-md border-b border-border sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="brand-logo text-xl">NexoBite CRM</h1>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl bg-tertiary border border-border text-foreground hover:text-accent hover:border-accent transition-all hover:scale-105 active:scale-95 shadow-sm group"
                        title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    >
                        {isDarkMode ? (
                            <Sun className="h-4.5 w-4.5 animate-zoom-in" />
                        ) : (
                            <Moon className="h-4.5 w-4.5 animate-zoom-in" />
                        )}
                    </button>
                </div>


                {/* Search Bar */}
                <div className="relative mb-3 group">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, tel o etiqueta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-tertiary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all placeholder:text-muted text-foreground font-medium"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted group-focus-within:text-accent transition-colors" />
                </div>

                {/* Filter Bar */}
                <div className="flex bg-tertiary rounded-xl p-1 overflow-x-auto no-scrollbar gap-0.5 border border-border-secondary">
                    {(['all', 'open', 'pending', 'unread', 'closed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-2.5 py-1.5 text-[10px] rounded-lg transition-all whitespace-nowrap flex-1 font-semibold",
                                filter === f
                                    ? "bg-elevated shadow-sm text-foreground border border-border"
                                    : "text-muted hover:text-content hover:bg-secondary"
                            )}
                        >
                            {f === 'all' ? 'Todas' : f === 'open' ? 'Abiertas' : f === 'pending' ? 'Pendientes' : f === 'unread' ? 'Sin leer' : 'Cerradas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                {loading ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-3">
                        <div className="w-7 h-7 border-3 border-(--accent-soft) border-t-accent rounded-full animate-spin" />
                        <span className="text-xs text-muted animate-pulse font-medium">Cargando chats...</span>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center text-muted animate-fade-in">
                        <div className="w-14 h-14 rounded-full bg-tertiary flex items-center justify-center mb-3 border border-dashed border-border">
                            <Search className="h-6 w-6 opacity-30" />
                        </div>
                        <p className="text-xs font-semibold">No hay conversaciones</p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="mt-3 text-xs font-bold text-accent hover:underline">
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-border-secondary">
                        {filteredConversations.map((conv) => {
                            const lastMsg = conv.messages?.[0];
                            const isUnread = conv.status === 'unread' || (conv._count?.messages || 0) > 0;
                            const isSelected = activeConversation?.id === conv.id;

                            const statusDot: Record<string, string> = {
                                open: 'bg-success',
                                closed: 'bg-muted',
                                pending: 'bg-warning',
                                unread: 'bg-error',
                            };

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelect(conv)}
                                    className={cn(
                                        "flex items-center gap-3 p-3.5 cursor-pointer transition-all duration-200 relative border-l-4",
                                        isSelected
                                            ? "bg-(--sidebar-active) border-l-accent"
                                            : "hover:bg-(--sidebar-hover) border-l-transparent"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden border transition-all",
                                            isSelected
                                                ? "bg-accent border-accent"
                                                : "bg-tertiary border-border"
                                        )}>
                                            {conv.contact.avatarUrl ? (
                                                <img src={conv.contact.avatarUrl} alt={conv.contact.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className={cn("h-5 w-5", isSelected ? "text-white" : "text-muted")} />
                                            )}
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                                            statusDot[conv.status] || 'bg-muted'
                                        )} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={cn(
                                                "text-sm truncate",
                                                isUnread
                                                    ? "font-bold text-foreground"
                                                    : "font-semibold text-content"
                                            )}>
                                                {conv.contact.name || conv.contact.phone}
                                            </h3>
                                            <span className={cn(
                                                "text-[10px] whitespace-nowrap font-medium ml-1 shrink-0",
                                                isUnread ? "text-accent" : "text-muted"
                                            )}>
                                                {format(new Date(conv.lastMessageAt), 'HH:mm')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs mb-1.5">
                                            {lastMsg?.direction === 'outbound' && (
                                                lastMsg.status === 'read'
                                                    ? <CheckCheck className="w-3 h-3 text-info shrink-0" />
                                                    : <Check className="w-3 h-3 text-muted shrink-0" />
                                            )}
                                            <span className={cn(
                                                "truncate",
                                                isUnread ? "font-semibold text-foreground" : "text-muted"
                                            )}>
                                                {lastMsg?.type === 'text' ? lastMsg.content : lastMsg ? `[${lastMsg.type}]` : 'Sin mensajes'}
                                            </span>
                                        </div>

                                        {/* Labels */}
                                        {conv.labels && conv.labels.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {conv.labels.slice(0, 3).map((cl) => (
                                                    <span
                                                        key={cl.labelId}
                                                        className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border"
                                                        style={{
                                                            backgroundColor: `${cl.label.color}15`,
                                                            color: cl.label.color,
                                                            borderColor: `${cl.label.color}30`,
                                                        }}
                                                    >
                                                        {cl.label.name}
                                                    </span>
                                                ))}
                                                {conv.labels.length > 3 && (
                                                    <span className="text-[9px] text-muted font-bold">
                                                        +{conv.labels.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isUnread && (conv._count?.messages || 0) > 0 && (
                                        <div className="shrink-0 min-w-[18px] h-5 rounded-lg bg-accent px-1.5 flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                                            {conv._count.messages > 99 ? '99+' : conv._count.messages}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};