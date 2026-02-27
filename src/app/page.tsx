"use client";

import { useState } from 'react';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { ContactInfo } from '@/components/ContactInfo';
import { useConversations } from '@/hooks/useConversations';

export default function Home() {
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    filter,
    setFilter,
    availableLabels,
    selectConversation,
    toggleBotMode,
    changeStatus,
    assignLabel,
    removeLabel,
    addContactNote
  } = useConversations();

  const [showInfo, setShowInfo] = useState(false);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white text-gray-900 font-sans shadow-2xl relative">
      {/* Columna Izquierda: Lista de Conversaciones */}
      <ConversationList
        conversations={conversations}
        activeConversation={activeConversation}
        onSelect={(conv) => {
          selectConversation(conv);
          // Ocultar info al cambiar de chat en pantallas pequeñas
          if (window.innerWidth < 1024) setShowInfo(false);
        }}
        filter={filter}
        setFilter={setFilter}
        loading={loading}
      />

      {/* Columna Central: Ventana de Chat */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Usamos un pequeño botón superior derecho para abrir la info lateral en caso de que esté cerrado */}
        {activeConversation && !showInfo && (
          <button
            onClick={() => setShowInfo(true)}
            className="absolute top-4 right-4 z-10 hidden lg:flex bg-white/80 p-2 rounded-full shadow-sm hover:bg-white text-gray-600 transition-colors"
            title="Ver información del contacto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          </button>
        )}

        <ChatWindow
          activeConversation={activeConversation}
          messages={messages}
          availableLabels={availableLabels}
          onToggleBot={toggleBotMode}
          onChangeStatus={changeStatus}
          onAssignLabel={assignLabel}
          onRemoveLabel={removeLabel}
        />
      </div>

      {/* Columna Derecha: Información del Contacto */}
      {showInfo && activeConversation && (
        <ContactInfo
          conversation={activeConversation}
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
          onAddNote={addContactNote}
        />
      )}
    </main>
  );
}
