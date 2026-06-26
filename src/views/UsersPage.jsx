import React, { useState, useEffect } from "react";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Add,
  Edit,
  Delete,
  Close,
  Search,
  AdminPanelSettings,
  PersonOutline,
  Error,
  CheckCircle,
  ArrowRight,
  Storage,
  VpnKey,
  Memory,
  Description,
  ExpandMore
} from "@mui/icons-material";
import { Tabs, Tab, Box, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { userService } from "../services/user.service"; // DIRECCIÓN ACTUALIZADA AL SERVICIO UNIFICADO
import { apiClient } from "../api/axios"; 
import UserSkeleton from "../components/skeletons/UserSkeleton";
import UserProfile from "../components/UserProfile";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useAppTheme from "../hooks/useAppTheme";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
      className="w-full"
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const UsersPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, darkMode, toggleDarkMode } = useAppTheme();
  const [notification, setNotification] = useState(null);

  // Estados Gestión de Usuarios
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      showNotification(error.message || "Error al cargar usuarios", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (mode, userObj = null) => {
    setModalMode(mode);
    setSelectedUser(userObj);
    if (userObj) {
      setFormData({
        name: userObj.name,
        email: userObj.email,
        password: "",
        role: userObj.role,
      });
    } else {
      setFormData({ name: "", email: "", password: "", role: "user" });
    }
    setFormErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "user" });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "El nombre es requerido";
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email inválido";
    }
    if (modalMode === "create" && !formData.password) {
      errors.password = "La contraseña es requerida";
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const newUser = await userService.createUser(
          formData.name,
          formData.email,
          formData.password,
          formData.role
        );
        setUsers([...users, newUser]);
        showNotification("Usuario creado exitosamente");
      } else {
        const updatedUser = await userService.updateUser(
          selectedUser._id,
          formData.name,
          formData.email,
          formData.password,
          formData.role
        );
        setUsers(
          users.map((u) => (u._id === selectedUser._id ? updatedUser : u))
        );
        showNotification("Usuario actualizado exitosamente");
      }
      handleCloseModal();
    } catch (error) {
      showNotification(error.message || "Error al guardar usuario", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (userObj) => {
    setUserToDelete(userObj);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await userService.deleteUser(userToDelete._id);
      setUsers(users.filter((u) => u._id !== userToDelete._id));
      showNotification("Usuario eliminado exitosamente");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      showNotification(error.message || "Error al eliminar usuario", "error");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (u.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Lógica de Diagnósticos
  const [diagData, setDiagData] = useState(null);
  const [loadingDiag, setLoadingDiag] = useState(false);

  const fetchDiagnostics = async () => {
    setLoadingDiag(true);
    try {
      const { data } = await apiClient.get('/admin/diagnostics');
      setDiagData(data);
    } catch (error) {
      showNotification("Error al conectar con la consola de diagnóstico del backend", "error");
    } finally {
      setLoadingDiag(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 && !diagData) {
      fetchDiagnostics();
    }
  };

  return (
    <div className="min-h-dvh bg-light-bg dark:bg-dark-bg">
      <div className="flex flex-col items-center fixed top-5 right-5 z-50">
        <UserProfile
          userName={user?.name}
          onLogout={handleLogout}
          toggleDarkMode={toggleDarkMode}
          isDarkMode={darkMode}
          dropdownPosition="bottom-left"
        />
      </div>
      
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="text-green-500 dark:text-green-400" />
            ) : (
              <Error className="text-red-500 dark:text-red-400" />
            )}
            <p
              className={`text-sm font-medium ${
                notification.type === "success"
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {notification.message}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
            Panel de Administración
          </h1>
          <p className="text-light-primary/70 dark:text-dark-primary/70 mt-1">
            Plataforma de gestión institucional y diagnóstico técnico (OyS UAGRM)
          </p>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3, mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                color: darkMode ? '#9ca3af' : '#4b5563',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
              },
              '& .Mui-selected': {
                color: darkMode ? '#ffffff' : '#1f2937',
              }
            }}
          >
            <Tab label="Gestión de Usuarios" />
            <Tab label="Diagnóstico del RAG e IA" />
          </Tabs>
        </Box>

        {/* TAB 0 */}
        <TabPanel value={tabValue} index={0}>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-border dark:text-dark-border" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-light-border dark:border-dark-border/20 bg-transparent rounded-xl text-light-primary dark:text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors"
              />
            </div>
            <div className="flex gap-4 items-center justify-end">
              <button
                onClick={() => navigate("/documents")}
                className="flex items-center justify-center gap-2 px-6 py-3  text-light-primary dark:text-dark-primary rounded-xl border border-light-secondary dark:border-dark-secondary transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <ArrowRight />
                <span className="font-medium">Ir a documentos</span>
              </button>
              <button
                onClick={() => handleOpenModal("create")}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-light-secondary dark:bg-dark-secondary text-white rounded-xl hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Add />
                <span className="font-medium">Nuevo Usuario</span>
              </button>
            </div>
          </div>

          <div className="hidden md:block rounded-2xl shadow-xl border border-light-border dark:border-dark-border/20 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">Fecha de Registro</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loadingUsers ? (
                  <UserSkeleton type="table" count={5} />
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-light-primary dark:text-dark-primary">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-light-secondary/10 dark:bg-dark-secondary/10 rounded-full flex items-center justify-center">
                            <Person className="text-light-secondary dark:text-dark-secondary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-light-primary dark:text-dark-primary">{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-light-primary/70 dark:text-dark-primary/70">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                              : u.role === "superadmin"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {u.role === "admin" || u.role === "superadmin" ? <AdminPanelSettings fontSize="small" /> : <PersonOutline fontSize="small" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-light-primary/70 dark:text-dark-primary/70">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal("edit", u)}
                          className="text-light-secondary dark:text-dark-secondary hover:text-light-secondary_h dark:hover:text-dark-secondary_h mr-3 transition-colors"
                        >
                          <Edit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        >
                          <Delete />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4">
            {loadingUsers ? (
              <UserSkeleton type="card" count={3} />
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-light-primary dark:text-dark-primary">
                No se encontraron usuarios
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u._id} className="rounded-2xl shadow-lg border border-light-border dark:border-dark-border/20 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-light-secondary/10 dark:bg-dark-secondary/10 rounded-full flex items-center justify-center">
                        <Person className="text-light-secondary dark:text-dark-secondary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-light-primary dark:text-dark-primary">{u.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                              : u.role === "superadmin"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {u.role === "admin" || u.role === "superadmin" ? <AdminPanelSettings fontSize="small" /> : <PersonOutline fontSize="small" />}
                          {u.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-light-primary/70 dark:text-dark-primary/70">
                      <Email fontSize="small" />
                      <span>{u.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(u.file?.size || 0)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal("edit", u)} className="flex-1 py-2 bg-light-border hover:bg-light-border/80 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm text-light-primary dark:text-dark-primary transition-all duration-200">Editar</button>
                    <button onClick={() => handleDeleteClick(u)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm transition-all duration-200">Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabPanel>

        {/* TAB 1 */}
        <TabPanel value={tabValue} index={1}>
          {loadingDiag ? (
            <div className="flex flex-col justify-center items-center py-12">
              <CircularProgress size={40} sx={{ color: '#3b82f6' }} />
              <span className="mt-4 text-sm text-gray-500">Recuperando catálogo...</span>
            </div>
          ) : diagData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="rounded-2xl shadow-xl border border-light-border dark:border-dark-border/20 p-6 bg-white dark:bg-[#1a1f2e]">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Storage className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">MongoDB Atlas</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Estado</span>
                    <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle fontSize="small"/> {diagData.database.connection_state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Base Activa</span>
                    <span className="font-medium text-light-primary dark:text-dark-primary">{diagData.database.active_db}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl shadow-xl border border-light-border dark:border-dark-border/20 p-6 bg-white dark:bg-[#1a1f2e]">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <VpnKey className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">Google AI Pool</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Llaves Cargadas</span>
                    <span className="font-medium text-light-primary dark:text-dark-primary">{diagData.gemini_pool.total_keys}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Índice en Uso</span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">#{diagData.gemini_pool.active_key_index}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl shadow-xl border border-light-border dark:border-dark-border/20 p-6 bg-white dark:bg-[#1a1f2e]">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <Memory className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">Qdrant Vector DB</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">chat-rag (768d)</span>
                    <span className="font-medium text-light-primary dark:text-dark-primary">
                      {diagData.qdrant.collections['chat-rag']?.vectors_count || 0} vectores
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">normativas (3072d)</span>
                    <span className="font-medium text-light-primary dark:text-dark-primary">
                      {diagData.qdrant.collections['rag-normativas-uagrm']?.vectors_count || 0} vectores
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
                <Accordion 
                  sx={{ 
                    backgroundColor: darkMode ? '#1a1f2e' : '#ffffff',
                    color: darkMode ? '#ffffff' : '#000000',
                    borderRadius: '1rem !important',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore sx={{ color: darkMode ? '#ffffff' : '#000000' }} />}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                        <Description className="text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Meta-Catálogo de Documentos RAG</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{diagData.rag_catalog.indexed_count} documentos listos en consciencia de IA</p>
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      <ul className="space-y-2">
                        {diagData.rag_catalog.documents.map((doc, idx) => (
                          <li key={idx} className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                            <CheckCircle fontSize="small" className="text-green-500" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionDetails>
                </Accordion>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 text-red-500">Error al procesar la información de diagnóstico.</div>
          )}
        </TabPanel>
      </div>

      {/* Modales */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-light-bg dark:bg-dark-bg rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-light-primary dark:text-dark-primary">
                  {modalMode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-light-secondary dark:text-dark-primary hover:text-light-secondary_h dark:hover:text-dark-primary_h transition-colors"
                >
                  <Close />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">Nombre</label>
                  <div className="relative">
                    <Person className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-border dark:text-dark-border" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border ${formErrors.name ? "border-red-500" : "border-light-border dark:border-dark-border/20"} bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors`}
                      placeholder="Nombre completo"
                    />
                  </div>
                  {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">Email</label>
                  <div className="relative">
                    <Email className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-border dark:text-dark-border" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border ${formErrors.email ? "border-red-500" : "border-light-border dark:border-dark-border/20"} bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                    Contraseña {modalMode === "edit" && "(dejar vacío para mantener)"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-border dark:text-dark-border" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full pl-10 pr-12 py-3 border ${formErrors.password ? "border-red-500" : "border-light-border dark:border-dark-border/20"} bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors`}
                      placeholder="Contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-secondary dark:text-dark-secondary hover:text-light-secondary_h dark:hover:text-dark-secondary_h transition-colors"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                  {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
                  {!formErrors.password && <p className="mt-1 text-xs text-light-primary/70 dark:text-dark-primary/70">Mínimo 6 caracteres</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-light-border dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    {user?.role === 'superadmin' && <option value="superadmin">superadmin</option>}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border border-light-border dark:border-dark-border text-light-primary dark:text-dark-primary rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-all ${
                      submitting ? "bg-gray-400 cursor-not-allowed" : "bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h"
                    }`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Guardando...
                      </div>
                    ) : modalMode === "create" ? "Crear Usuario" : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Delete className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-light-primary dark:text-dark-primary">
                Eliminar Usuario
              </h2>
            </div>
            <p className="text-light-primary/70 dark:text-dark-primary/70 mb-6">
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>{userToDelete?.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-3 border border-light-border dark:border-dark-border text-light-primary dark:text-dark-primary rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-3 bg-red-600 dark:bg-red-500 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;