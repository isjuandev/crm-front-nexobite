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

    updateStatus: async (conversationId: string, status: 'open' | 'closed' | 'pending' | 'unread') => {
        const response = await api.patch(`/conversations/${conversationId}/status`, { status });
        return response.data;
    },

    assignLabel: async (conversationId: string, labelId: string) => {
        const response = await api.post(`/conversations/${conversationId}/labels`, { labelId });
        return response.data;
    },

    removeLabel: async (conversationId: string, labelId: string) => {
        const response = await api.delete(`/conversations/${conversationId}/labels/${labelId}`);
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

export const labelService = {
    getLabels: async () => {
        const response = await api.get('/labels');
        return response.data;
    },

    createLabel: async (name: string, color: string) => {
        const response = await api.post('/labels', { name, color });
        return response.data;
    },

    deleteLabel: async (id: string) => {
        const response = await api.delete(`/labels/${id}`);
        return response.data;
    }
};

export const contactService = {
    getContacts: async (search?: string) => {
        const params = search ? { search } : {};
        const response = await api.get('/contacts', { params });
        return response.data;
    },

    getContact: async (id: string) => {
        const response = await api.get(`/contacts/${id}`);
        return response.data;
    },

    updateContact: async (id: string, data: any) => {
        const response = await api.patch(`/contacts/${id}`, data);
        return response.data;
    },

    getContactConversations: async (id: string) => {
        const response = await api.get(`/contacts/${id}/conversations`);
        return response.data;
    },

    addNote: async (id: string, content: string, createdBy?: string) => {
        const response = await api.post(`/contacts/${id}/notes`, { content, createdBy });
        return response.data;
    }
};

export default api;
