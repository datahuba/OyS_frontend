import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRef, useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";

// Subcomponente: Simulador de estados de IA con cronómetro en tiempo real
const ProcessingSimulator = () => {
  const [seconds, setSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const aiStatuses = [
    "Iniciando motor de inferencia...",
    "Procesando contexto y documentos adjuntos...",
    "Analizando estructura y aplicando razonamiento...",
    "Generando respuesta estructurada...",
    "Afinando detalles finales..."
  ];

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const rotater = setInterval(() => {
      setMessageIndex(prev => (prev < aiStatuses.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(rotater);
  }, [aiStatuses.length]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-light-bg_h dark:bg-gray-800/60 rounded-2xl w-fit shadow-sm border border-light-border/20 dark:border-dark-border/20 mt-2">
      <CircularProgress size={18} thickness={5} sx={{ color: '#3b82f6' }} />
      <span className="text-sm font-medium text-light-primary dark:text-dark-primary animate-pulse">
        {aiStatuses[messageIndex]}
      </span>
      <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md ml-2">
        {formatTime(seconds)}
      </span>
    </div>
  );
};

export const MessageList = ({ conversation, loading, onCopy, userName = "Usuario", onSuggestionClick }) => {
  const messagesEndRef = useRef(null);

  // Definición de sugerencias institucionales con sus respectivos mapeos de agente
  const suggestions = [
    {
      title: "Compatibilización de Cargos",
      description: "Audita y compara estructuras de puestos, reglamentos y manuales de funciones en busca de duplicidades.",
      agent: "compatibilizacion",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Consultar Estatutos UAGRM",
      description: "Busca de forma semántica reglamentos, estatutos orgánicos y resoluciones del ICU de la universidad.",
      agent: "normativas",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "Auditoría de Procesos",
      description: "Analiza flujos de trabajo organizacionales y detecta cuellos de botella administrativos.",
      agent: "mof",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      title: "Asistente General OyS",
      description: "Preguntas generales sobre diseño de organigramas y lineamientos estructurales del departamento.",
      agent: "chat",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [conversation?.length, loading]);

  // Si no hay mensajes en la conversación, renderizar el tablero de bienvenida (Estilo ChatGPT)
  if (!conversation || conversation.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8 select-none animate-in fade-in duration-500">
        <div className="h-16 w-16 bg-light-secondary/10 dark:bg-dark-secondary/10 rounded-full flex items-center justify-center mb-6 text-light-secondary dark:text-dark-secondary transition-transform duration-300 hover:scale-110 shadow-sm">
          <svg className="h-10 w-10 text-light-secondary dark:text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-light-primary dark:text-dark-primary mb-2 tracking-tight">
          ¿En qué puedo ayudarte hoy, {userName}?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-10 leading-relaxed">
          Selecciona una sugerencia interactiva. El asistente conmutará el agente correspondiente en el panel superior de forma inmediata.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl w-full">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick && onSuggestionClick(s.agent)}
              className="flex flex-col text-left p-4 rounded-2xl border border-light-border/20 dark:border-dark-border/20 bg-white dark:bg-gray-800/40 hover:bg-light-secondary/5 dark:hover:bg-dark-secondary/5 hover:border-light-secondary/40 dark:hover:border-dark-secondary/40 transition-all duration-300 transform hover:-translate-y-0.5 group shadow-sm active:scale-95"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-light-secondary dark:text-dark-secondary group-hover:scale-110 transition-transform">
                  {s.icon}
                </span>
                <span className="text-sm font-bold text-light-primary dark:text-dark-primary group-hover:text-light-secondary dark:group-hover:text-dark-secondary transition-colors">
                  {s.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {s.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-light-two pb-4">
      {conversation?.map((msg, index) => {
        const isUser = msg.sender === "user";

        return (
          <div
            key={index}
            className={`flex items-start gap-1 sm:gap-3 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {/* Si es la IA, habilitamos el ancho completo (w-full max-w-full) para evitar tablas apretadas */}
            <div className={`relative min-w-0 ${
              isUser 
                ? "max-w-[85%] md:max-w-[75%]" 
                : "w-full max-w-full"
            }`}>
              <div
                className={`relative rounded-2xl p-3 md:p-4 shadow-sm ${
                  isUser
                    ? "w-fit rounded-tr-none bg-light-secondary dark:bg-dark-secondary ml-auto"
                    : "rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                }`}
              >
                <div
                  className={`leading-relaxed ${
                    isUser
                      ? "text-light-bg"
                      : "text-light-primary dark:text-dark-primary"
                  }`}
                >
                  {isUser ? (
                    <div className="text-base sm:text-[15px] whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="overflow-hidden prose dark:prose-invert max-w-none text-[15px]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {loading && (
        <div className="flex justify-start">
          <ProcessingSimulator />
        </div>
      )}
      
      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </div>
  );
};