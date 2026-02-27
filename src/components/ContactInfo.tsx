import React from 'react';
import { X, User, Phone, Calendar, Info, Building2, Tag, Star, AlignLeft, Plus } from 'lucide-react';
import { Conversation, Label } from '../hooks/useConversations';
import { cn } from './MessageBubble';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContactInfoProps {
    conversation: Conversation | null;
    onClose: () => void;
    isOpen: boolean;
    onAddNote: (contactId: string, content: string) => Promise<any>;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ conversation, onClose, isOpen, onAddNote }) => {
    const [activeTab, setActiveTab] = React.useState<'overview' | 'notes' | 'history'>('overview');
    const [noteContent, setNoteContent] = React.useState('');
    const [isSubmittingNote, setIsSubmittingNote] = React.useState(false);

    if (!isOpen || !conversation) return null;

    const contact = conversation.contact;

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim()) return;

        try {
            setIsSubmittingNote(true);
            await onAddNote(contact.id, noteContent);
            setNoteContent('');
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setIsSubmittingNote(false);
        }
    };

    return (
        <div className="w-80 md:w-96 bg-white border-l border-gray-200 h-full flex flex-col flex-shrink-0 animate-in slide-in-from-right-8 duration-200 shadow-xl z-20">
            {/* Header */}
            <div className="h-16 bg-white flex items-center justify-between px-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Detalles del Perfil</h2>
                <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full transition-colors text-gray-400">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Profile Summary */}
            <div className="p-6 flex flex-col items-center bg-gray-50/50">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-sm ring-1 ring-blue-50">
                    {contact.avatarUrl ? (
                        <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-12 h-12 text-blue-500" />
                    )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    {contact.name || 'Sin Nombre'}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone}
                </p>

                {/* Status Badge */}
                <div className="mt-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {contact.interestStatus || 'Interesado'}
                    </span>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-100">
                {(['overview', 'notes', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                            activeTab === tab
                                ? "border-blue-600 text-blue-600 bg-blue-50/30"
                                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        {tab === 'overview' ? 'Perfil' : tab === 'notes' ? 'Notas' : 'Historial'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <section>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Información CRM
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Empresa</p>
                                    <p className="text-sm text-gray-800 font-medium">{contact.company || 'No especificado'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Email</p>
                                    <p className="text-sm text-gray-800 font-medium">{contact.email || 'No especificado'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Servicio Sugerido</p>
                                    <p className="text-sm text-gray-800 font-medium">{contact.recommendedService || 'IA Automation'}</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Metadatos
                            </h4>
                            <div className="text-xs text-gray-500 space-y-2 px-1">
                                <div className="flex justify-between">
                                    <span>Creado el:</span>
                                    <span className="font-medium">{format(new Date(contact.createdAt), "dd MMM yyyy", { locale: es })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Última actividad:</span>
                                    <span className="font-medium text-blue-600">Hoy, {format(new Date(conversation.lastMessageAt), "HH:mm")}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex flex-col h-full">
                        {/* Add Note Form */}
                        <form onSubmit={handleAddNote} className="mb-6">
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Escribe una nota privada sobre este contacto..."
                                className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none min-h-[100px] resize-none"
                            />
                            <button
                                type="submit"
                                disabled={isSubmittingNote}
                                className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmittingNote ? <span className="animate-spin text-lg">◌</span> : <Plus className="w-4 h-4" />}
                                Guardar Nota
                            </button>
                        </form>

                        {/* Notes List */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Notas Recientes</h4>
                            {contact.contactNotes && contact.contactNotes.length > 0 ? (
                                contact.contactNotes.map((note) => (
                                    <div key={note.id} className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                                        <p className="text-sm text-gray-800 mb-2 leading-relaxed">{note.content}</p>
                                        <div className="flex justify-between items-center border-t border-yellow-100 pt-2">
                                            <span className="text-[10px] font-bold text-yellow-700 uppercase">{note.createdBy || 'Agente'}</span>
                                            <span className="text-[10px] text-gray-400">{format(new Date(note.createdAt), "dd/MM HH:mm")}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-30">
                                    <AlignLeft className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-xs">No hay notas registradas</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Línea de Tiempo</h4>

                        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
                            <div className="relative">
                                <div className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-50" />
                                <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <p className="text-xs font-bold text-gray-800">Chat Actual</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-green-600 font-bold uppercase">{conversation.status}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">{format(new Date(conversation.lastMessageAt), "dd/MM HH:mm")}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline items simulation if history exists */}
                            <div className="relative opacity-50">
                                <div className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
                                <div className="p-3 bg-gray-50 border border-transparent rounded-xl">
                                    <p className="text-xs font-medium text-gray-500">Conversación finalizada</p>
                                    <p className="text-[10px] text-gray-400 mt-1">12 de Feb, 2024</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    Bloquear Contacto
                </button>
            </div>
        </div>
    );
};
