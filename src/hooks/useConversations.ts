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
                    const message = payload.new as Message;
                    const targetConvId = message.conversationId;

                    // Fetch the full conversation details to construct the object properly if necessary
                    // but usually, we just update the cached lists.
                    if (activeConvIdRef.current === targetConvId) {
                        setMessages((prev) => {
                            if (prev.some(m => m.id === message.id)) return prev;
                            return [...prev, message];
                        });
                    }

                    setConversations((prev) => {
                        const exists = prev.find((c) => c.id === targetConvId);
                        if (exists) {
                            const updatedList = prev.map((c) => {
                                if (c.id === targetConvId) {
                                    return {
                                        ...c,
                                        lastMessageAt: message.timestamp,
                                        messages: [message],
                                        _count: {
                                            messages:
                                                c.id === activeConvIdRef.current
                                                    ? c._count.messages
                                                    : c._count.messages + (message.direction === 'inbound' ? 1 : 0),
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
                    const updatedMessage = payload.new as Message;
                    const { id: messageId, status, conversationId } = updatedMessage;

                    if (activeConvIdRef.current === conversationId) {
                        setMessages((prev) =>
                            prev.map((m) => (m.id === messageId ? { ...m, status } : m))
                        );
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
                    const updatedConversation = payload.new as Conversation;
                    const { id: conversationId, botEnabled } = updatedConversation;

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
