import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon, Check } from 'lucide-react';
import { Label, Conversation } from '../hooks/useConversations';
import { cn } from './MessageBubble';
import { labelService } from '../services/api';
import { Palette } from 'lucide-react';

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
    const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
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
            // Available labels will refresh naturally if they come from parent's state
            // But we might need a way to tell the parent to refetch
        } catch (error) {
            console.error('Error creating label:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-blue-500" />
                        Gestionar Etiquetas
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="p-1 px-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded border border-blue-100 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" />
                            Nueva
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {showCreateForm && (
                    <form onSubmit={handleCreateLabel} className="p-4 bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top-4 duration-200">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <TagIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nombre de etiqueta..."
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="relative group">
                                <Palette className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/50 pointer-events-none" />
                                <input
                                    type="color"
                                    value={newLabelColor}
                                    onChange={(e) => setNewLabelColor(e.target.value)}
                                    className="w-10 h-9 p-0 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isCreating || !newLabelName.trim()}
                                className="px-4 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                            >
                                Crear
                            </button>
                        </div>
                    </form>
                )}

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-4">
                        Selecciona las etiquetas para esta conversación:
                    </p>

                    <div className="space-y-2">
                        {availableLabels.length === 0 ? (
                            <p className="text-center py-4 text-gray-400 text-sm italic">
                                No hay etiquetas disponibles. Créalas desde el panel de configuración.
                            </p>
                        ) : (
                            availableLabels.map((label) => {
                                const isAssigned = assignedLabelIds.includes(label.id);
                                return (
                                    <button
                                        key={label.id}
                                        onClick={() => isAssigned ? onRemoveLabel(label.id) : onAssignLabel(label.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                                            isAssigned
                                                ? "border-blue-200 bg-blue-50"
                                                : "border-gray-100 hover:bg-gray-50 bg-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            <span className={cn(
                                                "text-sm",
                                                isAssigned ? "font-semibold text-blue-700" : "text-gray-700"
                                            )}>
                                                {label.name}
                                            </span>
                                        </div>
                                        {isAssigned && <Check className="w-4 h-4 text-blue-600" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
};
