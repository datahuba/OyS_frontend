import React, { useState, useRef, useEffect } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

const UserProfile = ({
  userName,
  onLogout,
  toggleDarkMode,
  isDarkMode,
  dropdownPosition = "top-right", 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const getInitials = (name) => {
    if (!name) return "U";
    const cleanName = name.replace(/undefined|null/gi, "").trim();
    if (!cleanName) return "U";

    const parts = cleanName.split(" ");
    if (parts.length > 1 && parts[1] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  const getPositionClasses = () => {
    switch (dropdownPosition) {
      case "top-left": return "bottom-14 right-0 origin-bottom-right";
      case "top-right": return "bottom-14 left-0 origin-bottom-left";
      case "bottom-left": return "top-14 right-0 origin-top-right";
      case "bottom-right": return "top-14 left-0 origin-top-left";
      default: return "bottom-14 left-0 origin-bottom-left";
    }
  };

  const userInitials = getInitials(userName);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={handleToggleDropdown}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-light-accent text-light-bg font-bold transition-all duration-200 hover:bg-light-accent_h shadow-sm hover:shadow"
          id="profile-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {userInitials}
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute w-56 divide-y divide-light-border dark:divide-dark-border rounded-xl bg-light-bg dark:bg-dark-bg shadow-lg border border-light-border/20 dark:border-dark-border/20 focus:outline-none z-50 ${getPositionClasses()}`}
          role="menu"
        >
          <div className="" role="none">
            <div className="px-4 py-3 text-sm text-light-primary dark:text-dark-primary flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-light-secondary dark:bg-dark-primary text-light-bg dark:text-dark-bg flex items-center justify-center font-bold">
                {userInitials}
              </div>
              <span className="font-semibold truncate">{userName}</span>
            </div>

            <hr className="border-light-border dark:border-dark-border" />

            <button
              onClick={toggleDarkMode}
              className="group flex w-full items-center px-4 py-2.5 text-sm transition-colors duration-200 hover:bg-gray-100 hover:dark:bg-gray-800"
              role="menuitem"
            >
              {isDarkMode ? (
                <>
                  <LightModeIcon className="mr-3 h-5 w-5 text-light-secondary dark:text-dark-primary" />
                  <span className="text-light-primary dark:text-dark-primary font-medium">Modo Claro</span>
                </>
              ) : (
                <>
                  <DarkModeIcon className="mr-3 h-5 w-5 text-light-secondary dark:text-dark-primary" />
                  <span className="text-light-primary dark:text-dark-primary font-medium">Modo Oscuro</span>
                </>
              )}
            </button>
            
            <button
              onClick={onLogout}
              className="group flex w-full items-center px-4 py-2.5 text-sm text-light-primary transition-colors duration-200 hover:bg-red-50 hover:dark:bg-red-900/20"
              role="menuitem"
            >
              <LogoutIcon className="mr-3 h-5 w-5 text-red-500 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400 font-medium">Salir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
