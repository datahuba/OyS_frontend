import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Regla de herencia: Si la ruta permite 'admin', un 'superadmin' también es autorizado de forma implícita
  const isAllowed = allowedRoles && (
    allowedRoles.includes(user.role) || 
    (user.role === 'superadmin' && allowedRoles.includes('admin'))
  );

  if (!isAllowed) {
    // Redireccionar al home si el rol no tiene autorización
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;