import React, { useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDropzone } from "react-dropzone";
import { useChatManager } from "../hooks/useChatManager";

// Iconos y Componentes Visuales
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Loader } from "../components/Loader";
import MessageInput from "../components/MessageInput";
import { SidebarChat } from "../components/SidebarChat";
import { ChatSkeleton } from "../components/skeletons/chatSkeleton";
import { MessageList } from "../components/MessageList";

function ChatView() {
  const { chatId } = useParams();
  const { user } = useAuth();
  
  // Extraemos toda la inteligencia del Custom Hook
  const { state, setters, actions } = useChatManager(chatId, user);
  
  // Estados puramente visuales (UI State)
  const [sidebarChatCollapsed, setSidebarChatCollapsed] = useState(false);
  const [isDragOverGlobal, setIsDragOverGlobal] = useState(false);
  const messageInputRef = useRef(null);

  const toggleChatSidebar = () => setSidebarChatCollapsed(!sidebarChatCollapsed);

  const onGlobalDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));

      setters.setFiles((prev) => [...prev, ...newFiles]);

      if (messageInputRef.current) {
        messageInputRef.current.addFilesFromGlobal(newFiles);
      }
    }
  }, [setters]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onGlobalDrop,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    onDragEnter: () => setIsDragOverGlobal(true),
    onDragLeave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOverGlobal(false);
    },
    onDropAccepted: () => setIsDragOverGlobal(false),
    onDropRejected: () => setIsDragOverGlobal(false),
  });

  return (
    <div {...getRootProps()} className="h-screen w-full overflow-hidden bg-light-bg dark:bg-dark-bg relative">
      <input {...getInputProps()} />

      {/* Overlay global de drag & drop */}
      {(isDragActive || isDragOverGlobal) && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm border-4 border-dashed border-blue-500 flex items-center justify-center z-50">
          <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <AttachFileIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Suelta los archivos aquí
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Los archivos se agregarán al mensaje</p>
          </div>
        </div>
      )}

      <div className="relative flex h-full w-full">
        {/* Overlay Sidebar Mobile */}
        {!sidebarChatCollapsed && (
          <div className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden" onClick={toggleChatSidebar}></div>
        )}

        <SidebarChat
          allChats={state.allChats}
          handleNewChat={actions.handleNewChat}
          handleDeleteChat={actions.handleDeleteChat}
          toggleChatSidebar={toggleChatSidebar}
          activeChatId={state.activeChatId}
          setActiveChatId={setters.setActiveChatId}
          sidebarChatCollapsed={sidebarChatCollapsed}
          logo={null}
          onChatUpdated={actions.handleChatUpdate}
          onError={setters.setError}
          changeAgentLoader={state.changeAgentLoader}
        />
        
        <div className="relative flex h-full flex-1 overflow-hidden">
          <div className="relative h-full flex-1 overflow-hidden">
            <div className="flex h-full w-full flex-col">
              
              {/* Header chat mobile */}
              <div className="flex w-full items-center justify-between bg-light-bg px-4 py-3 dark:bg-dark-bg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={actions.handleNewChat}
                    className="flex items-center shadow-md justify-center rounded-lg bg-light-two p-1 text-light-primary transition-all duration-200 hover:bg-light-two_d dark:bg-dark-two dark:text-dark-primary dark:hover:bg-dark-two_d hover:bg-light-bg dark:hover:text-dark-bg dark:hover:bg-dark-two_d md:hidden"
                  >
                    <EditIcon className="h-6 w-6" />
                  </button>
                </div>
                <button
                  onClick={toggleChatSidebar}
                  className="flex items-center shadow-md justify-center rounded-lg bg-light-two p-1 text-light-primary transition-all duration-200 hover:bg-light-two_d dark:bg-dark-two dark:text-dark-primary dark:hover:bg-dark-two_d hover:bg-light-bg dark:hover:text-dark-bg dark:hover:bg-dark-two_d md:hidden"
                >
                  <MenuIcon className="h-6 w-6 " />
                </button>
              </div>

              {/* Área de Mensajes */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-6 scroll-smooth">
                <div className="mx-auto max-w-3xl space-y-6">
                  {state.currentChat?.messages.length === 0 && (
                    <div className="flex flex-col items-center py-12 text-center md:py-20">
                      <h3 className="mb-3 text-xl font-bold text-light-two md:text-2xl dark:text-dark-primary">
                        ¡Hola! ¿En qué puedo ayudarte?
                      </h3>
                      <p className="max-w-md text-base text-light-two md:text-lg dark:text-dark-primary">
                        Vamos! Inicia una conversación
                      </p>
                    </div>
                  )}

                  {!state.currentChat || (state.allChats.length === 0 && state.loading) ? (
                    <ChatSkeleton messagesCount={4} />
                  ) : (
                    <MessageList
                      conversation={state.currentChat?.messages}
                      loading={state.loading}
                    />
                  )}

                  {state.loadingSendMessage && (
                    <div className="flex items-start justify-start">
                      <div className="relative min-w-0">
                        <div className="relative rounded-xl rounded-tl-none">
                          <Loader />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area (Delegando el estado visual) */}
              <div className="w-full px-1 pb-2 md:px-6 lg:mb-0">
                <MessageInput
                  ref={messageInputRef}
                  onSendMessage={actions.handleSendMessage}
                  loading={state.loadingSendMessage}
                  error={state.error}
                  disableGlobalDrop={isDragActive || isDragOverGlobal}
                  selectedAgent={state.selectedAgent}
                  handleAgentChange={actions.handleAgentChange}
                  selectedForm={state.selectedForm}
                  onChangeSelectedForm={setters.setSelectedForm}
                  onChangeCompatibilizar={actions.handleCompatibilizar}
                  currentChat={state.currentChat}
                  setCurrentChat={setters.setCurrentChat}
                  files={state.files}
                  setFiles={setters.setFiles}
                  useGlobalContext={state.useGlobalContext}
                  setUseGlobalContext={setters.setUseGlobalContext}
                  changeAgentLoader={state.changeAgentLoader}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatView;