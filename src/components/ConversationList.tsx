import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { User, Check, CheckCheck } from 'lucide-react';
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
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full sm:w-80 md:w-96 flex-shrink-0">
            {/* Header */}
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h1 className="font-semibold text-gray-800 mb-3">Chats</h1>

                {/* Search Bar */}
                <div className="relative mb-3">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, tel o etiqueta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                {/* Filter Bar */}
                <div className="flex bg-gray-200 rounded-lg p-1 overflow-x-auto no-scrollbar">
                    {(['all', 'open', 'pending', 'unread', 'closed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap flex-1 caps first-letter:uppercase",
                                filter === f ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {f === 'all' ? 'Todas' : f === 'open' ? 'Abiertas' : f === 'pending' ? 'Pendientes' : f === 'unread' ? 'Sin leer' : 'Cerradas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 flex justify-center text-gray-500">
                        <span className="animate-pulse">Cargando chats...</span>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center justify-center flex flex-col items-center text-gray-500">
                        <User className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No hay conversaciones</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const lastMsg = conv.messages?.[0];
                        const isUnreadStatus = conv.status === 'unread';
                        const isUnread = isUnreadStatus || conv._count?.messages > 0;
                        const isSelected = activeConversation?.id === conv.id;

                        // Color de punto por estado
                        const statusColors: Record<string, string> = {
                            open: 'bg-green-500',
                            closed: 'bg-gray-400',
                            pending: 'bg-yellow-500',
                            unread: 'bg-red-500'
                        };

                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                className={cn(
                                    "flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group relative",
                                    isSelected && "bg-blue-50 hover:bg-blue-50"
                                )}
                            >
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center overflow-hidden">
                                        <User className="h-6 w-6 text-slate-500" />
                                    </div>
                                    {/* Indicador de estado */}
                                    <div className={cn(
                                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                                        statusColors[conv.status] || 'bg-gray-400'
                                    )} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={cn("text-sm truncate", isUnread ? "font-bold text-gray-900" : "font-medium text-gray-900")}>
                                            {conv.contact.name || conv.contact.phone}
                                        </h3>
                                        <span className={cn("text-[10px] whitespace-nowrap", isUnread ? "text-green-600 font-semibold" : "text-gray-400")}>
                                            {format(new Date(conv.lastMessageAt), 'HH:mm')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs mb-1">
                                        {lastMsg?.direction === 'outbound' && (
                                            <span className="text-gray-400">
                                                {lastMsg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-gray-400" />}
                                            </span>
                                        )}
                                        <span className={cn("truncate max-w-[150px]", isUnread ? "font-semibold text-gray-800" : "text-gray-500")}>
                                            {lastMsg?.type === 'text' ? lastMsg.content : lastMsg ? `[${lastMsg.type}]` : 'Sin mensajes'}
                                        </span>
                                    </div>

                                    {/* Etiquetas */}
                                    {conv.labels && conv.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {conv.labels.map((cl) => (
                                                <span
                                                    key={cl.labelId}
                                                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                                    style={{ backgroundColor: `${cl.label.color}20`, color: cl.label.color }}
                                                >
                                                    {cl.label.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {isUnread && conv._count?.messages > 0 && (
                                    <div className="flex flex-shrink-0 items-center justify-center min-w-[18px] h-4 rounded-full bg-green-500 px-1 text-[9px] font-bold text-white">
                                        {conv._count.messages > 99 ? '99+' : conv._count.messages}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
