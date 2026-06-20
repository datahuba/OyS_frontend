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
  AdminPanelSettings, // Importación del ícono de administración para el backdoor de desarrollo
} from "@mui/icons-material";
import useAppTheme from "../hooks/useAppTheme";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, darkMode, toggleDarkMode } = useAppTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-light-bg dark:bg-dark-bg">
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

        <div className="rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-light-border dark:border-dark-border">
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
                  className="block w-full pl-12 pr-12 py-3 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl  text-light-primary dark:text-dark-primary placeholder-light-primary placeholder-opacity-20 dark:placeholder-dark-primary dark:placeholder-opacity-20 focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 focus:border-light-border/50 dark:focus:border-dark-border/50 transition-colors"
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
                  className="block w-full pl-12 pr-12 py-3 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl  text-light-primary dark:text-dark-primary placeholder-light-primary placeholder-opacity-20 dark:placeholder-dark-primary dark:placeholder-opacity-20 focus:outline-none focus:ring-2 focus:ring-light-border/50 dark:focus:ring-dark-border/50 focus:border-light-border/50 dark:focus:border-dark-border/50 transition-colors"
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
              className={`w-full h-12 flex justify-center items-center px-4 border border-transparent rounded-xl text-sm font-medium text-light-bg transition-all duration-200 ${
                loading
                  ? "bg-gray-400 dark:bg-gray-500 cursor-not-allowed"
                  : "bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary_h dark:hover:bg-dark-secondary_h focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transform hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-light-border dark:border-dark-border border-t-transparent mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
