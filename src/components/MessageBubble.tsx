import React, { memo } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../hooks/useConversations';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message }) => {
    const isOutbound = message.direction === 'outbound';

    const renderStatusIcon = () => {
        if (!isOutbound) return null;

        switch (message.status) {
            case 'sent':
                return <Check className="w-4 h-4 text-gray-400" />;
            case 'delivered':
                return <CheckCheck className="w-4 h-4 text-gray-400" />;
            case 'read':
                return <CheckCheck className="w-4 h-4 text-blue-500" />;
            case 'failed':
                return <span className="text-red-500 text-xs">Error</span>;
            default:
                return <Check className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div
            className={cn(
                "flex w-full mb-4",
                isOutbound ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "max-w-[75%] rounded-lg px-4 py-2 relative group",
                    isOutbound
                        ? "bg-green-100 text-green-900 rounded-tr-none"
                        : "bg-white text-gray-800 rounded-tl-none shadow-sm"
                )}
            >
                {message.type !== 'text' && message.mediaUrl && (
                    <div className="mb-2 p-2 border border-gray-200 rounded text-xs text-gray-500 flex items-center gap-2">
                        <span>📎 Contenido multimedia ({message.type})</span>
                    </div>
                )}

                <p className="text-sm whitespace-pre-wrap word-break break-words">
                    {message.content || ""}
                </p>

                <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-500">
                        {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                    {renderStatusIcon()}
                </div>
            </div>
        </div>
    );
});
MessageBubble.displayName = 'MessageBubble';
