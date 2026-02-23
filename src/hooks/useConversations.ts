import { useState, useEffect, useCallback } from 'react';
import { conversationService } from '../services/api';
import { useSocket } from './useSocket';

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'open' | 'closed'>('open');

    const { socket } = useSocket();

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
        fetchMessages(conversation.id);
    };

    // Socket: Escuchar nuevos mensajes
    useEffect(() => {
        if (!socket) return;

        socket.on('newMessage', (payload: any) => {
            const { message, conversation, contact } = payload;
            const targetConvId = message.conversationId;

            // Actualizar mensajes si es la conversación activa
            if (activeConversation?.id === targetConvId) {
                setMessages(prev => [...prev, message]);
                // Como estamos viéndola, deberíamos marcarlo como leído (TODO)
            }

            // Actualizar vista de lista de conversaciones
            setConversations(prev => {
                const exists = prev.find(c => c.id === targetConvId);

                if (exists) {
                    // Si existe, la actualizamos y la movemos arriba
                    const updatedList = prev.map(c => {
                        if (c.id === targetConvId) {
                            return {
                                ...c,
                                lastMessageAt: message.timestamp,
                                messages: [message],
                                _count: {
                                    messages: c.id === activeConversation?.id
                                        ? c._count.messages
                                        : c._count.messages + (message.direction === 'inbound' ? 1 : 0)
                                }
                            };
                        }
                        return c;
                    });
                    return updatedList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
                } else {
                    // Si es nueva y viene en el payload (sólo para inbound usualmente)
                    if (conversation && contact) {
                        const newConv: Conversation = {
                            ...conversation,
                            contact,
                            messages: [message],
                            _count: { messages: message.direction === 'inbound' ? 1 : 0 }
                        };
                        return [newConv, ...prev];
                    }
                    return prev;
                }
            });
        });

        socket.on('messageStatus', (payload: any) => {
            const { messageId, status, conversationId } = payload;

            // Actualizar en la lista de mensajes (si está activa)
            if (activeConversation?.id === conversationId) {
                setMessages(prev => prev.map(m =>
                    m.id === messageId ? { ...m, status } : m
                ));
            }

            // Actualizar el "último mensaje" de la lista de conversaciones
            setConversations(prev => prev.map(c => {
                if (c.id === conversationId && c.messages && c.messages[0]?.id === messageId) {
                    return {
                        ...c,
                        messages: [{ ...c.messages[0], status }]
                    };
                }
                return c;
            }));
        });

        return () => {
            socket.off('newMessage');
            socket.off('messageStatus');
        };
    }, [socket, activeConversation]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Alternar el estado del Bot
    const toggleBotMode = async (conversationId: string, botEnabled: boolean) => {
        try {
            await conversationService.toggleBot(conversationId, botEnabled);
            if (activeConversation?.id === conversationId) {
                setActiveConversation({ ...activeConversation, botEnabled });
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
