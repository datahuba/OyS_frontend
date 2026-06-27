import React, { useState, useRef, useEffect } from "react";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// Tipos de agentes disponibles
const agents = [
  {
    id: "chat",
    name: "Chat",
    disabled: false,
    icon: PsychologyIcon,
    description: "Chat casual",
  },
  {
    id: "compatibilizacion",
    name: "Compatibilizacion",
    disabled: false,
    icon: PsychologyIcon,
    description: "Genera un informe de compatibilizacion",
  },
  {
    id: "normativas",
    name: "Normativas",
    disabled: false,
    icon: PsychologyIcon,
    description: "Genera un informe de normativas",
  },
  {
    id: "mof",
    name: "MOF",
    disabled: false,
    icon: PsychologyIcon,
    description: "Genera un informe de MOF",
  },
  {
    id: "PyP",
    name: "PyP",
    disabled: true,
    icon: PsychologyIcon,
    description: "Genera un informe de PyP",
  },
];

// Componente Selector de Tipo de Respuesta (Reutilizable)
export const AgentSelector = ({
  selectAgent,
  onSelect,
  className = "",
  changeAgentLoader,
  loaderCompFacultativoFiles,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = agents.find((type) => type.id === selectAgent) || agents[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (agentId) => {
    onSelect(agentId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        disabled={changeAgentLoader || loaderCompFacultativoFiles}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-light-primary dark:text-dark-primary rounded-3xl transition-colors duration-200 shadow"
        aria-label="Seleccionar tipo de respuesta"
        aria-expanded={isOpen}
      >
        <span className="font-medium">{selected.name}</span>
        <ExpandMoreIcon
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-light-bg dark:bg-dark-bg rounded-xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden z-50 animate-slideDown">
          <div className="py-2">
            {agents.map((type) => {
              const Icon = type.icon;
              const isSelected = type.id === selectAgent;

              return (
                <button
                  disabled={type.disabled}
                  key={type.id}
                  onClick={() => handleSelect(type.id)}
                  className={`w-full px-4 py-3 flex disabled:opacity-50 disabled:cursor-not-allowed items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150 ${
                    isSelected ? "bg-light-border dark:bg-dark-secondary_h" : ""
                  }`}
                >
                  <div className="mt-1 p-1.5 rounded-lg bg-light-secondary/50 dark:bg-dark-secondary/50">
                    <Icon className="w-4 h-4 text-light-bg" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                      {type.name}
                    </div>
                    <div className="text-xs text-light-primary dark:text-dark-primary mt-0.5">
                      {type.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-1">
                      <div className="w-2 h-2 bg-light-accent dark:bg-dark-accent rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

