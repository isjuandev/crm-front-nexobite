import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, LayoutTemplate } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load the emoji picker to keep initial bundle size small
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface MessageInputProps {
    onSendMessage: (message: string) => Promise<void>;
    onOpenTemplates: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    onOpenTemplates
}) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Cierra el emoji picker si se hace clic afuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const messageContent = inputText;
        setInputText('');
        setShowEmojiPicker(false);

        try {
            await onSendMessage(messageContent);
        } catch (error) {
            // Restore text on failure
            setInputText(messageContent);
        }
    };

    const onEmojiClick = (emojiObject: any) => {
        setInputText(prev => prev + emojiObject.emoji);
    };

    return (
        <form
            onSubmit={handleSend}
            className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 relative"
        >
            <div className="relative" ref={pickerRef}>
                <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 p-1 flex items-center justify-center"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                    <Smile className="w-6 h-6" />
                </button>

                {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-lg overflow-hidden">
                        <EmojiPicker onEmojiClick={onEmojiClick} autoFocusSearch={false} />
                    </div>
                )}
            </div>

            <button
                type="button"
                className="text-gray-500 hover:text-gray-700 p-1 flex items-center justify-center cursor-pointer"
                onClick={onOpenTemplates}
                title="Plantillas de Meta"
            >
                <LayoutTemplate className="w-6 h-6" />
            </button>

            <div className="flex-1 flex items-center bg-white rounded-lg px-4 py-2 border border-blue-50 focus-within:ring-1 focus-within:ring-green-400">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe un mensaje"
                    className="flex-1 outline-none bg-transparent text-gray-700"
                    autoFocus
                />
            </div>

            <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2 rounded-full flex items-center justify-center ${inputText.trim()
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    } transition-colors`}
            >
                <Send className="w-5 h-5 ml-0.5" />
            </button>
        </form>
    );
};
