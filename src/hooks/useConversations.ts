import { useState, useEffect, useCallback, useRef } from 'react';
import { conversationService, labelService, contactService } from '../services/api';
import { supabase } from '../lib/supabase';
import { io, Socket } from 'socket.io-client';

export interface Label {
    id: string;
    name: string;
    color: string;
    createdAt: string;
}

export interface ConversationLabel {
    conversationId: string;
    labelId: string;
    label: Label;
}

export interface Note {
    id: string;
    contactId: string;
    content: string;
    createdBy?: string;
    createdAt: string;
}

export interface Contact {
    createdAt: string;
    updatedAt: string;
    id: string;
    phone: string;
    name: string;
    email?: string | null;
    company?: string | null;
    avatarUrl?: string | null;
    customFields?: any | null;
    interestStatus: string;
    recommendedService?: string | null;
    notes?: string | null;
    contactNotes?: Note[];
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
    status: 'open' | 'closed' | 'pending' | 'unread';
    botEnabled: boolean;
    lastMessageAt: string;
    contact: Contact;
    messages: Message[];
    labels: ConversationLabel[];
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
    const [filter, setFilter] = useState<'all' | 'open' | 'pending' | 'unread' | 'closed'>('all');
    const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Cargar lista de conversaciones
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            const statusFilter = filter === 'all' ? undefined : filter;
            const data = await conversationService.getConversations(statusFilter);
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // Cargar todas las etiquetas disponibles
    const fetchLabels = useCallback(async () => {
        try {
            const data = await labelService.getLabels();
            setAvailableLabels(data);
        } catch (error) {
            console.error('Error fetching labels:', error);
        }
    }, []);

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

        // Socket.io para eventos de conversación (Labels, Status)
        if (!socketRef.current) {
            socketRef.current = io(API_URL);

            socketRef.current.on('conversation:updated', (data: any) => {
                console.log('🔄 Conversación actualizada:', data);
                const { id, type } = data;

                if (type === 'status_updated') {
                    setConversations(prev => prev.map(c =>
                        c.id === id ? { ...c, status: data.status } : c
                    ));
                    if (activeConvIdRef.current === id) {
                        setActiveConversation(prev => prev ? { ...prev, status: data.status } : prev);
                    }
                } else if (type === 'new_message') {
                    // Solo actualizamos el status a unread si no es la activa
                    setConversations(prev => prev.map(c =>
                        c.id === id ? { ...c, status: 'unread' } : c
                    ));
                } else if (type === 'label_added') {
                    setConversations(prev => prev.map(c => {
                        if (c.id === id) {
                            const labelExists = c.labels.some(l => l.labelId === data.label.id);
                            if (labelExists) return c;
                            return {
                                ...c,
                                labels: [...c.labels, { conversationId: id, labelId: data.label.id, label: data.label }]
                            };
                        }
                        return c;
                    }));
                    if (activeConvIdRef.current === id) {
                        setActiveConversation(prev => {
                            if (!prev) return null;
                            const labelExists = prev.labels.some(l => l.labelId === data.label.id);
                            if (labelExists) return prev;
                            return {
                                ...prev,
                                labels: [...prev.labels, { conversationId: id, labelId: data.label.id, label: data.label }]
                            };
                        });
                    }
                } else if (type === 'label_removed') {
                    setConversations(prev => prev.map(c => {
                        if (c.id === id) {
                            return {
                                ...c,
                                labels: c.labels.filter(l => l.labelId !== data.labelId)
                            };
                        }
                        return c;
                    }));
                    if (activeConvIdRef.current === id) {
                        setActiveConversation(prev => prev ? {
                            ...prev,
                            labels: prev.labels.filter(l => l.labelId !== data.labelId)
                        } : null);
                    }
                }
            });
        }

        return () => {
            supabase.removeChannel(channel);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [fetchConversations, API_URL]);

    useEffect(() => {
        fetchConversations();
        fetchLabels();
    }, [fetchConversations, fetchLabels]);

    // Actualizar estado de la conversación
    const changeStatus = async (conversationId: string, status: 'open' | 'closed' | 'pending' | 'unread') => {
        try {
            await conversationService.updateStatus(conversationId, status);
            // El estado se actualizará vía socket.io o manualmente aquí si queremos optimismo
        } catch (error) {
            console.error('Error changing status:', error);
        }
    };

    // Agregar nota a contacto
    const addContactNote = async (contactId: string, content: string) => {
        try {
            const newNote = await contactService.addNote(contactId, content, 'Agente'); // Hardcoded 'Agente' for now
            if (activeConversation && activeConversation.contact.id === contactId) {
                setActiveConversation(prev => prev ? {
                    ...prev,
                    contact: {
                        ...prev.contact,
                        contactNotes: [newNote, ...(prev.contact.contactNotes || [])]
                    }
                } : null);
            }
            return newNote;
        } catch (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    };

    // Asignar etiqueta
    const assignLabel = async (conversationId: string, labelId: string) => {
        try {
            await conversationService.assignLabel(conversationId, labelId);
        } catch (error) {
            console.error('Error assigning label:', error);
        }
    };

    // Quitar etiqueta
    const removeLabel = async (conversationId: string, labelId: string) => {
        try {
            await conversationService.removeLabel(conversationId, labelId);
        } catch (error) {
            console.error('Error removing label:', error);
        }
    };

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
        availableLabels,
        selectConversation,
        setMessages,
        toggleBotMode,
        changeStatus,
        addContactNote,
        assignLabel,
        removeLabel,
        fetchConversations,
        fetchLabels
    };
};
