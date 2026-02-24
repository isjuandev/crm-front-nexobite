import React, { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { messageService } from '../services/api';

interface TemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
}

interface Template {
    name: string;
    language: string;
    status: string;
    category: string;
    components: any[];
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, conversationId }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await messageService.getTemplates();
            // Filtrar solo las aprobadas
            const approvedTemplates = data.filter((t: any) => t.status === 'APPROVED');
            setTemplates(approvedTemplates);
        } catch (err) {
            console.error('Error feching templates:', err);
            setError('Error al cargar las plantillas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendTemplate = async (templateName: string, languageCode: string) => {
        if (!confirm(`¿Estás seguro de enviar la plantilla "${templateName}"?`)) return;

        try {
            setSending(true);
            await messageService.sendTemplate(conversationId, templateName, languageCode);
            onClose(); // Cerrar al enviar
        } catch (err) {
            console.error('Error enviando plantilla:', err);
            alert('Error al enviar la plantilla. Por favor intenta de nuevo.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Plantillas de Meta</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-4">{error}</div>
                    ) : templates.length === 0 ? (
                        <div className="text-gray-500 text-center py-10">No hay plantillas aprobadas disponibles.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template, idx) => {
                                // Encontrar el componente body para mostrar el preview
                                const bodyComponent = template.components.find(c => c.type === 'BODY');
                                const bodyText = bodyComponent ? bodyComponent.text : 'Sin contenido de texto.';

                                return (
                                    <div key={idx} className="border rounded-lg p-4 flex flex-col hover:border-green-400 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-gray-800 break-words">{template.name}</h3>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                {template.language}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded flex-1">
                                            {/* Si tiene variables {{1}}, mostrar tal cual */}
                                            {bodyText}
                                        </div>
                                        <button
                                            onClick={() => handleSendTemplate(template.name, template.language)}
                                            disabled={sending}
                                            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            {sending ? 'Enviando...' : 'Enviar plantilla'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
