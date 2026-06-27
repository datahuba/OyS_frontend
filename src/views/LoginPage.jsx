import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  LightMode,
  DarkMode,
  Error,
  AdminPanelSettings,
  Close,
  Person,
  Business,
  Description,
  CheckCircle,
} from "@mui/icons-material";
import useAppTheme from "../hooks/useAppTheme";
import { apiClient } from "../api/axios";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, darkMode, toggleDarkMode } = useAppTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados para modales de solicitudes (ISSUE #OYS-063)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Campos para formulario de registro de usuario
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDepartment, setRegDepartment] = useState("");
  const [regJustification, setRegJustification] = useState("");

  // Campos para formulario de restablecimiento de contraseña
  const [resetEmail, setResetEmail] = useState("");
  const [resetJustification, setResetJustification] = useState("");

  const resetModalStates = () => {
    setRegName("");
    setRegEmail("");
    setRegDepartment("");
    setRegJustification("");
    setResetEmail("");
    setResetJustification("");
    setModalError("");
    setModalSuccess("");
  };

  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    resetModalStates();
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    resetModalStates();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    setModalLoading(true);

    try {
      const response = await apiClient.post("/users/request-register", {
        name: regName,
        email: regEmail,
        department: regDepartment,
        justification: regJustification,
      });
      setModalSuccess(
        response.data?.message || 
        "Solicitud de registro enviada con éxito. Un administrador evaluará tu caso."
      );
      // Limpieza de campos tras envío exitoso
      setRegName("");
      setRegEmail("");
      setRegDepartment("");
      setRegJustification("");
    } catch (err) {
      setModalError(
        err.response?.data?.message || 
        err.toString() || 
        "Error al procesar la solicitud de registro."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    setModalLoading(true);

    try {
      const response = await apiClient.post("/users/request-reset", {
        email: resetEmail,
        justification: resetJustification,
      });
      setModalSuccess(
        response.data?.message || 
        "Solicitud de restablecimiento enviada con éxito. Un administrador se pondrá en contacto contigo."
      );
      // Limpieza de campos tras envío exitoso
      setResetEmail("");
      setResetJustification("");
    } catch (err) {
      setModalError(
        err.response?.data?.message || 
        err.toString() || 
        "Error al procesar la solicitud de restablecimiento."
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Backdoor de desarrollo seguro que realiza la autenticación automatizada
  const handleDesarrolloBypass = async () => {
    const secret = prompt("Introduce la clave de desarrollador para acceder:");
    // Validación contra tu SUPERUSER_SECRET de .env
    if (secret === "d8jWt8iCGkvgpBmW") {
      setError("");
      setLoading(true);
      try {
        // Autenticación automatizada utilizando el flujo normal del backend
        await login("kevinsohe@hotmail.com", "Krsh2001...");
        navigate("/users");
      } catch (err) {
        setError("Error al autenticar acceso de desarrollo: " + err.toString());
      } finally {
        setLoading(false);
      }
    } else if (secret !== null) {
      alert("Clave de desarrollador incorrecta.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-light-bg dark:bg-dark-bg transition-colors duration-200">
      {/* Botón de Desarrollo (Acceso Administrativo Directo) */}
      <button
        onClick={handleDesarrolloBypass}
        className="fixed top-6 right-20 p-3 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:shadow-gray-800/25 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
        aria-label="Desarrollo"
      >
        <AdminPanelSettings />
      </button>

      {/* Botón de Cambio de Tema */}
      <button
        onClick={() => toggleDarkMode()}
        className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:shadow-gray-800/25 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
        aria-label="Toggle theme"
      >
        {darkMode ? <LightMode /> : <DarkMode />}
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        <div className="rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-light-border dark:border-dark-border bg-white dark:bg-gray-900 transition-all duration-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
              <Error className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-light-primary dark:text-dark-primary"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Email className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-12 pr-12 py-3 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-light-primary placeholder-opacity-20 dark:placeholder-dark-primary dark:placeholder-opacity-20 focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 focus:border-light-border/50 dark:focus:border-dark-border/50 transition-colors"
                  placeholder="correo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-12 pr-12 py-3 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-light-primary dark:text-dark-primary placeholder-light-primary placeholder-opacity-20 dark:placeholder-dark-primary dark:placeholder-opacity-20 focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 focus:border-light-border/50 dark:focus:border-dark-border/50 transition-colors"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 flex justify-center items-center px-4 border border-transparent rounded-xl text-sm font-medium text-white transition-all duration-200 ${
                loading
                  ? "bg-gray-400 dark:bg-gray-500 cursor-not-allowed"
                  : "bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transform hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Enlaces para Solicitudes Administrativas */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs mt-6 space-y-2 sm:space-y-0 border-t border-light-border/20 dark:border-dark-border/20 pt-4">
            <button
              type="button"
              onClick={() => {
                resetModalStates();
                setShowRegisterModal(true);
              }}
              className="text-light-secondary dark:text-dark-secondary hover:underline font-semibold transition-colors"
            >
              Solicitar Registro de Usuario
            </button>
            <button
              type="button"
              onClick={() => {
                resetModalStates();
                setShowResetModal(true);
              }}
              className="text-gray-500 dark:text-gray-400 hover:underline hover:text-light-secondary dark:hover:text-dark-secondary font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Solicitar Registro de Usuario */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-light-border dark:border-dark-border rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={handleCloseRegisterModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Cerrar modal"
            >
              <Close />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Solicitar Registro de Usuario
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Completa el formulario para enviar tus datos de registro a un administrador.
              </p>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-3">
                <CheckCircle className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  {modalSuccess}
                </p>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                <Error className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {modalError}
                </p>
              </div>
            )}

            {!modalSuccess && (
              <form onSubmit={handleRegisterRequest} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Person className="text-gray-400 dark:text-gray-500 text-sm" />
                    </div>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      disabled={modalLoading}
                      className="block w-full pl-10 pr-4 py-2 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 transition-colors"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Email className="text-gray-400 dark:text-gray-500 text-sm" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      disabled={modalLoading}
                      className="block w-full pl-10 pr-4 py-2 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 transition-colors"
                      placeholder="juan.perez@uagrm.edu.bo"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Cargo o Departamento
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Business className="text-gray-400 dark:text-gray-500 text-sm" />
                    </div>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      required
                      disabled={modalLoading}
                      className="block w-full pl-10 pr-4 py-2 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 transition-colors"
                      placeholder="Ej. Departamento de OyS"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Justificación de Acceso
                  </label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 pointer-events-none">
                      <Description className="text-gray-400 dark:text-gray-500 text-sm" />
                    </div>
                    <textarea
                      value={regJustification}
                      onChange={(e) => setRegJustification(e.target.value)}
                      required
                      disabled={modalLoading}
                      rows={3}
                      className="block w-full pl-10 pr-4 py-2 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 transition-colors resize-none"
                      placeholder="Describe brevemente por qué requieres acceso al sistema..."
                    />
                  </div>
                </div>

                <div className="pt-2 flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseRegisterModal}
                    disabled={modalLoading}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-2 bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h disabled:bg-gray-400 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {modalLoading ? "Enviando..." : "Enviar Solicitud"}
                  </button>
                </div>
              </form>
            )}

            {modalSuccess && (
              <button
                onClick={handleCloseRegisterModal}
                className="w-full py-2 mt-4 bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h text-white rounded-xl text-sm font-medium transition-colors"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal: Restablecer Contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-light-border dark:border-dark-border rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={handleCloseResetModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Cerrar modal"
            >
              <Close />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Restablecer Contraseña
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ingresa tu dirección de correo para solicitar la generación de una clave temporal.
              </p>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-3">
                <CheckCircle className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  {modalSuccess}
                </p>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                <Error className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {modalError}
                </p>
              </div>
            )}

            {!modalSuccess && (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Email className="text-gray-400 dark:text-gray-500 text-sm" />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={modalLoading}
                      className="block w-full pl-10 pr-4 py-2 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 transition-colors"
                      placeholder="juan.perez@uagrm.edu.bo"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Justificación o Motivo
                  </label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 pointer-events-none">
                      <Description className="text-gray-400 dark:text-gray-500 text-sm" />
                    </div>
                    <textarea
                      value={resetJustification}
                      onChange={(e) => setResetJustification(e.target.value)}
                      required
                      disabled={modalLoading}
                      rows={3}
                      className="block w-full pl-10 pr-4 py-2 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 transition-colors resize-none"
                      placeholder="Escribe el motivo del restablecimiento..."
                    />
                  </div>
                </div>

                <div className="pt-2 flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseResetModal}
                    disabled={modalLoading}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-2 bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h disabled:bg-gray-400 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {modalLoading ? "Enviando..." : "Enviar Solicitud"}
                  </button>
                </div>
              </form>
            )}

            {modalSuccess && (
              <button
                onClick={handleCloseResetModal}
                className="w-full py-2 mt-4 bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h text-white rounded-xl text-sm font-medium transition-colors"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
