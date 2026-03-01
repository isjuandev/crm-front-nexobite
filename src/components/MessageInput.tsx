import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, LayoutTemplate, Paperclip } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from './MessageBubble';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface MessageInputProps {
    onSendMessage: (message: string) => Promise<void>;
    onOpenTemplates: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onOpenTemplates }) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        const messageContent = inputText;
        setInputText('');
        setShowEmojiPicker(false);
        try {
            await onSendMessage(messageContent);
        } catch {
            setInputText(messageContent);
        }
    };

    const onEmojiClick = (emojiObject: any) => {
        setInputText(prev => prev + emojiObject.emoji);
    };

    return (
        <form
            onSubmit={handleSend}
            className="px-6 py-4 flex items-center gap-3 bg-(--sidebar-header) backdrop-blur-xl border-t border-border/10"
        >
            {/* Left actions */}
            <div className="flex items-center gap-1">
                <div className="relative" ref={pickerRef}>
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2.5 rounded-2xl text-muted hover:text-accent hover:bg-accent/10 transition-all active:scale-90"
                        title="Emojis"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-16 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden animate-slide-up border border-border">
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                autoFocusSearch={false}
                                width={320}
                                height={380}
                                skinTonesDisabled
                                searchPlaceHolder="Buscar emoji..."
                            />
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onOpenTemplates}
                    className="p-2.5 rounded-2xl text-muted hover:text-accent hover:bg-accent/10 transition-all active:scale-90"
                    title="Plantillas de Meta"
                >
                    <LayoutTemplate className="w-5 h-5" />
                </button>

                <button
                    type="button"
                    className="p-2.5 rounded-2xl text-muted hover:text-accent hover:bg-accent/10 transition-all hidden sm:flex active:scale-90"
                    title="Adjuntar"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
            </div>

            {/* Input Container */}
            <div className="flex-1 flex items-center bg-elevated/40 rounded-2xl px-5 py-0.5 border border-border/20 focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/5 transition-all shadow-sm group">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 py-2.5 outline-none bg-transparent text-foreground placeholder:text-muted/60 text-[14px] font-medium"
                    autoFocus
                />
            </div>

            {/* Send button */}
            <button
                type="submit"
                disabled={!inputText.trim()}
                className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0",
                    inputText.trim()
                        ? "bg-primary text-white hover:bg-primary-hover hover:scale-105 active:scale-95 shadow-primary/20"
                        : "bg-tertiary/50 text-muted cursor-not-allowed opacity-50 border border-border/10"
                )}
            >
                <Send className={cn("w-4.5 h-4.5 transition-all",
                    inputText.trim() ? "translate-x-px -translate-y-px opacity-100" : "opacity-40"
                )} />
            </button>
        </form>
    );
};