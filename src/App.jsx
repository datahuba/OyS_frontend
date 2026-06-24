import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';

import { AuthProvider } from './context/AuthContext';
import useAppTheme from './hooks/useAppTheme';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy Imports: Dividen el monolito JS en archivos pequeños que se descargan a demanda
const LoginPage = lazy(() => import('./views/LoginPage.jsx'));
const UsersPage = lazy(() => import('./views/UsersPage.jsx'));
const DocumentsPage = lazy(() => import('./views/DocumentsPage.jsx'));
const AppLogic = lazy(() => import('./AppLogic.jsx'));

// Pantalla de carga ultraligera mientras se descarga el chunk requerido
const FallbackLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827' }}>
    <CircularProgress size={50} sx={{ color: '#3b82f6' }} />
  </Box>
);

function App() {
  const { theme, darkMode, toggleDarkMode } = useAppTheme();

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Suspense fallback={<FallbackLoader />}>
          <Routes>
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
            <Route
              path="/*"
              element={<AppLogic darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;