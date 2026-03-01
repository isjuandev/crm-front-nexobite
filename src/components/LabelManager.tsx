import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon, Check, Palette } from 'lucide-react';
import { Label, Conversation } from '../hooks/useConversations';
import { cn } from './MessageBubble';
import { labelService } from '../services/api';

interface LabelManagerProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation;
    availableLabels: Label[];
    onAssignLabel: (labelId: string) => void;
    onRemoveLabel: (labelId: string) => void;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
    isOpen,
    onClose,
    conversation,
    availableLabels,
    onAssignLabel,
    onRemoveLabel
}) => {
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#ed8936');
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    if (!isOpen) return null;

    const assignedLabelIds = conversation.labels.map(l => l.labelId);

    const handleCreateLabel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabelName.trim()) return;
        try {
            setIsCreating(true);
            await labelService.createLabel(newLabelName, newLabelColor);
            setNewLabelName('');
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating label:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in border border-border">
                {/* Header */}
                <header className="flex items-center justify-between p-5 border-b border-border bg-(--sidebar-header)">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-(--accent-soft) flex items-center justify-center">
                            <TagIcon className="w-4 h-4 text-accent" />
                        </div>
                        <h3 className="text-base font-bold text-foreground tracking-tight">Gestionar Etiquetas</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-lg border",
                                showCreateForm
                                    ? "bg-tertiary text-foreground border-border"
                                    : "bg-accent text-white border-transparent shadow-md hover:scale-[1.02]"
                            )}
                        >
                            {showCreateForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {showCreateForm ? 'Cancelar' : 'Nueva'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-tertiary transition-all border border-transparent hover:border-border"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Create Form */}
                {showCreateForm && (
                    <form onSubmit={handleCreateLabel} className="p-4 bg-secondary border-b border-border animate-slide-up">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <TagIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted" />
                                <input
                                    type="text"
                                    placeholder="Nombre de etiqueta..."
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-xs bg-elevated border border-border rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-foreground placeholder:text-muted font-medium transition-all"
                                    autoFocus
                                />
                            </div>
                            <input
                                type="color"
                                value={newLabelColor}
                                onChange={(e) => setNewLabelColor(e.target.value)}
                                className="w-10 h-9 p-0.5 border border-border bg-elevated cursor-pointer rounded-lg overflow-hidden hover:scale-105 transition-transform"
                            />
                            <button
                                type="submit"
                                disabled={isCreating || !newLabelName.trim()}
                                className="px-3 bg-accent text-white rounded-lg text-xs font-black hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {isCreating
                                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Crear'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Labels List */}
                <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-3">
                        Etiquetas de esta conversación
                    </p>
                    <div className="space-y-2">
                        {availableLabels.length === 0 ? (
                            <div className="text-center py-10 bg-secondary rounded-xl border border-dashed border-border">
                                <TagIcon className="w-7 h-7 mx-auto mb-2 text-muted opacity-30" />
                                <p className="text-xs font-semibold text-muted">No hay etiquetas disponibles</p>
                            </div>
                        ) : (
                            availableLabels.map((label) => {
                                const isAssigned = assignedLabelIds.includes(label.id);
                                return (
                                    <button
                                        key={label.id}
                                        onClick={() => isAssigned ? onRemoveLabel(label.id) : onAssignLabel(label.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98]",
                                            isAssigned
                                                ? "border-accent/30 bg-(--accent-soft)"
                                                : "border-border-secondary hover:border-accent/20 hover:bg-tertiary bg-elevated"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-black/10 shrink-0"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            <span className={cn(
                                                "text-sm font-semibold",
                                                isAssigned ? "text-accent" : "text-(--text-secondary)"
                                            )}>
                                                {label.name}
                                            </span>
                                        </div>
                                        {isAssigned && (
                                            <div className="w-5 h-5 rounded-lg bg-accent flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-4 bg-secondary border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                        style={{ boxShadow: 'var(--shadow-accent)' }}
                    >
                        Confirmar
                    </button>
                </footer>
            </div>
        </div>
    );
};