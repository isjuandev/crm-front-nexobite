import { useState, useEffect, useCallback, useRef } from 'react';
import { conversationService } from '../services/api';
import { supabase } from '../lib/supabase';

export interface Contact {
    createdAt: any;
    id: string;
    phone: string;
    name: string;
    company?: string | null;
    interestStatus: string;
    recommendedService?: string | null;
    notes?: string | null;
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    type: string;
    direction: 'inbound' | 'outbound';
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    mediaUrl?: string | null;
}

export interface Conversation {
    id: string;
    contactId: string;
    status: 'open' | 'closed';
    botEnabled: boolean;
    lastMessageAt: string;
    contact: Contact;
    messages: Message[];
    _count: {
        messages: number;
    };
}

export const useConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const activeConvIdRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'open' | 'closed'>('open');

    // Cargar lista de conversaciones
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await conversationService.getConversations(filter);
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // Cargar mensajes de una conversación
    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            const data = await conversationService.getMessages(conversationId);
            setMessages(data);
            // Resetear el contador de no leídos al abrir
            setConversations(prev => prev.map(conv => {
                if (conv.id === conversationId) {
                    return { ...conv, _count: { messages: 0 } };
                }
                return conv;
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, []);

    // Cambiar conversación activa
    const selectConversation = (conversation: Conversation) => {
        setActiveConversation(conversation);
        activeConvIdRef.current = conversation.id;
        fetchMessages(conversation.id);
    };

    // Supabase Realtime: Escuchar nuevos mensajes y actualizaciones
    useEffect(() => {
        const channel = supabase
            .channel('crm_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'crm', table: 'messages' },
                (payload) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const rawMsg = payload.new as any;
                    const mappedMessage: Message = {
                        id: rawMsg.id,
                        conversationId: rawMsg.conversationId || rawMsg.conversationid || rawMsg.conversation_id,
                        content: rawMsg.content,
                        type: rawMsg.type || 'text',
                        direction: rawMsg.direction,
                        status: rawMsg.status || 'sent',
                        timestamp: rawMsg.timestamp || new Date().toISOString(),
                        mediaUrl: rawMsg.mediaUrl || rawMsg.mediaurl || rawMsg.media_url,
                    };
                    const targetConvId = mappedMessage.conversationId;

                    if (!targetConvId) return;

                    // Fetch the full conversation details to construct the object properly if necessary
                    // but usually, we just update the cached lists.
                    if (activeConvIdRef.current === targetConvId) {
                        setMessages((prev) => {
                            if (prev.some(m => m.id === mappedMessage.id)) return prev;
                            const newMessages = [...prev, mappedMessage];
                            // Also update activeConversation to force component re-renders that strict check it
                            setActiveConversation(curr => curr ? { ...curr, messages: newMessages } : curr);
                            return newMessages;
                        });
                    }

                    setConversations((prev) => {
                        const exists = prev.find((c) => c.id === targetConvId);
                        if (exists) {
                            const updatedList = prev.map((c) => {
                                if (c.id === targetConvId) {
                                    return {
                                        ...c,
                                        lastMessageAt: mappedMessage.timestamp,
                                        messages: [mappedMessage],
                                        _count: {
                                            messages:
                                                c.id === activeConvIdRef.current
                                                    ? c._count.messages
                                                    : c._count.messages + (mappedMessage.direction === 'inbound' ? 1 : 0),
                                        },
                                    };
                                }
                                return c;
                            });
                            return updatedList.sort(
                                (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                            );
                        } else {
                            // If it's a completely new conversation we need to fetch it from the API to get contact info
                            fetchConversations();
                            return prev;
                        }
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'crm', table: 'messages' },
                (payload) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const updatedMessage = payload.new as any;
                    const messageId = updatedMessage.id;
                    const status = updatedMessage.status;
                    const conversationId = updatedMessage.conversationId || updatedMessage.conversationid || updatedMessage.conversation_id;

                    if (!conversationId) return;

                    if (activeConvIdRef.current === conversationId) {
                        setMessages((prev) => {
                            const newMessages = prev.map((m) => (m.id === messageId ? { ...m, status } : m));
                            setActiveConversation(curr => curr ? { ...curr, messages: newMessages } : curr);
                            return newMessages;
                        });
                    }

                    setConversations((prev) =>
                        prev.map((c) => {
                            if (c.id === conversationId && c.messages && c.messages[0]?.id === messageId) {
                                return {
                                    ...c,
                                    messages: [{ ...c.messages[0], status }],
                                };
                            }
                            return c;
                        })
                    );
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'crm', table: 'conversations' },
                (payload) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const updatedConversation = payload.new as any;
                    const conversationId = updatedConversation.id;
                    const botEnabled = updatedConversation.botEnabled ?? updatedConversation.botenabled ?? updatedConversation.bot_enabled;

                    if (!conversationId) return;

                    if (activeConvIdRef.current === conversationId) {
                        setActiveConversation((prev) => {
                            if (prev && prev.botEnabled !== botEnabled) {
                                return { ...prev, botEnabled };
                            }
                            return prev;
                        });
                    }

                    setConversations((prev) =>
                        prev.map((c) =>
                            c.id === conversationId ? { ...c, botEnabled } : c
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchConversations]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Alternar el estado del Bot
    const toggleBotMode = async (conversationId: string, botEnabled: boolean) => {
        try {
            await conversationService.toggleBot(conversationId, botEnabled);
            if (activeConvIdRef.current === conversationId) {
                setActiveConversation(prev => prev ? { ...prev, botEnabled } : prev);
            }
            // Update in the listing cache
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, botEnabled } : c
            ));
        } catch (error) {
            console.error('Error toggling bot:', error);
        }
    };

    return {
        conversations,
        activeConversation,
        messages,
        loading,
        filter,
        setFilter,
        selectConversation,
        setMessages,
        toggleBotMode
    };
};
