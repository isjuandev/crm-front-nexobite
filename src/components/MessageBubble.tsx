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
                return <Check className="w-3.5 h-3.5 text-bubble-outbound-foreground opacity-50" />;
            case 'delivered':
                return <CheckCheck className="w-3.5 h-3.5 text-bubble-outbound-foreground opacity-60" />;
            case 'read':
                return <CheckCheck className="w-3.5 h-3.5 text-info" />;
            case 'failed':
                return <span className="text-error text-[9px] font-black uppercase">Error</span>;
            default:
                return <Check className="w-3.5 h-3.5 text-bubble-outbound-foreground opacity-50" />;
        }
    };

    return (
        <div className={cn("flex w-full mb-3 animate-slide-up", isOutbound ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[75%] px-4 py-2.5 relative shadow-sm transition-all",
                isOutbound
                    ? "bg-bubble-outbound text-bubble-outbound-foreground rounded-2xl rounded-tr-sm"
                    : "bg-bubble-inbound text-bubble-inbound-foreground rounded-2xl rounded-tl-sm border border-border-secondary"
            )}>
                {message.type !== 'text' && message.mediaUrl && (
                    <div className="mb-2 p-2.5 bg-black/10 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-black/10">
                        <span>📎</span>
                        <span className="opacity-70">Multimedia ({message.type})</span>
                    </div>
                )}

                <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed font-medium">
                    {message.content || ''}
                </p>

                <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                    <span className="text-[10px] font-medium">
                        {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                    {renderStatusIcon()}
                </div>
            </div>
        </div>
    );
});
MessageBubble.displayName = 'MessageBubble';