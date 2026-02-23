import React from 'react';
import { X, User, Phone, Calendar, Info } from 'lucide-react';
import { Conversation } from '../hooks/useConversations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContactInfoProps {
    conversation: Conversation | null;
    onClose: () => void;
    isOpen: boolean;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ conversation, onClose, isOpen }) => {
    if (!isOpen || !conversation) return null;

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col flex-shrink-0 animate-in slide-in-from-right-8 duration-200">
            {/* Header */}
            <div className="h-16 bg-[#f0f2f5] flex items-center gap-4 px-4 border-b border-gray-200">
                <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full transition-colors text-gray-600">
                    <X className="w-5 h-5" />
                </button>
                <h2 className="font-semibold text-gray-800">Info. del contacto</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Profile Card */}
                <div className="bg-white p-6 flex flex-col items-center border-b border-gray-200 shadow-sm">
                    <div className="w-40 h-40 rounded-full bg-slate-200 flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-md">
                        <User className="w-20 h-20 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-medium text-gray-900 mb-1">
                        {conversation.contact.name || 'Sin Nombre'}
                    </h2>
                    <p className="text-gray-500 text-lg flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {conversation.contact.phone}
                    </p>
                </div>

                {/* Info Items */}
                <div className="bg-white mt-3 p-4 border-y border-gray-200 shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Acerca de
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Cliente desde
                            </p>
                            <p className="text-gray-800">
                                {conversation.contact.createdAt
                                    ? format(new Date(conversation.contact.createdAt), "dd 'de' MMMM, yyyy", { locale: es })
                                    : 'Desconocido'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 mt-4 space-y-3">
                    <button className="w-full text-red-500 font-medium p-3 bg-red-50 hover:bg-red-100 rounded-lg flex justify-center items-center transition-colors">
                        Reportar contacto
                    </button>
                    <button className="w-full text-gray-700 font-medium p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex justify-center items-center transition-colors">
                        Bloquear contacto
                    </button>
                </div>
            </div>
        </div>
    );
};
