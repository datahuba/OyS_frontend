# Cliente Frontend - Modelo de Asistencia OyS (UAGRM)

Este repositorio alberga el código fuente del cliente para el Modelo de Asistencia OyS (Organización y Sistemas) de la Universidad Autónoma Gabriel René Moreno. La interfaz ha sido diseñada como una Aplicación de Página Única (SPA) modular bajo React y el empaquetador de alto rendimiento Vite 5.

## Características Clave del Cliente

* **Selector de Agentes en la Cabecera:** Menú desplegable integrado en la barra superior con animación slideDown que permite cambiar dinámicamente el agente sin redundancia.
* **Tablero de Bienvenida Dinámico (Estilo ChatGPT):** Rejilla responsiva con sugerencias institucionales que conmutan de forma segura el agente activo y transfieren el foco al cuadro de texto inferior sin prellenar textos, garantizando una entrada de datos limpia.
* **Flujos de Seguridad Integrados:**
    * Modales públicos de Solicitud de Registro de Usuario e Inicio de Restablecimiento de Contraseña.
    * Bloqueador visual persistente en `AuthContext.jsx` que desactiva el renderizado de la SPA si el usuario autenticado tiene activa la bandera de cambio obligatorio de clave (`mustChangePassword: true`).
* **Optimización de Carga Inicial (Code Splitting):** Utiliza React.lazy y Suspense para dividir los módulos y garantizar una respuesta de carga inicial veloz en entornos móviles de la UAGRM.
* **Paridad de Temas:** Soporte completo de modo claro y oscuro a través de Tailwind CSS y variables persistidas en el almacenamiento local.

---

## Requisitos Previos e Instalación Local

Para ejecutar y modificar este cliente de desarrollo, se requiere disponer de las siguientes utilidades de entorno de desarrollo local:

* Node.js v18 o superior.
* Administrador de paquetes npm (v9 o superior) o yarn.

### Instalación y Ejecución de Desarrollo

1. Clonar el repositorio del frontend e ingresar al directorio de trabajo:
   ```bash
   git clone https://github.com/datahuba/OyS_frontend.git
   cd OyS_frontend
Instalar el árbol de dependencias del proyecto:
code
Bash
npm install
Configurar el archivo de variables de entorno de desarrollo .env en la raíz de este directorio:
code
Text
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_URL2=http://localhost:5000
Iniciar el servidor local de desarrollo de Vite:
code
Bash
npm run dev
Arquitectura de Carpetas del Proyecto
code
Text
/src/
├── api/                       <-- Capa de conexion
│   └── axios.js               <-- Cliente Axios unificado con interceptores de sesion y expiracion de tokens
├── components/                <-- Componentes atómicos reutilizables
│   ├── AgentSelector.jsx      <-- Selector de agentes unificado en cabecera
│   ├── MessageInput.jsx       <-- Cuadro de texto con soporte de Drag & Drop y boton de Stop
│   ├── MessageList.jsx        <-- Renderizador de mensajes y tablero interactivo de sugerencias
│   └── SidebarChat.jsx        <-- Barra lateral de navegacion e historial
├── context/                   
│   └── AuthContext.jsx        <-- Contexto global de sesion, login y modal bloqueante de clave temporal
├── hooks/                     
│   └── useAppTheme.js         <-- Custom Hook para manejo unificado de modo oscuro/claro
├── services/                  
│   └── user.service.js        <-- Consumo unificado de datos del usuario
├── views/                     
│   ├── ChatView.jsx           <-- Orquestador principal de chats y conmutacion de agentes
│   ├── UsersPage.jsx          <-- Moderacion de solicitudes de acceso y CRUD administrativo
│   ├── DocumentsPage.jsx      <-- Carga y auditoria de documentos generales
│   └── LoginPage.jsx          <-- Pantalla de acceso y triggers publicos de solicitud
└── index.jsx                  <-- Entrada principal de la aplicacion
Compilación y Despliegue de Producción (Multi-Stage Docker)
El empaquetado del cliente se realiza de forma multicapa utilizando contenedores Docker para minimizar el tamaño final de la imagen y servir los archivos estáticos mediante Nginx configurado para producción.
Configuración del Bundle en Vite 5 (vite.config.js)
Para optimizar los tiempos de carga en el navegador y evitar advertencias por chunks masivos de dependencias, la compilación de producción realiza división de código automática para librerías pesadas:
code
JavaScript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
});
Servidor Web Estático (nginx.conf)
Nginx sirve los recursos estáticos compilados incorporando compresión Gzip nativa de alto rendimiento y políticas estrictas de enrutamiento para soportar el router SPA de React:
code
Nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Habilitar compresión Gzip nativa en el servidor
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
    gzip_disable "MSIE [1-6]\.";
}