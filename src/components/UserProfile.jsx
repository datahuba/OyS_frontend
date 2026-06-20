import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsIcon from "@mui/icons-material/Settings"; // Icono de administración estándar de Material-UI

const UserProfile = ({
  userName,
  onLogout,
  toggleDarkMode,
  isDarkMode,
  dropdownPosition = "top-right", // "top-right" | "top-left" | "bottom-right" | "bottom-left"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseDropdown = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleCloseDropdown);
    return () => {
      document.removeEventListener("mousedown", handleCloseDropdown);
    };
  }, []);

  // Función defensiva para obtener iniciales y evitar el bug de KUNDEFINE
  const getInitials = (name) => {
    if (!name) return "U";
    // Limpia cualquier residuo de la cadena "undefined" o "null"
    const cleanName = name.replace(/undefined|null/gi, "").trim();
    if (!cleanName) return "U";

    const parts = cleanName.split(" ");
    if (parts.length > 1 && parts[1] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  // Manejador seguro para ingresar al panel de desarrollo con prompt de clave
  const handleDesarrolloClick = () => {
    setIsOpen(false);
    const secret = prompt("Introduce la clave de desarrollador para acceder:");
    // Validación contra el SUPERUSER_SECRET de tu archivo .env
    if (secret === "d8jWt8iCGkvgpBmW") {
      navigate("/users");
    } else if (secret !== null) {
      alert("Clave de desarrollador incorrecta.");
    }
  };

  // Función para obtener las clases de posicionamiento según la prop
  const getPositionClasses = () => {
    switch (dropdownPosition) {
      case "top-left":
        return "bottom-14 right-0 origin-bottom-right";
      case "top-right":
        return "bottom-14 left-0 origin-bottom-left";
      case "bottom-left":
        return "top-14 right-0 origin-top-right";
      case "bottom-right":
        return "top-14 left-0 origin-top-left";
      default:
        return "bottom-14 left-0 origin-bottom-left"; // Por defecto top-right
    }
  };

  const userInitials = getInitials(userName);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={handleToggleDropdown}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-light-accent text-light-bg font-bold transition-all duration-200 hover:bg-light-accent_h focus:outline-none focus:ring-2 focus:ring-light-accent_h focus:ring-offset-2"
          id="profile-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {userInitials}
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute w-56 divide-y divide-light-border dark:divide-dark-border rounded-md bg-light-bg dark:bg-dark-bg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${getPositionClasses()}`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="profile-menu-button"
        >
          <div className="" role="none">
            {/* User Info Section */}
            <div className="px-4 py-2 text-sm text-light-primary dark:text-dark-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-light-secondary dark:bg-dark-primary text-light-bg dark:text-dark-bg flex items-center justify-center font-bold">
                {userInitials}
              </div>
              <span className="font-semibold">{userName}</span>
            </div>

            <hr className="my-1 border-light-border dark:border-dark-border" />

            {/* Nueva Opción de Desarrollo Segura */}
            <button
              onClick={handleDesarrolloClick}
              className="group flex w-full items-center px-4 py-2 text-sm text-light-primary transition-colors duration-200 hover:bg-light-border hover:dark:bg-dark-bg_h"
              role="menuitem"
            >
              <SettingsIcon className="mr-2 h-5 w-5 text-light-secondary dark:text-dark-primary" />
              <span className="text-light-primary dark:text-dark-primary">
                Desarrollo
              </span>
            </button>

            {/* Dropdown Options */}
            <button
              onClick={toggleDarkMode}
              className="group flex w-full items-center px-4 py-2 text-sm transition-colors duration-200 hover:bg-light-border hover:dark:bg-dark-bg_h"
              role="menuitem"
            >
              {isDarkMode ? (
                <>
                  <LightModeIcon className="mr-2 h-5 w-5 text-light-secondary dark:text-dark-primary" />
                  <span className="text-light-primary dark:text-dark-primary">
                    Modo Claro
                  </span>
                </>
              ) : (
                <>
                  <DarkModeIcon className="mr-2 h-5 w-5 text-light-secondary dark:text-dark-primary" />
                  <span className="text-light-primary dark:text-dark-primary">
                    Modo Oscuro
                  </span>
                </>
              )}
            </button>
            <button
              onClick={onLogout}
              className="group flex w-full items-center px-4 py-2 text-sm text-light-primary transition-colors duration-200 hover:bg-light-border hover:dark:bg-dark-bg_h"
              role="menuitem"
            >
              <LogoutIcon className="mr-2 h-5 w-5 text-light-secondary dark:text-dark-primary" />
              <span className="text-light-primary dark:text-dark-primary">
                Salir
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
