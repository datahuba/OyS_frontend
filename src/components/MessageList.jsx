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

  // Cronómetro
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotador de mensajes (cambia cada 4 segundos)
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

export const MessageList = ({ conversation, loading, onCopy }) => {
  const messagesEndRef = useRef(null);

  // Corrección del Scroll: Se elimina el setTimeout que causaba los saltos bruscos.
  // El scroll se ancla suavemente solo cuando cambia la longitud de la conversación o el estado de carga.
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [conversation?.length, loading]);

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
            <div className="relative min-w-0 max-w-[85%] md:max-w-[75%]">
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
      
      {/* Montaje condicional del simulador de estado de la IA */}
      {loading && (
        <div className="flex justify-start">
          <ProcessingSimulator />
        </div>
      )}
      
      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </div>
  );
};
