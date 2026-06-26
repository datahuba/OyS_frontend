import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, apiClient2 } from "../api/axios";
import { chatService } from "../api/chat-api";
import { alert } from "../utils/alert";

export const useChatManager = (chatId, user) => {
  const navigate = useNavigate();

  // Estados Globales del Chat
  const [currentChat, setCurrentChat] = useState(null);
  const [allChats, setAllChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  
  // Estados de Carga y Errores
  const [loading, setLoading] = useState(true);
  const [loadingSendMessage, setLoadingSendMessage] = useState(false);
  const [changeAgentLoader, setChangeAgentLoader] = useState(false);
  const [error, setError] = useState(null);

  // Estados de Configuración y Formularios
  const [selectedAgent, setSelectedAgent] = useState(localStorage.getItem("selectedAgentId") || "chat");
  const [selectedForm, setSelectedForm] = useState("form1");
  const [files, setFiles] = useState([]);
  const [useGlobalContext, setUseGlobalContext] = useState(true);

  // Persistencia de Agente en LocalStorage
  useEffect(() => {
    localStorage.setItem("selectedAgentId", selectedAgent);
  }, [selectedAgent]);

  // Carga del Chat Actual
  const fetchChat = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/chats/${chatId}`);
      setCurrentChat(data);
    } catch (err) {
      setError("No se pudo cargar la conversación.");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  // Carga del Historial Lateral
  const fetchChats = useCallback(async () => {
    if (!user) return setLoading(false);
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getHistorialChatsByContext(selectedAgent);
      setAllChats(data);
    } catch (err) {
      setError("No se pudieron cargar los chats.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedAgent]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleChatUpdate = useCallback((updatedChat) => {
    setAllChats((prev) => prev.map((c) => (c._id === updatedChat._id ? updatedChat : c)));
    if (currentChat && currentChat._id === updatedChat._id) {
      setCurrentChat(updatedChat);
    }
  }, [currentChat]);

  const handleNewChat = useCallback(async () => {
    try {
      const data = await chatService.createChat(selectedAgent);
      setAllChats((prev) => [data, ...prev]);
      setActiveChatId(data._id);
      navigate(`/chat/${data._id}`);
    } catch (err) {
      setError("No se pudo crear un nuevo chat.");
    }
  }, [navigate, selectedAgent]);

  const handleDeleteChat = useCallback((chatIdToDelete) => {
    const newChats = allChats.filter((c) => c._id !== chatIdToDelete);
    setAllChats(newChats);
    if (window.location.pathname.includes(chatIdToDelete)) {
      handleNewChat();
    }
  }, [allChats, handleNewChat]);

  const handleAgentChange = async (agentId) => {
    try {
      setChangeAgentLoader(true);
      const data = await chatService.getHistorialChatsByContext(agentId);
      
      const updateChatState = (chats) => {
        setAllChats(chats);
        setActiveChatId(chats[0]._id);
        navigate(`/chat/${chats[0]._id}`, { replace: true });
        setSelectedAgent(agentId);
      };

      if (!data || data.length === 0) {
        const newChat = await chatService.createChat(agentId);
        updateChatState([newChat]);
      } else {
        updateChatState(data);
      }
    } catch (err) {
      console.error("Error al cambiar el agente:", err);
      alert("error", "ocurrió un error inesperado al cambiar el agente, intente de nuevo");
    } finally {
      setChangeAgentLoader(false);
    }
  };

  const handleSendMessage = async (userText, filesToUpload, typeAgent) => {
    if (!currentChat || (!userText.trim() && (!filesToUpload || filesToUpload.length === 0))) return;
    
    setLoadingSendMessage(true);
    setError(null);

    // Actualización optimista de UI
    const userMessage = { sender: "user", text: userText, timestamp: new Date().toISOString(), error: false, tempId: Date.now() };
    if (userText.trim()) {
      setCurrentChat(prev => ({ ...prev, messages: [...prev.messages, userMessage] }));
    }

    try {
      let chatAfterFileUpload = currentChat;
      
      // Lógica de subida de archivos
      if (filesToUpload && filesToUpload.length > 0) {
        if (!currentChat.activeContext) throw new Error("El contexto activo del chat no está definido.");
        
        const formData = new FormData();
        filesToUpload.forEach(file => formData.append("files", file));
        formData.append("chatId", currentChat._id);
        formData.append("documentType", currentChat.activeContext);

        if (selectedForm && selectedAgent === "consolidadoFacultades") {
          formData.append("formType", selectedForm);
          const { data } = await apiClient.post("/extract-json", formData);
          chatAfterFileUpload = data.updatedChat;
        } else {
          const { data } = await apiClient.post("/process-document", formData);
          chatAfterFileUpload = data.updatedChat;
        }
        setCurrentChat(chatAfterFileUpload);
        handleChatUpdate(chatAfterFileUpload);
      }

      // Lógica de inferencia de IA
      if (userText.trim()) {
        const historyForApi = [...chatAfterFileUpload.messages, { sender: "user", text: userText }].map(msg => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        }));

        const isNormativas = typeAgent === "normativas";
        const endpoint = isNormativas ? "/chat-normativas" : "/chat-general";
        const client = isNormativas ? apiClient2 : apiClient;

        const { data } = await client.post(endpoint, {
          conversationHistory: historyForApi,
          documentId: chatAfterFileUpload.documentId,
          chatId: chatAfterFileUpload._id,
          useGlobalContext: useGlobalContext,
        });
        
        setCurrentChat(data.updatedChat);
        handleChatUpdate(data.updatedChat);
      }
    } catch (err) {
      setError(`Error: ${err.response?.data?.message || err.message}`);
      alert("error", "Ocurrió un error inesperado, intente de nuevo");
    } finally {
      setLoadingSendMessage(false);
    }
  };

  const handleCompatibilizar = async () => {
    try {
      setLoadingSendMessage(true);
      const { data } = await apiClient.post("/chats/generate-report", { chatId: currentChat._id });
      setCurrentChat(data.updatedChat);
      handleChatUpdate(data.updatedChat);
    } catch (err) {
      setError(`Error: ${err}`);
      alert("error", "Ocurrió un error inesperado, intente de nuevo");
    } finally {
      setLoadingSendMessage(false);
    }
  };

  return {
    state: {
      currentChat, allChats, activeChatId, loading, loadingSendMessage,
      changeAgentLoader, error, selectedAgent, selectedForm, files, useGlobalContext
    },
    setters: {
      setCurrentChat, setActiveChatId, setError, setSelectedForm, setFiles, setUseGlobalContext
    },
    actions: {
      handleSendMessage, handleAgentChange, handleNewChat, handleDeleteChat, handleChatUpdate, handleCompatibilizar
    }
  };
};