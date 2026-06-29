import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  UploadFile,
  Delete,
  Description,
  CloudDownload,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  ArrowLeft,
  Autorenew,
  Cancel,
} from "@mui/icons-material";
import { ModalConfirm } from "../components/Modals";
import { alert } from "../utils/alert"; // Assuming this exists based on Modals.jsx usage
import { useNavigate } from "react-router-dom";
import DocumentSkeleton from "../components/skeletons/DocumentSkeleton";
import UserProfile from "../components/UserProfile";
import { useAuth } from "../context/AuthContext";
import useAppTheme from "../hooks/useAppTheme";
import { apiClient } from "../api/axios";

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, darkMode, toggleDarkMode } = useAppTheme();

  // Estados de preparación y carga asíncrona (ISSUE #OYS-063)
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isReplaceActive, setIsReplaceActive] = useState(false);
  const [replaceId, setReplaceId] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Referencia para la cancelación activa del request de red
  const abortControllerRef = useRef(null);

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  // Validación rápida de identidad de desarrollo
  const isDeveloper = user?.email === "admin@datahuba.com";

  // CORREGIDO: Llamada al enrutador de Axios utilizando la ruta relativa nominal
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get("/documents");
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("error", "Error al cargar la lista unificada de documentos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const resetUploadStates = () => {
    setIsReplaceActive(false);
    setReplaceId("");
    setUploadStatus("");
    setUploadProgress(0);
    setUploading(false);
    setPendingFiles([]);
    abortControllerRef.current = null;
  };

  const handleFileSelection = (files) => {
    if (!files || files.length === 0) return;

    const validFiles = [];
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "application/msword", // doc
      "text/csv",
      "application/vnd.ms-powerpoint", // ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
    ];

    const maxSize = 100 * 1024 * 1024; // 100MB

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        alert("error", `El archivo ${file.name} excede el límite de 100MB.`);
        return;
      }

      if (!validTypes.includes(file.type) && file.type !== "") {
        const ext = "." + file.name.split(".").pop().toLowerCase();
        const validExtensions = [
          ".pdf",
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".xlsx",
          ".xls",
          ".docx",
          ".doc",
          ".csv",
          ".ppt",
          ".pptx",
        ];
        if (!validExtensions.includes(ext)) {
          alert("error", `El archivo ${file.name} no tiene un formato de documento soportado.`);
          return;
        }
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleStartUpload = async () => {
    if (pendingFiles.length === 0) return;

    const formData = new FormData();
    pendingFiles.forEach((file) => {
      formData.append("documents", file);
    });

    if (isReplaceActive && replaceId) {
      formData.append("replaceId", replaceId);
    }

    // Inicializar controlador para posibilitar parada de emergencia
    abortControllerRef.current = new AbortController();

    try {
      setUploading(true);
      setUploadProgress(5);
      setUploadStatus("Iniciando transferencia de archivos...");

      // Simulación de estados para la barra de progreso
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 40) {
            setUploadStatus("Subiendo archivo de normativa al VPS...");
            return prev + 5;
          } else if (prev < 65) {
            setUploadStatus("Gotenberg: Extrayendo texto plano y analizando formato...");
            return prev + 2;
          } else if (prev < 85) {
            setUploadStatus("Gemini API: Generando embeddings semánticos (3072d)...");
            return prev + 1.2;
          } else if (prev < 98) {
            setUploadStatus("Qdrant: Indexando y sincronizando base vectorial...");
            return prev + 0.4;
          }
          return prev;
        });
      }, 700);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        signal: abortControllerRef.current.signal // Inyección del token de cancelación
      };

      // CORREGIDO: Ruta relativa nominal administrada de forma nativa por Axios
      await apiClient.post("/documents/upload", formData, config);
      
      clearInterval(progressTimer);
      setUploadProgress(100);
      setUploadStatus("Sincronización de Qdrant finalizada.");

      setTimeout(() => {
        alert("success", "Base de conocimientos sincronizada correctamente en Qdrant.");
        resetUploadStates();
        fetchDocuments();
      }, 1000);

    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        return; // La cancelación fue gestionada de forma controlada por handleCancelUpload
      }
      console.error("Error uploading documents:", error);
      alert("error", error.response?.data?.message || "Error al subir e ingestar los archivos.");
      resetUploadStates();
    }
  };

  // BOTÓN DE PARADA DE EMERGENCIA ACTIVO (Cancela inmediatamente la petición HTTP en tránsito)
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    resetUploadStates();
    alert("info", "Carga e ingesta de vectores abortada por el usuario.");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isDeveloper && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeveloper) {
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (isDeveloper && e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files);
    }
  };

  const confirmDelete = (doc) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;

    try {
      setDeleting(true);
      // CORREGIDO: Ruta con prefijo '/api' implícito manejado por Axios de forma segura
      await apiClient.delete(`/documents/${docToDelete._id}`);
      alert("success", "Documento y vectores asociados eliminados correctamente de Qdrant.");
      setDocuments((prev) => prev.filter((d) => d._id !== docToDelete._id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("error", error.response?.data?.message || "Error al eliminar el documento.");
    } finally {
      setDeleteModalOpen(false);
      setDocToDelete(null);
      setDeleting(false);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext))
      return <Image className="w-8 h-8 text-light-accent" />;
    if (ext === "pdf")
      return <PictureAsPdf className="w-8 h-8 text-red-500" />;
    if (["xls", "xlsx", "csv"].includes(ext))
      return <Description className="w-8 h-8 text-green-500" />;
    if (["doc", "docx"].includes(ext))
      return <Description className="w-8 h-8 text-blue-500" />;
    return <InsertDriveFile className="w-8 h-8 text-gray-500" />;
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-dvh bg-light-bg dark:bg-dark-bg p-8 transition-colors duration-300">
      <div className="flex flex-col items-center fixed top-5 right-5 z-50">
        <UserProfile
          userName={user?.name}
          onLogout={handleLogout}
          toggleDarkMode={toggleDarkMode}
          isDarkMode={darkMode}
          dropdownPosition="bottom-left"
        />
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="p-8 transition-colors duration-300">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Gestor de Documentos
            </h1>
            <button
              onClick={() => navigate("/users")}
              className="flex items-center justify-center gap-2 px-6 py-3 text-light-primary dark:text-dark-primary rounded-xl border border-light-secondary dark:border-dark-secondary transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ArrowLeft />
              <span className="font-medium">Volver a usuarios</span>
            </button>
          </div>

          {/* EXPLICATIVO DE ESTRUCTURA DOCUMENTAL DE "LA GABI" */}
          <div className="mb-6 p-5 bg-gray-50/50 dark:bg-gray-900/30 border border-light-border dark:border-dark-border rounded-2xl">
            <h3 className="text-sm font-bold text-light-primary dark:text-dark-primary mb-1">Estructura Documental del RAG</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              El sistema se alimenta de dos orígenes vectoriales: **Vectores del Chat (Privados)** que cada usuario sube a nivel individual dentro de un chat específico (colección `chat-rag` de 768d), y **Documentos Globales (Normativas)** que indexan el marco legal de la universidad (colección `rag-normativas-uagrm` de 3072d). Las 314 normativas iniciales de la UAGRM se encuentran cargadas directamente en Qdrant como parte de la memoria semántica de la IA.
            </p>
          </div>

          {/* MENÚ DE REEMPLAZO EXCLUSIVO (Solo visible para el perfil de desarrollo admin@datahuba.com) */}
          {isDeveloper && (
            <div className="mb-6 bg-white dark:bg-gray-900 border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="replace-active-checkbox"
                  checked={isReplaceActive}
                  onChange={(e) => {
                    setIsReplaceActive(e.target.checked);
                    if (!e.target.checked) setReplaceId("");
                  }}
                  className="w-4 h-4 text-light-secondary dark:text-dark-secondary border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded focus:ring-light-secondary focus:ring-2 cursor-pointer"
                />
                <label
                  htmlFor="replace-active-checkbox"
                  className="text-sm font-semibold text-light-primary dark:text-dark-primary cursor-pointer select-none"
                >
                  ¿Deseas reemplazar una normativa existente? (Sustituirá las versiones previas en Qdrant)
                </label>
              </div>

              {isReplaceActive && (
                <div className="mt-4 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Seleccione la normativa que desea sustituir:
                  </label>
                  <select
                    value={replaceId}
                    onChange={(e) => setReplaceId(e.target.value)}
                    required={isReplaceActive}
                    className="block w-full max-w-md px-4 py-3 border border-light-border dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-secondary transition-colors"
                  >
                    <option value="">-- Seleccionar documento --</option>
                    {documents.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.isStatic ? `(Sistema) ${d.originalName}` : d.originalName} {d.size > 0 ? `(${formatSize(d.size)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* BARRA DE PROGRESO DE INGESTA VECTORES CON BOTÓN DE STOP */}
          {uploading && (
            <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-light-border dark:border-dark-border rounded-2xl shadow-lg transition-all animate-pulse">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-light-secondary dark:text-dark-secondary animate-pulse flex items-center gap-2">
                  <Autorenew className="animate-spin text-sm" />
                  {uploadStatus}
                </span>
                <span className="text-xs font-bold text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-light-secondary h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <button
                onClick={handleCancelUpload}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-colors w-fit ml-auto cursor-pointer"
              >
                <Cancel className="w-4 h-4" />
                Detener Ingesta (Parada de Emergencia)
              </button>
            </div>
          )}

          {/* ÁREA DE PREPARACIÓN DE ARCHIVOS (Evita la carga automática inmediata) */}
          {pendingFiles.length > 0 && !uploading && (
            <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-light-border dark:border-dark-border rounded-2xl shadow-md animate-in slide-in-from-top-1 duration-300">
              <h3 className="text-sm font-bold text-light-primary dark:text-dark-primary mb-3">
                Archivos seleccionados listos para ingestar ({pendingFiles.length})
              </h3>
              <ul className="space-y-2 mb-5">
                {pendingFiles.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-xs text-light-primary dark:text-dark-primary bg-light-bg_h dark:bg-dark-bg_h p-3 rounded-xl border border-light-border/10"
                  >
                    <span className="truncate font-semibold max-w-[70%]">{file.name}</span>
                    <span className="font-mono text-gray-500">{formatSize(file.size)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingFiles([])}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStartUpload}
                  className="flex-1 py-3 bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h text-white rounded-xl text-xs font-bold transition-all transform hover:scale-[1.01]"
                >
                  {isReplaceActive ? "Reemplazar e Iniciar Ingesta" : "Iniciar Ingesta de Vectores"}
                </button>
              </div>
            </div>
          )}

          {/* Upload Area (Editable únicamente para el desarrollador, banner informativo para otros roles) */}
          {isDeveloper ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 mb-8 transition-all duration-300 ${
                dragActive
                  ? "border-light-accent bg-light-bg_h dark:bg-dark-bg_h"
                  : "border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
              />

              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <UploadFile
                  className={`w-16 h-16 mb-4 ${
                    dragActive
                      ? "text-light-accent"
                      : "text-light-secondary dark:text-dark-secondary"
                  }`}
                />
                <p className="text-xl font-semibold text-light-primary dark:text-dark-primary mb-2">
                  {uploading
                    ? "Iniciando ingesta vectorial..."
                    : "Arrastra archivos aquí o haz clic para seleccionar"}
                </p>
                <p className="text-sm text-light-primary_h dark:text-dark-primary_h">
                  PDF, Imágenes, Excel, Word, CSV, PowerPoint (Máx. 100MB)
                </p>
              </label>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl flex items-start gap-4">
              <UploadFile className="text-blue-500 flex-shrink-0 w-6 h-6" />
              <div>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Canal de Consulta de Base de Conocimiento</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-1 leading-relaxed">
                  Usted dispone de permisos de consulta para el catálogo de normativas activas en "La Gabi". La carga, reemplazo o depuración física de los índices vectoriales de Qdrant está reservada exclusivamente para el perfil del desarrollador (`admin@datahuba.com`).
                </p>
              </div>
            </div>
          )}

          {/* Documents Table */}
          {isLoading || documents.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                  Catálogo de Normativas Vigentes ({documents.length})
                </h2>
              </div>

              <div className="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border">
                <table className="w-full">
                  <thead className="bg-light-bg_h dark:bg-dark-bg_h">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-light-primary_h dark:text-dark-primary_h uppercase tracking-wider">
                        Archivo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-light-primary_h dark:text-dark-primary_h uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-light-primary_h dark:text-dark-primary_h uppercase tracking-wider">
                        Tamaño
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-light-primary_h dark:text-dark-primary_h uppercase tracking-wider">
                        Subido por
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-light-primary_h dark:text-dark-primary_h uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-light-primary_h dark:text-dark-primary_h uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-light-bg dark:bg-dark-bg divide-y divide-light-border dark:divide-dark-border">
                    {isLoading ? (
                      <DocumentSkeleton count={5} />
                    ) : (
                      documents.map((doc) => (
                        <tr
                          key={doc._id}
                          className="hover:bg-light-bg_h dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getFileIcon(doc.originalName)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-light-primary dark:text-dark-primary break-all">
                              {doc.isStatic ? `[Sistema] ${doc.originalName}` : doc.originalName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-light-primary_h dark:text-dark-primary_h">
                              {doc.size ? formatSize(doc.size) : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-light-primary_h dark:text-dark-primary_h">
                              {doc.uploadedBy?.name || "Desconocido"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-light-primary_h dark:text-dark-primary_h">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex space-x-2 justify-end">
                              {doc.cloudinaryUrl && (
                                <a
                                  href={doc.cloudinaryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-light-secondary hover:bg-light-bg_h rounded-lg transition-colors"
                                  title="Descargar/Ver"
                                >
                                  <CloudDownload className="w-5 h-5" />
                                </a>
                              )}
                              
                              {/* El botón de borrar solo es funcional y visible para el desarrollador */}
                              {isDeveloper && (
                                <button
                                  onClick={() => confirmDelete(doc)}
                                  className="p-2 text-light-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Eliminar documento"
                                >
                                  <Delete className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Description className="w-16 h-16 text-light-border dark:text-dark-border mx-auto mb-4" />
              <p className="text-light-primary_h dark:text-dark-primary_h text-lg">
                No hay documentos subidos aún
              </p>
              <p className="text-light-primary_h dark:text-dark-primary_h text-sm mt-2">
                Use la zona de arriba bajo el perfil de desarrollo para indexar normativas
              </p>
            </div>
          )}
        </div>
      </div>

      <ModalConfirm
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar documento"
        message={`¿Estás seguro de que quieres eliminar el documento "${docToDelete?.originalName}"? Esta acción purgará los vectores correspondientes en Qdrant de forma irreversible.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
