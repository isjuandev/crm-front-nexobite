import React, { useEffect, useState } from 'react';
import { X, Send, LayoutTemplate, AlertCircle, Info } from 'lucide-react';
import { messageService } from '../services/api';
import { cn } from './MessageBubble';

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
        if (isOpen) fetchTemplates();
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await messageService.getTemplates();
            setTemplates(data.filter((t: any) => t.status === 'APPROVED'));
        } catch (err) {
            console.error('Error fetching templates:', err);
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
            onClose();
        } catch (err) {
            console.error('Error enviando plantilla:', err);
            alert('Error al enviar la plantilla. Por favor intenta de nuevo.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-zoom-in border border-border overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between p-5 border-b border-border bg-(--sidebar-header) shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-(--accent-soft) flex items-center justify-center">
                            <LayoutTemplate className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground tracking-tight">Plantillas de Meta</h2>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <Info className="w-2.5 h-2.5" /> Solo contenido aprobado por Meta
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-tertiary transition-all border border-transparent hover:border-border"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </header>

                {/* Body */}
                <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-(--accent-soft) border-t-accent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-muted animate-pulse uppercase tracking-widest">
                                Sincronizando con Meta...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-7 h-7 text-error" />
                            </div>
                            <p className="text-sm font-bold text-foreground mb-3">{error}</p>
                            <button
                                onClick={fetchTemplates}
                                className="px-5 py-2 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                            <LayoutTemplate className="w-12 h-12 mb-3 text-muted" />
                            <p className="text-sm font-bold text-foreground mb-1">Sin plantillas disponibles</p>
                            <p className="text-xs text-muted">No se encontraron plantillas aprobadas en tu cuenta de Meta.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template, idx) => {
                                const bodyText = template.components.find(c => c.type === 'BODY')?.text || 'Sin contenido de texto.';
                                return (
                                    <div
                                        key={idx}
                                        className="flex flex-col bg-elevated border border-border-secondary rounded-xl p-4 hover:border-accent/30 hover:shadow-lg transition-all group animate-slide-up"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-foreground text-xs tracking-tight uppercase break-all">
                                                {template.name.replace(/_/g, ' ')}
                                            </h3>
                                            <span className="text-[9px] font-black bg-secondary text-accent px-2 py-0.5 rounded-lg border border-border uppercase ml-2 shrink-0">
                                                {template.language}
                                            </span>
                                        </div>
                                        <div className="text-xs text-(--text-secondary) font-medium mb-4 bg-secondary p-3 rounded-xl flex-1 border border-border leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                                            {bodyText}
                                        </div>
                                        <button
                                            onClick={() => handleSendTemplate(template.name, template.language)}
                                            disabled={sending}
                                            className="w-full h-9 flex items-center justify-center gap-2 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
                                            style={{ boxShadow: 'var(--shadow-primary)' }}
                                        >
                                            <Send className={cn("w-3.5 h-3.5", sending && "animate-pulse")} />
                                            {sending ? 'Enviando...' : 'Enviar Plantilla'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="px-5 py-3.5 bg-secondary border-t border-border flex justify-between items-center shrink-0">
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                        {templates.length} plantillas disponibles
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-tertiary text-foreground text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-border border border-border transition-all"
                    >
                        Cerrar
                    </button>
                </footer>
            </div>
        </div>
    );
};