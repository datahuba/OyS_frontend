import React, { useState, useEffect, useRef } from "react";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import DescriptionIcon from "@mui/icons-material/Description";
import { Upload } from "@mui/icons-material";
import { Switch, FormControlLabel, CircularProgress } from "@mui/material"; 
import { apiClient } from "../api/axios";
import axios from "axios"; 

// FUNCIÓN PURA DE FORMATEO: Ubicada al inicio del archivo para evitar errores de hoisting y TDZ
const formatCompTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const MessageInput = React.forwardRef((
  {
    onSendMessage,
    loading,
    error,
    isDragActive,
    isDragOver,
    selectedAgent,
    handleAgentChange,
    selectedForm,
    onChangeSelectedForm,
    onChangeCompatibilizar,
    currentChat,
    setCurrentChat,
    files,
    changeAgentLoader,
    setFiles,
    useGlobalContext,
    setUseGlobalContext,
    loaderCompFacultativoFiles,
    setLoaderCompFacultativoFiles,
    compSeconds,
    onStopGeneration 
  },
  ref
) => {
  const [message, setMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [filesAgent, setFilesAgent] = useState({ form1: [], form2: [], form3: [], extra: [], mof1: [] });
  const [showCompatibilizar, setShowCompatibilizar] = useState(false);

  const fileInputRef = useRef(null);
  const mofFileInputRef = useRef(null);
  const [selectedMofForm, setSelectedMofForm] = useState(null);
  const optionsRef = useRef(null);
  const textareaRef = useRef(null);
  const [isShowConsolidado, setIsShowConsolidado] = useState(false);
  const [typeCompatibilizacion, setTypeCompatibilizacion] = useState("");
  const [isShowMofRapido, setIsShowMofRapido] = useState(false);
  
  const abortControllerRef = useRef(null); 

  React.useImperativeHandle(ref, () => ({
    addFilesFromGlobal: (newFiles) => setFiles((prev) => [...prev, ...newFiles]),
  }));

  useEffect(() => {
    if (selectedAgent !== "compatibilizacion" || files.length === 0) onChangeSelectedForm("form1");
  }, [selectedAgent, files.length, onChangeSelectedForm]);

  useEffect(() => {
    if (selectedAgent !== "mof" && selectedAgent !== "compatibilizacion") {
      setFilesAgent({ form1: [], form2: [], form3: [], extra: [], mof1: [] });
    }
  }, [selectedAgent]);

  const onDrop = React.useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, [setFiles]);

  useEffect(() => {
    return () => {
      files.forEach((fileObj) => { if (fileObj.preview) URL.revokeObjectURL(fileObj.preview); });
      Object.values(filesAgent).flat().forEach((fileObj) => { if (fileObj.preview) URL.revokeObjectURL(fileObj.preview); });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) setShowOptions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendClick = () => {
    const hasAgentFiles = Object.values(filesAgent).some(arr => arr.length > 0);
    if (hasAgentFiles && (selectedAgent === "compatibilizacion" || selectedAgent === "mof")) {
      handleGenerateResponseAgent();
    } else {
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim() && files.length === 0) return;
    const filesToSend = files.map((fileObj) => fileObj.file);
    onSendMessage(message.trim(), filesToSend, selectedAgent);
    setMessage("");
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleStopReportGeneration = (e) => {
    e.stopPropagation();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); 
      abortControllerRef.current = null;
    }
    setLoaderCompFacultativoFiles(false);
    setShowCompatibilizar(false);
  };

  const handleGenerateResponseAgent = async () => {
    const hasFiles = Object.values(filesAgent).some((fileArray) => fileArray.length > 0);
    if (!hasFiles) return;

    try {
      setLoaderCompFacultativoFiles(true);
      
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const formData = new FormData();
      formData.append("chatId", currentChat._id);

      Object.entries(filesAgent).forEach(([formType, fileArray]) => {
        fileArray.forEach((fileObj) => {
          if (fileObj.file) {
            let fieldName = "";
            if (selectedAgent === "mof") fieldName = "form1File";
            else {
              if (typeCompatibilizacion === "consolidado") fieldName = "compFile";
              else fieldName = formType === "form1" ? "form1File" : formType === "form2" ? "form2File" : formType === "form3" ? "form3File" : formType === "extra" ? "form4File" : null;
            }
            if (fieldName && fileObj.file) formData.append(fieldName, fileObj.file);
          }
        });
      });

      let urlComp = selectedAgent === "mof" ? "mof-rapido" : typeCompatibilizacion === "facultativa" ? "comp-facultativa" : typeCompatibilizacion === "administrativa" ? "comp-administrativa" : "consolidado";
      const { data: response } = await apiClient.post(`/informes/generar-${urlComp}`, formData, { signal });
      
      setCurrentChat(response.updatedChat);
      setFilesAgent({ form1: [], form2: [], form3: [], extra: [], mof1: [] });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("[MessageInput] Extracción e Informe cancelados de forma limpia.");
        return;
      }
      console.error("Error al enviar archivos:", error);
    } finally {
      setShowCompatibilizar(false);
      setLoaderCompFacultativoFiles(false);
      abortControllerRef.current = null;
    }
  };

  const handleMofCancel = () => {
    setIsShowMofRapido(false);
    setIsShowConsolidado(false);
    setShowCompatibilizar(false);
    Object.values(filesAgent).flat().forEach((fileObj) => { if (fileObj.preview) URL.revokeObjectURL(fileObj.preview); });
    setFilesAgent({ form1: [], form2: [], form3: [], extra: [], mof1: [] });
    if (window.changeSelectedAgent) window.changeSelectedAgent("consolidadoFacultades");
  };

  const removeFile = (fileId) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const removeMofFile = (formType, fileId) => {
    setFilesAgent((prev) => {
      const updatedForm = prev[formType].filter((f) => {
        if (f.id === fileId) {
          if (f.preview) URL.revokeObjectURL(f.preview);
          return false;
        }
        return true;
      });
      const newMofFiles = { ...prev, [formType]: updatedForm };
      return newMofFiles;
    });
  };

  const handleMofFormSelect = (formValue) => {
    setSelectedMofForm(formValue);
    mofFileInputRef.current?.click();
  };

  const handleMofFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0 && selectedMofForm) {
      const newFiles = selectedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      setFilesAgent((prev) => ({ ...prev, [selectedMofForm]: [...prev[selectedMofForm], ...newFiles] }));
    }
    e.target.value = "";
    setSelectedMofForm(null);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
    setShowOptions(false);
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      const newFiles = selectedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading && !loaderCompFacultativoFiles) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <ImageIcon fontSize="small" />;
    return <InsertDriveFileIcon fontSize="small" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  };

  const handleShowCompatibilizacion = (typeComp) => {
    setTypeCompatibilizacion(typeComp);
    setShowCompatibilizar(!showCompatibilizar);
  };

  const handleShowConsolidado = (typeComp) => {
    setTypeCompatibilizacion(typeComp);
    setShowCompatibilizar(true);
    setIsShowConsolidado(!isShowConsolidado);
  };

  const handleShowMofRapido = () => setIsShowMofRapido(!isShowMofRapido);

  const formOptions = [
    { value: "form1", label: "Form 1" },
    { value: "form2", label: "Form 2" },
    { value: "form3", label: "Form 3" },
    { value: "extra", label: "Extra" },
    { value: "mof1", label: "Form 1" },
  ];

  if ((showCompatibilizar || isShowMofRapido) && (selectedAgent === "compatibilizacion" || selectedAgent === "mof")) {
    return (
      <div className="relative flex flex-col w-full mx-auto max-w-3xl">
        <div className="rounded-3xl border-2 border-light-border dark:border-dark-border/30 bg-light-bg dark:bg-dark-bg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-light-primary dark:text-dark-primary">
              <DescriptionIcon size={16} />
              <span className="font-medium">
                {isShowConsolidado || isShowMofRapido ? "Subir archivos" : "Seleccionar Compatibilizaciones:"}
              </span>
            </div>
            <button disabled={loaderCompFacultativoFiles} onClick={handleMofCancel} className="text-gray-500 hover:text-red-500 transition-colors p-1 disabled:opacity-50">
              <CloseIcon size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(isShowMofRapido ? formOptions.slice(4, 5) : isShowConsolidado ? formOptions.slice(0, 1) : typeCompatibilizacion === "facultativa" ? formOptions.slice(0, 3) : formOptions.slice(0, 4)).map((option) => {
              const fileCount = filesAgent[option.value]?.length || 0;
              return (
                <button
                  disabled={loaderCompFacultativoFiles}
                  key={option.value}
                  onClick={() => handleMofFormSelect(option.value)}
                  className="relative p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-light-secondary dark:hover:border-dark-secondary transition-all group max-h-14 font-semibold text-light-primary dark:text-dark-primary"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <Upload size={20} className="text-gray-500 group-hover:text-light-secondary" />
                    </div>
                    <span className="text-sm font-semibold">{option.label}</span>
                    {fileCount > 0 && <span className="absolute -top-2 -right-2 bg-light-secondary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">{fileCount}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <input ref={mofFileInputRef} type="file" multiple className="hidden" onChange={handleMofFileInputChange} accept="*/*" />

        {showMofContainer && (
          <div className="absolute bottom-full left-0 right-0 mb-4 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border/20 z-30 max-h-[50vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="sticky z-50 top-0 bg-light-bg dark:bg-dark-bg p-4 rounded-t-lg border-b border-light-border dark:border-dark-border/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-light-primary dark:text-dark-primary">
                  Archivos Cargados para Procesamiento
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleMofCancel}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-light-bg dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-gray-700 text-light-primary dark:text-dark-primary transition-colors font-semibold"
                    disabled={loaderCompFacultativoFiles}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerateResponseAgent}
                    disabled={
                      loaderCompFacultativoFiles ||
                      Object.values(filesAgent).every((arr) => arr.length === 0)
                    }
                    className={`px-4 py-2 text-sm rounded-lg transition-all font-bold ${
                      Object.values(filesAgent).some((arr) => arr.length > 0) &&
                      !loaderCompFacultativoFiles
                        ? "bg-light-secondary hover:bg-light-secondary_h text-white shadow-md cursor-pointer"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {loaderCompFacultativoFiles ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Procesando... {formatCompTime(compSeconds)}</span>
                      </div>
                    ) : (
                      "Enviar Todo"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {formOptions.map((option) => {
                const formFiles = filesAgent[option.value] || [];
                if (formFiles.length === 0) return null;

                return (
                  <div
                    key={option.value}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-[#151a23]"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <DescriptionIcon
                        size={16}
                        className="text-light-secondary"
                      />
                      <span className="font-bold text-light-primary dark:text-dark-primary">
                        {option.label}
                      </span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                        {formFiles.length} archivo{formFiles.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formFiles.map((fileObj) => (
                        <div
                          key={fileObj.id}
                          className="group relative flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 pr-8 shadow-sm max-w-[200px]"
                        >
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-light-secondary overflow-hidden">
                            {fileObj.preview ? (
                              <img
                                src={fileObj.preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getFileIcon(fileObj.file.type)
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[110px]" title={fileObj.file.name}>
                              {fileObj.file.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatFileSize(fileObj.file.size)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeMofFile(option.value, fileObj.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col w-full mx-auto max-w-3xl">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-1">
          {files.map((fileObj) => (
            <div
              key={fileObj.id}
              className="group relative flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-1.5 pr-8 shadow-sm max-w-[200px]"
            >
              <div className="w-8 h-8 rounded-md bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-light-secondary overflow-hidden">
                {fileObj.preview ? (
                  <img
                    src={fileObj.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(fileObj.file.type)
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[110px]" title={fileObj.file.name}>
                  {fileObj.file.name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {formatFileSize(fileObj.file.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(fileObj.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        {selectedAgent === "chat" && (
          <div className="flex justify-end mb-2 px-2">
            <FormControlLabel
              control={
                <Switch
                  checked={!useGlobalContext}
                  onChange={(e) => setUseGlobalContext(!e.target.checked)}
                  color="warning"
                  size="small"
                />
              }
              label={
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {!useGlobalContext
                    ? "Contexto global activo"
                    : "Usar contexto global"}
                </span>
              }
            />
          </div>
        )}
        <div
          className={`relative border-4 rounded-3xl shadow-md transition-all duration-300 ease-in-out ${
            isDragActive || isDragOver
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg scale-[1.01]"
              : !useGlobalContext && selectedAgent === "chat"
              ? "border-orange-400 dark:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 shadow-[0_0_20px_rgba(251,146,60,0.3)] animate-pulse"
              : "border-light-border dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg"
          }`}
        >
          <div className="flex flex-col p-3 gap-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 leading-relaxed"
                placeholder="Escribe tu mensaje..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setTimeout(adjustTextareaHeight, 0);
                }}
                onKeyDown={handleKeyDown}
                disabled={loading || loaderCompFacultativoFiles}
                rows="1"
                style={{ minHeight: "24px", maxHeight: "420px" }}
              />
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <div className="relative mb-1" ref={optionsRef}>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    disabled={selectedAgent === "normativas"}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${showOptions ? "bg-light-secondary text-white rotate-45" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"} disabled:opacity-50`}
                  >
                    <AddIcon />
                  </button>
                  {showOptions && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden min-w-[200px] z-30">
                      {selectedAgent === "compatibilizacion" ? (
                        <>
                          <button onClick={handleFileSelect} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700"><AttachFileIcon fontSize="small" /> Subir archivo</button>
                          <button onClick={() => handleShowCompatibilizacion("facultativa")} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700"><DescriptionIcon fontSize="small" /> Facultativo</button>
                          <button onClick={() => handleShowCompatibilizacion("administrativa")} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700"><DescriptionIcon fontSize="small" /> Administrativo</button>
                          <button onClick={() => handleShowConsolidado("consolidado")} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"><DescriptionIcon fontSize="small" /> Consolidado</button>
                        </>
                      ) : selectedAgent === "mof" ? (
                        <>
                          <button onClick={handleFileSelect} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700"><AttachFileIcon fontSize="small" /> Subir archivo</button>
                          <button onClick={handleShowMofRapido} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"><DescriptionIcon fontSize="small" /> MOF rápido</button>
                        </>
                      ) : (
                        <button onClick={handleFileSelect} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"><AttachFileIcon fontSize="small" /> Subir archivo</button>
                      )}
                    </div>
                  )}
                </div>
                <AgentSelector loaderCompFacultativoFiles={loaderCompFacultativoFiles} changeAgentLoader={changeAgentLoader} selectAgent={selectedAgent} onSelect={handleAgentChange} />
              </div>
              <button
                onClick={handleSend}
                disabled={loading || loaderCompFacultativoFiles || (!message.trim() && files.length === 0)}
                className={`flex-shrink-0 w-10 h-10 mb-1 rounded-full flex items-center justify-center transition-all duration-200 ${
                  (message.trim() || files.length > 0) && !loading && !loaderCompFacultativoFiles
                    ? "bg-light-secondary text-white hover:bg-light-secondary_h shadow-md scale-100"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 scale-95 cursor-not-allowed"
                }`}
              >
                {loading || loaderCompFacultativoFiles ? (
                  <div className="flex flex-col items-center justify-center relative">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    {loaderCompFacultativoFiles && (
                      <span className="absolute text-[8px] font-mono font-bold mt-8 text-light-secondary dark:text-dark-primary bg-light-bg dark:bg-dark-bg px-1 rounded shadow border border-light-border/20">
                        {formatCompTime(compSeconds)}
                      </span>
                    )}
                  </div>
                ) : (
                  <SendIcon fontSize="small" className={message.trim() || files.length > 0 || Object.values(filesAgent).some(arr => arr.length > 0) ? "ml-1" : ""} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} accept="*/*" />
      <input ref={mofFileInputRef} type="file" multiple className="hidden" onChange={handleMofFileInputChange} accept="*/*" />
    </div>
  );
});

export default MessageInput;