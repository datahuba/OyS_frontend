import React, { Suspense, lazy } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import { apiClient, isTokenExpired } from "./api/axios";
import { chatService } from "./services/chat.service";

// Carga diferida de las vistas internas
const ChatView = lazy(() => import("./views/ChatView.jsx"));
const ProjectInfoView = lazy(() => import("./views/ProjectInfoView.jsx"));

function AppLogic({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [allChats, setAllChats] = React.useState([]);
  const [activeChatId, setActiveChatId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showTokenExpiredDialog, setShowTokenExpiredDialog] =
    React.useState(false);
  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    const checkToken = () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo && userInfo.token && isTokenExpired(userInfo.token)) {
          localStorage.removeItem("userInfo");
          if (location.pathname === "/" || location.pathname === "/login") {
            logout();
            navigate("/login", { replace: true });
          } else {
            setShowTokenExpiredDialog(true);
          }
        }
      } catch (error) {
        console.error("Error comprobando el token:", error);
      }
    };
    checkToken();
  }, [location.pathname, logout, navigate]);

  React.useEffect(() => {
    const handleTokenExpired = () => {
      if (location.pathname === "/" || location.pathname === "/login") {
        logout();
        navigate("/login", { replace: true });
      } else {
        setShowTokenExpiredDialog(true);
      }
    };
    window.addEventListener("token-expired", handleTokenExpired);
    return () => {
      window.removeEventListener("token-expired", handleTokenExpired);
    };
  }, [location.pathname, logout, navigate]);

  const handleTokenExpiredClose = () => {
    setShowTokenExpiredDialog(false);
    logout();
    navigate("/login", { replace: true });
  };

  const handleNewChat = React.useCallback(async () => {
    try {
      const data = await chatService.createChat();
      const agent = localStorage.getItem("selectedAgentId") || "chat";
      await chatService.updateContext(data._id, agent);
      setAllChats((prev) => [data, ...prev]);
      setActiveChatId(data._id);
      navigate(`/chat/${data._id}`);
    } catch (err) {
      if (err.tokenExpired) return;
      setError("No se pudo crear un nuevo chat.");
    }
  }, [navigate]);

  const fetchChatsAndRedirect = React.useCallback(async () => {
    if (!user || hasInitialized.current) {
      setLoading(false);
      return;
    }

    if (user.role === "admin" || user.role === "superadmin") {
      navigate("/users", { replace: true });
      setLoading(false);
      return;
    }

    if (user.role === "user") {
      setLoading(true);
      setError(null);
      try {
        const agent = localStorage.getItem("selectedAgentId") || "chat";
        const data = await chatService.getHistorialChatsByContext(agent);
        setAllChats(data);
        if (data.length > 0) {
          if (location.pathname === "/" || location.pathname === "/login") {
            navigate(`/chat/${data[0]._id}`, { replace: true });
          }
        } else {
          await handleNewChat();
        }
        hasInitialized.current = true;
      } catch (err) {
        if (err.tokenExpired) return;
        setError("No se pudieron cargar los chats.");
      } finally {
        setLoading(false);
      }
    } else {
      logout();
      navigate("/login", { replace: true });
      setLoading(false);
    }
  }, [user, navigate, handleNewChat, logout, location.pathname]);

  React.useEffect(() => {
    fetchChatsAndRedirect();
  }, [fetchChatsAndRedirect]);

  const handleDeleteChat = React.useCallback(
    async (chatIdToDelete) => {
      const originalChats = [...allChats];
      const newChats = allChats.filter((c) => c._id !== chatIdToDelete);
      setAllChats(newChats);
      if (window.location.pathname.includes(chatIdToDelete)) {
        if (newChats.length > 0) navigate(`/chat/${newChats[0]._id}`);
        else await handleNewChat();
      }
      try {
        await apiClient.delete(`/chats/${chatIdToDelete}`);
      } catch (err) {
        if (err.tokenExpired) return;
        setAllChats(originalChats);
      }
    },
    [allChats, navigate, handleNewChat]
  );

  const handleChatUpdate = (updatedChat) => {
    setAllChats((prev) =>
      prev.map((c) => (c._id === updatedChat._id ? updatedChat : c))
    );
  };

  if (loading || (user && (user.role === "admin" || user.role === "superadmin"))) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Dialog open={showTokenExpiredDialog} onClose={handleTokenExpiredClose}>
        <DialogTitle>Sesión Expirada</DialogTitle>
        <DialogContent>
          <Typography>Su sesión ha expirado. Por favor inicie sesión nuevamente para continuar.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTokenExpiredClose} color="primary" variant="contained">
            Ir al Login
          </Button>
        </DialogActions>
      </Dialog>

      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827' }}><CircularProgress size={50} sx={{ color: '#3b82f6' }} /></Box>}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
            <Route index element={allChats.length > 0 && user.role === "user" ? (<Navigate to={`/chat/${allChats[0]._id}`} replace />) : null} />
            <Route path="chat/:chatId" element={<ChatView onChatUpdate={handleChatUpdate} setActiveChatId={setActiveChatId} />} />
            <Route path="info" element={<ProjectInfoView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default AppLogic;