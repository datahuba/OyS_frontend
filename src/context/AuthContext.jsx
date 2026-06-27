import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados locales para el modal bloqueante de cambio de contraseña forzado
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forceError, setForceError] = useState("");
  const [forceLoading, setForceLoading] = useState(false);

  useEffect(() => {
    const userInfoFromStorage = localStorage.getItem('userInfo');
    if (userInfoFromStorage) {
      setUser(JSON.parse(userInfoFromStorage));
    }
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    try {
      const { data } = await apiClient.post('/users/register', { name, email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'Error en el registro';
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await apiClient.post('/users/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'Error en el inicio de sesión';
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  const handleForceChangePassword = async (e) => {
    e.preventDefault();
    setForceError("");

    if (newPassword.length < 6) {
      setForceError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForceError("Las contraseñas no coinciden.");
      return;
    }

    setForceLoading(true);
    try {
      await apiClient.put('/users/change-password-force', { newPassword });
      
      // Actualizar localStorage y estado del contexto
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Limpieza de campos del formulario
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setForceError(
        error.response?.data?.message || 
        error.toString() || 
        "Error al actualizar la contraseña."
      );
    } finally {
      setForceLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {/* 
        COMPORTAMIENTO DE SEGURIDAD GLOBAL:
        Si el usuario está autenticado pero tiene activa la bandera de cambio forzado,
        se reemplaza el renderizado de la aplicación entera ({children}) por un panel bloqueante.
      */}
      {user && user.mustChangePassword ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-light-bg dark:bg-dark-bg transition-colors duration-200">
          <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border border-light-border dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden">
            
            <div className="text-center mb-6">
              <div className="h-14 w-14 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600 dark:text-yellow-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cambio de Contraseña Obligatorio</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Has iniciado sesión con credenciales temporales. Por motivos de seguridad institucional, debes establecer una contraseña privada definitiva para poder continuar.
              </p>
            </div>

            {forceError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3 text-red-700 dark:text-red-300">
                <svg className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium">{forceError}</p>
              </div>
            )}

            <form onSubmit={handleForceChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={forceLoading}
                    className="block w-full pl-10 pr-4 py-2.5 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-light-secondary dark:focus:ring-dark-secondary text-gray-900 dark:text-white"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={forceLoading}
                    className="block w-full pl-10 pr-4 py-2.5 border border-light-border/20 dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-light-secondary dark:focus:ring-dark-secondary text-gray-900 dark:text-white"
                    placeholder="Repita la contraseña"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forceLoading}
                className="w-full py-3 mt-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:bg-gray-400 flex justify-center items-center cursor-pointer"
              >
                {forceLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Actualizando...
                  </div>
                ) : (
                  "Establecer Contraseña Privada"
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-light-border/20 dark:border-dark-border/20 text-center">
              <button
                onClick={logout}
                className="text-xs text-red-500 hover:underline font-semibold"
              >
                Cancelar y Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};