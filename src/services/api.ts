import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const conversationService = {
    getConversations: async (status?: string) => {
        const params = status ? { status } : {};
        const response = await api.get('/conversations', { params });
        return response.data;
    },

    getMessages: async (conversationId: string) => {
        const response = await api.get(`/conversations/${conversationId}/messages`);
        return response.data;
    },

    updateStatus: async (conversationId: string, status: 'open' | 'closed') => {
        const response = await api.put(`/conversations/${conversationId}/status`, { status });
        return response.data;
    },

    toggleBot: async (conversationId: string, botEnabled: boolean) => {
        const response = await api.put(`/conversations/${conversationId}/bot`, { botEnabled });
        return response.data;
    }
};

export const messageService = {
    sendMessage: async (conversationId: string, content: string) => {
        const response = await api.post('/messages/send', {
            conversationId,
            content,
        });
        return response.data;
    },

    getTemplates: async () => {
        const response = await api.get('/messages/templates');
        return response.data;
    },

    sendTemplate: async (conversationId: string, templateName: string, languageCode: string = 'es_MX') => {
        const response = await api.post('/messages/send-template', {
            conversationId,
            templateName,
            languageCode
        });
        return response.data;
    }
};

export default api;
