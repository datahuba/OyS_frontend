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
} from "@mui/icons-material";
import { userService } from "../api/user.service";
import UserSkeleton from "../components/skeletons/UserSkeleton"; // Import UserSkeleton
import UserProfile from "../components/UserProfile";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useAppTheme from "../hooks/useAppTheme";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, darkMode, toggleDarkMode } = useAppTheme();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      showNotification(error.message || "Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
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

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

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

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
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

  // Parche defensivo de tolerancia a nulos unificado para producción
  const filteredUsers = users.filter(
    (user) =>
      (user.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (user.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-light-primary dark:text-dark-primary mb-2">
            Gestión de Usuarios
          </h1>
        </div>

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
                <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-light-primary dark:text-dark-primary uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <UserSkeleton type="table" count={5} />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-light-primary dark:text-dark-primary"
                  >
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-light-secondary/10 dark:bg-dark-secondary/10 rounded-full flex items-center justify-center">
                          <Person className="text-light-secondary dark:text-dark-secondary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-light-primary dark:text-dark-primary">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-light-primary/70 dark:text-dark-primary/70">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                            : user.role === "superadmin"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <AdminPanelSettings fontSize="small" />
                        ) : (
                          <PersonOutline fontSize="small" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-primary/70 dark:text-dark-primary/70">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal("edit", user)}
                        className="text-light-secondary dark:text-dark-secondary hover:text-light-secondary_h dark:hover:text-dark-secondary_h mr-3 transition-colors"
                      >
                        <Edit />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
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

        {/* Users Cards (Mobile) */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <UserSkeleton type="card" count={3} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-light-primary dark:text-dark-primary">
              No se encontraron usuarios
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="rounded-2xl shadow-lg border border-light-border dark:border-dark-border/20 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-light-secondary/10 dark:bg-dark-secondary/10 rounded-full flex items-center justify-center">
                      <Person className="text-light-secondary dark:text-dark-secondary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-light-primary dark:text-dark-primary">
                        {user.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                            : user.role === "superadmin"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <AdminPanelSettings fontSize="small" />
                        ) : (
                          <PersonOutline fontSize="small" />
                        )}
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-light-primary/70 dark:text-dark-primary/70">
                    <Email fontSize="small" />
                    <span>{user.email}</span>
                  </div>
                  <div className="text-xs text-light-primary/70 dark:text-dark-primary/70">
                    Registrado: {formatDate(user.createdAt)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal("edit", user)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-light-secondary/10 dark:bg-dark-secondary text-light-primary dark:text-dark-primary rounded-lg hover:bg-light-secondary/20 dark:hover:bg-dark-secondary/20 transition-colors"
                  >
                    <Edit fontSize="small" />
                    <span className="text-sm font-medium">Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Delete fontSize="small" />
                    <span className="text-sm font-medium">Eliminar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
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
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                    Nombre
                  </label>
                  <div className="relative">
                    <Person className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-border dark:text-dark-border" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className={`w-full pl-10 pr-4 py-3 border ${
                        formErrors.name
                          ? "border-red-500"
                          : "border-light-border dark:border-dark-border/20"
                      } bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors`}
                      placeholder="Nombre completo"
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Email className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-border dark:text-dark-border" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full pl-10 pr-4 py-3 border ${
                        formErrors.email
                          ? "border-red-500"
                          : "border-light-border dark:border-dark-border/20"
                      } bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                    Contraseña{" "}
                    {modalMode === "edit" && "(dejar vacío para mantener)"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-border dark:text-dark-border" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`w-full pl-10 pr-12 py-3 border ${
                        formErrors.password
                          ? "border-red-500"
                          : "border-light-border dark:border-dark-border/20"
                      } bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors`}
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
                  {formErrors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.password}
                    </p>
                  )}
                  {!formErrors.password && (
                    <p className="mt-1 text-xs text-light-primary/70 dark:text-dark-primary/70">
                      Mínimo 6 caracteres
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-light-border dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border dark:focus:ring-dark-border transition-colors"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
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
                      submitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h"
                    }`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Guardando...
                      </div>
                    ) : modalMode === "create" ? (
                      "Crear Usuario"
                    ) : (
                      "Guardar Cambios"
                    )}
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
              <strong>{userToDelete?.name}</strong>? Esta acción no se puede
              deshacer.
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
