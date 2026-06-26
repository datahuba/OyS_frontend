import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/axios";

// Importaciones nombradas para evitar que el compilador de producción de Vite elimine variables en el build
import {
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  MenuBook as MenuBookIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";

import { CircularProgress } from "@mui/material";

const UserProfile = ({
  userName,
  onLogout,
  toggleDarkMode,
  isDarkMode,
  dropdownPosition = "top-right", 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogData, setCatalogData] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseDropdown = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleCloseDropdown);
    return () => {
      document.removeEventListener("mousedown", handleCloseDropdown);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    const cleanName = name.replace(/undefined|null/gi, "").trim();
    if (!cleanName) return "U";

    const parts = cleanName.split(" ");
    if (parts.length > 1 && parts[1] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
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

  const getPositionClasses = () => {
    switch (dropdownPosition) {
      case "top-left": return "bottom-14 right-0 origin-bottom-right";
      case "top-right": return "bottom-14 left-0 origin-bottom-left";
      case "bottom-left": return "top-14 right-0 origin-top-right";
      case "bottom-right": return "top-14 left-0 origin-top-left";
      default: return "bottom-14 left-0 origin-bottom-left";
    }
  };

  const userInitials = getInitials(userName);

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <div>
          <button
            type="button"
            onClick={handleToggleDropdown}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-light-accent text-light-bg font-bold transition-all duration-200 hover:bg-light-accent_h shadow-sm hover:shadow"
            id="profile-menu-button"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {userInitials}
          </button>
        </div>

        {isOpen && (
          <div
            className={`absolute w-56 divide-y divide-light-border dark:divide-dark-border rounded-xl bg-light-bg dark:bg-dark-bg shadow-lg border border-light-border/20 dark:border-dark-border/20 focus:outline-none z-50 ${getPositionClasses()}`}
            role="menu"
          >
            <div className="" role="none">
              <div className="px-4 py-3 text-sm text-light-primary dark:text-dark-primary flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-light-secondary dark:bg-dark-primary text-light-bg dark:text-dark-bg flex items-center justify-center font-bold">
                  {userInitials}
                </div>
                <span className="font-semibold truncate">{userName}</span>
              </div>

              <hr className="border-light-border dark:border-dark-border" />

              <button
                onClick={toggleDarkMode}
                className="group flex w-full items-center px-4 py-2.5 text-sm transition-colors duration-200 hover:bg-gray-100 hover:dark:bg-gray-800"
                role="menuitem"
              >
                {isDarkMode ? (
                  <>
                    <LightModeIcon className="mr-3 h-5 w-5 text-light-secondary dark:text-dark-primary" />
                    <span className="text-light-primary dark:text-dark-primary font-medium">Modo Claro</span>
                  </>
                ) : (
                  <>
                    <DarkModeIcon className="mr-3 h-5 w-5 text-light-secondary dark:text-dark-primary" />
                    <span className="text-light-primary dark:text-dark-primary font-medium">Modo Oscuro</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onLogout}
                className="group flex w-full items-center px-4 py-2.5 text-sm text-light-primary transition-colors duration-200 hover:bg-red-50 hover:dark:bg-red-900/20"
                role="menuitem"
              >
                <LogoutIcon className="mr-3 h-5 w-5 text-red-500 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400 font-medium">Salir</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Transparencia (Catálogo RAG) */}
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
    </>
  );
};

export default UserProfile;
