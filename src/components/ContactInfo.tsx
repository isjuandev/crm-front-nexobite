import React from 'react';
import { X, User, Phone, Calendar, Info, Building2, AlignLeft, Plus } from 'lucide-react';
import { Conversation } from '../hooks/useConversations';
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
        <div className="w-80 md:w-96 bg-background border-l border-border h-full flex flex-col shrink-0 animate-slide-left z-20 shadow-xl">
            {/* Header */}
            <header className="h-16 bg-(--sidebar-header) backdrop-blur-xl flex items-center justify-between px-4 border-b border-border">
                <h2 className="font-bold text-foreground text-sm tracking-tight">Detalles del Perfil</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-tertiary transition-all text-muted hover:text-foreground border border-transparent hover:border-border"
                >
                    <X className="w-4 h-4" />
                </button>
            </header>

            {/* Profile Summary */}
            <div className="p-6 flex flex-col items-center bg-secondary border-b border-border relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-16 opacity-10"
                    style={{ background: 'var(--brand-gradient)' }} />

                <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-elevated flex items-center justify-center overflow-hidden border-4 border-background shadow-md">
                        {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-accent" />
                        )}
                    </div>
                </div>

                <h3 className="text-base font-bold text-foreground leading-tight text-center truncate w-full px-2">
                    {contact.name || 'Sin Nombre'}
                </h3>
                <p className="text-xs text-accent flex items-center gap-1.5 mt-1.5 bg-(--accent-soft) px-3 py-1 rounded-full border border-(--accent-soft) font-semibold">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                </p>
                <div className="mt-3">
                    <span className="px-3 py-1 bg-elevated text-(--text-secondary) text-[9px] font-black uppercase tracking-widest rounded-lg border border-border">
                        {contact.interestStatus || 'Interesado'}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-(--sidebar-header) p-1 mx-4 mt-4 rounded-xl border border-border">
                {(['overview', 'notes', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg",
                            activeTab === tab
                                ? "bg-elevated text-foreground border border-border shadow-sm"
                                : "text-muted hover:text-foreground hover:bg-tertiary"
                        )}
                    >
                        {tab === 'overview' ? 'Perfil' : tab === 'notes' ? 'Notas' : 'Historial'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        <section>
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                                <Info className="w-3 h-3 text-accent" /> Información CRM
                            </h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Empresa', value: contact.company || 'No especificado', Icon: Building2 },
                                    { label: 'Email', value: contact.email || 'No especificado', Icon: Phone },
                                    { label: 'Servicio Sugerido', value: contact.recommendedService || 'IA Automation', Icon: Info },
                                ].map(({ label, value, Icon }) => (
                                    <div key={label} className="p-3 bg-elevated rounded-xl border border-border-secondary hover:border-(--accent-soft) transition-colors">
                                        <p className="text-[9px] text-muted font-black uppercase tracking-wider mb-1">{label}</p>
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
                                            <p className="text-xs text-foreground font-semibold truncate">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-accent" /> Metadatos
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2.5 bg-tertiary rounded-lg border border-border-secondary">
                                    <span className="text-xs font-semibold text-(--text-secondary)">Creado el</span>
                                    <span className="text-xs font-bold text-foreground">
                                        {format(new Date(contact.createdAt), "dd MMM yyyy", { locale: es })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-tertiary rounded-lg border border-border-secondary">
                                    <span className="text-xs font-semibold text-(--text-secondary)">Última actividad</span>
                                    <span className="text-xs font-bold text-accent">
                                        Hoy, {format(new Date(conversation.lastMessageAt), "HH:mm")}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex flex-col animate-fade-in">
                        <form onSubmit={handleAddNote} className="mb-6">
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Escribe una nota privada sobre este contacto..."
                                className="w-full p-3 text-xs bg-tertiary border border-border rounded-xl focus:ring-2 focus:ring-(--accent)/20 focus:border-accent transition-all outline-none min-h-[100px] resize-none text-foreground placeholder:text-muted font-medium"
                            />
                            <button
                                type="submit"
                                disabled={isSubmittingNote || !noteContent.trim()}
                                className="mt-2 w-full py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
                                style={{ boxShadow: 'var(--shadow-accent)' }}
                            >
                                {isSubmittingNote
                                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Plus className="w-3.5 h-3.5" />}
                                Guardar Nota
                            </button>
                        </form>

                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.25em]">Notas Recientes</h4>
                            {contact.contactNotes && contact.contactNotes.length > 0 ? (
                                contact.contactNotes.map((note) => (
                                    <div key={note.id} className="p-3.5 bg-elevated border border-border rounded-xl hover:border-(--accent-soft) transition-colors">
                                        <p className="text-xs text-(--text-secondary) mb-2.5 leading-relaxed font-medium">{note.content}</p>
                                        <div className="flex justify-between items-center border-t border-border-secondary pt-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 rounded bg-(--accent-soft) flex items-center justify-center">
                                                    <User className="w-2.5 h-2.5 text-accent" />
                                                </div>
                                                <span className="text-[9px] font-black text-foreground uppercase">{note.createdBy || 'Agente'}</span>
                                            </div>
                                            <span className="text-[9px] text-muted font-medium">
                                                {format(new Date(note.createdAt), "dd/MM HH:mm")}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 opacity-30">
                                    <AlignLeft className="w-8 h-8 mx-auto mb-2 text-muted" />
                                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Sin notas</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fade-in">
                        <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.25em] mb-4">Línea de Tiempo</h4>
                        <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-linear-to-b before:from-accent before:to-border">
                            <div className="relative">
                                <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-accent border-2 border-background" />
                                <div className="p-3 bg-elevated border border-(--accent-soft) rounded-xl">
                                    <p className="text-xs font-bold text-foreground">Chat Actual</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[9px] text-success font-black uppercase bg-green-500/10 px-2 py-0.5 rounded">
                                            {conversation.status}
                                        </span>
                                        <span className="text-[9px] text-muted font-medium">
                                            {format(new Date(conversation.lastMessageAt), "dd/MM HH:mm")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative opacity-40">
                                <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-muted border-2 border-background" />
                                <div className="p-3 bg-tertiary rounded-xl border border-transparent">
                                    <p className="text-xs font-medium text-muted">Conversación finalizada</p>
                                    <p className="text-[9px] text-muted mt-1">12 de Feb, 2024</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="p-4 bg-(--sidebar-header) border-t border-border">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-error hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 uppercase tracking-wider">
                    Bloquear Contacto
                </button>
            </footer>
        </div>
    );
};