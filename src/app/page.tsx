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
    <main className="flex h-screen w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Columna Izquierda: Lista de Conversaciones */}
      <ConversationList
        conversations={conversations}
        activeConversation={activeConversation}
        onSelect={(conv) => {
          selectConversation(conv);
          if (window.innerWidth < 1024) setShowInfo(false);
        }}
        filter={filter}
        setFilter={setFilter}
        loading={loading}
      />

      {/* Columna Central: Ventana de Chat */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ChatWindow
          activeConversation={activeConversation}
          messages={messages}
          availableLabels={availableLabels}
          onToggleBot={toggleBotMode}
          onChangeStatus={changeStatus}
          onAssignLabel={assignLabel}
          onRemoveLabel={removeLabel}
          onShowInfo={activeConversation ? () => setShowInfo(true) : undefined}
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