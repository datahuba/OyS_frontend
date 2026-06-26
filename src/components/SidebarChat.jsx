import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useAppTheme from "../hooks/useAppTheme";
import { apiClient } from "../api/axios";

// Íconos
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UserProfile from "./UserProfile";
import { CircularProgress } from "@mui/material";

// ============================================================================
// COMPONENTE INTELIGENTE: ITEM DE CHAT
// ============================================================================
const ChatItem = ({ chat, isActive, onClick, onChatUpdated, onChatDeleted, onError }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false); 
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setNewTitle(chat.title);
    }
  }, [chat.title, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditSubmit = async (e) => {
    e?.stopPropagation();
    if (!newTitle.trim() || newTitle === chat.title) {
      setIsEditing(false);
      setNewTitle(chat.title);
      return;
    }
    try {
      const { data } = await apiClient.put(`/chats/${chat._id}/title`, { newTitle });
      onChatUpdated(data.updatedChat);
      setIsEditing(false);
    } catch (err) {
      onError("Error al actualizar el título");
      setNewTitle(chat.title);
      setIsEditing(false);
    }
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await apiClient.delete(`/chats/${chat._id}`);
      onChatDeleted(chat._id);
    } catch (err) {
      onError("Error al eliminar el chat");
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <div
      onClick={!isEditing && !isConfirmingDelete ? onClick : undefined}
      className={`group relative flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-light-bg dark:bg-dark-bg/50 shadow-sm"
          : "hover:bg-light-bg/50 dark:hover:bg-dark-bg/30"
      } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <ChatBubbleOutlineIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-light-secondary dark:text-dark-secondary" : "text-gray-400 dark:text-gray-500"}`} />
        
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSubmit(e);
              if (e.key === 'Escape') { setIsEditing(false); setNewTitle(chat.title); }
            }}
            className="flex-1 bg-transparent border-b border-light-secondary dark:border-dark-secondary focus:outline-none text-sm text-light-primary dark:text-dark-primary p-0 m-0"
          />
        ) : (
          <span className={`text-sm truncate select-none ${isActive ? "font-medium text-light-primary dark:text-dark-primary" : "text-gray-600 dark:text-gray-400"}`}>
            {chat.title}
          </span>
        )}
      </div>

      <div className={`flex items-center gap-1 flex-shrink-0 ${isEditing || isConfirmingDelete ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}>
        {isEditing ? (
          <>
            <button onClick={handleEditSubmit} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Guardar">
              <CheckIcon sx={{ fontSize: 16 }} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); setNewTitle(chat.title); }} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Cancelar">
              <CloseIcon sx={{ fontSize: 16 }} />
            </button>
          </>
        ) : isConfirmingDelete ? (
          <>
            <button onClick={handleDelete} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Confirmar Eliminación">
              <CheckIcon sx={{ fontSize: 16 }} />
            </button>
            <button onClick={cancelDelete} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Cancelar">
              <CloseIcon sx={{ fontSize: 16 }} />
            </button>
          </>
        ) : (
          <>
            <button onClick={(e) => { e.stopPropagation(); setNewTitle(chat.title); setIsEditing(true); }} className="p-1 text-gray-400 hover:text-light-secondary dark:hover:text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Renombrar">
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
            <button onClick={confirmDelete} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Eliminar Chat">
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: SIDEBAR
// ============================================================================
export const SidebarChat = ({
  allChats,
  handleNewChat,
  handleDeleteChat,
  sidebarChatCollapsed,
  toggleChatSidebar,
  activeChatId,
  setActiveChatId,
  logo,
  onChatUpdated,
  onError,
  changeAgentLoader,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { theme, darkMode, toggleDarkMode } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState("");

  // Estados del modal del catálogo
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogData, setCatalogData] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredChats = allChats.filter((chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatClick = (chatIdParam) => {
    navigate(`/chat/${chatIdParam}`);
  };

  const handleChatDeleted = (deletedChatId) => {
    handleDeleteChat(deletedChatId);
  };

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const { data } = await apiClient.get('/rag-catalog');
      setCatalogData(data.documents || []);
    } catch (error) {
      console.error("Error cargando catálogo RAG:", error);
    } finally {
      setLoadingCatalog(false);
    }
  };

  return (
    <div
      className={`fixed md:relative h-full top-0 left-0 z-30 bg-light-bg_h transition-all duration-300 ease-out dark:bg-dark-bg_h
			${sidebarChatCollapsed ? "w-0 md:w-16" : "w-[280px] md:w-[280px]"} 
			${sidebarChatCollapsed ? "hidden md:block" : "block"} 
			flex-shrink-0 border-r border-light-border/20 dark:border-dark-border/20`}
    >
      {!sidebarChatCollapsed ? (
        <div className="flex h-full w-full flex-col bg-light-bg_h dark:bg-dark-bg_h">
          <div className="flex w-full items-center justify-between p-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                {logo && <AccountBalanceIcon className="w-9 h-9" />}
                <span className={`${logo && "ml-2"} font-extrabold text-light-primary dark:text-dark-primary truncate`}>
                  Asistente OyS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleChatSidebar}
                className="flex items-center justify-center rounded-lg bg-light-two p-1 text-light-primary transition-all duration-200 hover:bg-light-two_d dark:bg-dark-two dark:text-dark-primary dark:hover:bg-dark-two_d hover:bg-light-bg dark:hover:text-dark-bg dark:hover:bg-dark-two_d"
              >
                <MenuIcon className="size-7" />
              </button>
            </div>
          </div>
          
          <div className="px-3 space-y-3">
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center gap-2 rounded-xl bg-light-secondary dark:bg-dark-secondary py-2.5 px-2 w-full text-white font-medium transition-all duration-200 hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h shadow-sm hover:shadow active:scale-95"
              aria-label="Nuevo chat"
            >
              <EditIcon className="h-5 w-5" />
              Nuevo Chat
            </button>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-dark-bg pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-secondary/50 dark:focus:ring-dark-secondary/50 focus:border-transparent placeholder-gray-400 transition-colors text-sm text-light-primary dark:text-dark-primary shadow-sm"
              />
            </div>

            {/* BOTÓN PERMANENTE: BASE DE CONOCIMIENTO (Estilo ChatGPT - Superior Izquierda) */}
            <button
              onClick={() => {
                setShowCatalog(true);
                fetchCatalog();
              }}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-light-bg/50 dark:hover:bg-dark-bg/30 transition-all border border-transparent hover:border-light-border/20 dark:hover:border-dark-border/10 shadow-sm"
            >
              <MenuBookIcon className="w-5 h-5 text-light-secondary dark:text-dark-secondary" />
              <span>Base de Conocimiento</span>
            </button>

          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-3 mt-2 custom-scrollbar">
            {changeAgentLoader ? (
              <div className="grid grid-cols-1 gap-2 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-full h-10 bg-gray-200 dark:bg-gray-800/50 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <ChatItem
                      key={chat._id}
                      chat={chat}
                      isActive={chatId === chat._id}
                      onClick={() => { chatId !== chat._id && handleChatClick(chat._id); }}
                      onChatUpdated={onChatUpdated}
                      onChatDeleted={handleChatDeleted}
                      onError={onError}
                    />
                  ))
                ) : (
                  <div className="py-10 text-center flex flex-col items-center gap-2 opacity-50">
                    <ChatBubbleOutlineIcon fontSize="large" />
                    <p className="text-sm font-medium text-light-primary dark:text-dark-primary">No hay chats aún</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-light-border/10 dark:border-dark-border/10">
            <UserProfile
              userName={user.name}
              onLogout={handleLogout}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={darkMode}
              dropdownPosition="top-right" 
            />
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-between gap-3 p-3">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              {logo && (
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <AccountBalanceIcon className="w-8 h-8" />
                </div>
              )}
              <button
                onClick={toggleChatSidebar}
                className="absolute inset-0 flex items-center justify-center rounded-lg bg-light-two text-light-primary shadow-sm transition-all duration-300 hover:shadow dark:bg-dark-two dark:text-dark-primary hover:bg-white dark:hover:bg-gray-800"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>
            
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center rounded-xl bg-light-two p-2 text-light-primary shadow-sm transition-all duration-200 hover:bg-light-two_d hover:shadow-lg dark:bg-dark-two dark:text-dark-primary dark:hover:bg-dark-two_d hover:bg-light-bg dark:hover:text-dark-bg dark:hover:bg-dark-two_d"
              title="Nuevo chat"
            >
              <EditIcon className="h-5 w-5" />
            </button>

            {/* BOTÓN COLAPSADO: BASE DE CONOCIMIENTO (Libro flotante en barra colapsada) */}
            <button
              onClick={() => {
                setShowCatalog(true);
                fetchCatalog();
              }}
              className="flex items-center justify-center rounded-xl bg-light-two p-2 text-light-primary shadow-sm transition-all duration-200 hover:bg-light-two_d hover:shadow-lg dark:bg-dark-two dark:text-dark-primary dark:hover:bg-dark-two_d hover:bg-light-bg dark:hover:text-dark-bg dark:hover:bg-dark-two_d"
              title="Base de Conocimiento"
            >
              <MenuBookIcon className="h-5 w-5" />
            </button>

          </div>

          <div className="flex flex-col items-center pb-2">
            <UserProfile
              userName={user.name}
              onLogout={handleLogout}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={darkMode}
              dropdownPosition="top-right" 
            />
          </div>
        </div>
      )}

      {/* MODAL DE TRANSPARENCIA (Catálogo RAG) - RENDERIZADO EN EL MAIN CONTENEDOR DEL SIDEBAR */}
      {showCatalog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-light-bg dark:bg-dark-bg w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-light-border/20 dark:border-dark-border/20 text-left">
            
            <div className="flex justify-between items-center p-5 border-b border-light-border dark:border-dark-border/20">
              <div>
                <h2 className="text-xl font-bold text-light-primary dark:text-dark-primary flex items-center gap-2">
                  <MenuBookIcon className="text-light-secondary dark:text-dark-secondary" />
                  Catálogo de Normativas
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Documentos institucionales de la UAGRM indexados en la memoria de la Inteligencia Artificial.
                </p>
              </div>
              <button 
                onClick={() => setShowCatalog(false)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 dark:bg-[#151a23]">
              {loadingCatalog ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <CircularProgress size={40} sx={{ color: '#3b82f6' }} />
                  <span className="mt-4 text-sm text-gray-500">Recuperando catálogo...</span>
                </div>
              ) : catalogData.length > 0 ? (
                <ul className="space-y-2">
                  {catalogData.map((doc, idx) => (
                    <li key={idx} className="text-sm p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-3 shadow-sm hover:shadow transition-shadow">
                      <CheckCircleIcon fontSize="small" className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-200 break-words">{doc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No hay documentos indexados actualmente.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-light-border dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-b-2xl flex justify-between items-center">
              <span className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                Total: {catalogData.length} archivos
              </span>
              <button
                onClick={() => setShowCatalog(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors font-medium text-sm"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
