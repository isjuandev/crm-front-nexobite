import React from 'react';
import { format } from 'date-fns';
import { User, Check, CheckCheck } from 'lucide-react';
import { Conversation } from '../hooks/useConversations';
import { cn } from './MessageBubble';

interface ConversationListProps {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    onSelect: (conv: Conversation) => void;
    filter: 'open' | 'closed';
    setFilter: (f: 'open' | 'closed') => void;
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
    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full sm:w-80 md:w-96 flex-shrink-0">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h1 className="font-semibold text-gray-800">Chats</h1>
                <div className="flex bg-gray-200 rounded-lg p-1">
                    <button
                        onClick={() => setFilter('open')}
                        className={cn(
                            "px-3 py-1 text-sm rounded-md transition-colors",
                            filter === 'open' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Abiertos
                    </button>
                    <button
                        onClick={() => setFilter('closed')}
                        className={cn(
                            "px-3 py-1 text-sm rounded-md transition-colors",
                            filter === 'closed' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Cerrados
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 flex justify-center text-gray-500">
                        <span className="animate-pulse">Cargando chats...</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-8 text-center justify-center flex flex-col items-center text-gray-500">
                        <User className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No hay conversaciones</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const lastMsg = conv.messages?.[0];
                        const isUnread = conv._count?.messages > 0;
                        const isSelected = activeConversation?.id === conv.id;

                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                className={cn(
                                    "flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group",
                                    isSelected && "bg-blue-50 hover:bg-blue-50"
                                )}
                            >
                                <div className="h-12 w-12 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center overflow-hidden">
                                    <User className="h-6 w-6 text-slate-500" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={cn("text-sm truncate", isUnread ? "font-bold text-gray-900" : "font-medium text-gray-900")}>
                                            {conv.contact.name || conv.contact.phone}
                                        </h3>
                                        <span className={cn("text-xs whitespace-nowrap", isUnread ? "text-green-600 font-medium" : "text-gray-500")}>
                                            {format(new Date(conv.lastMessageAt), 'HH:mm')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-sm">
                                        {lastMsg?.direction === 'outbound' && (
                                            <span className="text-gray-400">
                                                {lastMsg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-gray-400" />}
                                            </span>
                                        )}
                                        <span className={cn("truncate", isUnread ? "font-bold text-gray-800" : "text-gray-500")}>
                                            {lastMsg?.type === 'text' ? lastMsg.content : lastMsg ? `[${lastMsg.type}]` : 'Sin mensajes'}
                                        </span>
                                    </div>
                                </div>

                                {isUnread && (
                                    <div className="flex flex-shrink-0 items-center justify-center min-w-[20px] h-5 rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">
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
