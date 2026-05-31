// Punto de entrada principal de la aplicación React.
// Este archivo es el equivalente a main.go en el backend —
// arranca todo el sistema y monta los componentes raíz.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'        // Estilos globales de la aplicación
import App from './App.tsx' // Componente raíz que contiene las rutas y la estructura
import { AuthProvider } from './context/AuthContext' // Proveedor del contexto de autenticación

// createRoot es la API moderna de React 18 para montar la aplicación en el DOM.
// Recibe el elemento HTML donde React va a "vivir" — en index.html hay un <div id="root">
// que actúa como contenedor vacío. React toma ese div y lo llena con toda la app.
//
// El ! al final de getElementById('root')! es una aserción de TypeScript (non-null assertion).
// Le dice al compilador "confía en mí, este elemento existe y no es null".
// Sin el ! TypeScript advertiría que getElementById puede devolver null
// si no encuentra el elemento con ese id en el HTML.
createRoot(document.getElementById('root')!).render(
  // StrictMode es una herramienta de desarrollo de React — no afecta la versión producción.
  // En desarrollo hace dos cosas importantes:
  //   1. Renderiza los componentes DOS veces para detectar efectos secundarios inesperados
  //      (por eso a veces se ven console.log duplicados en desarrollo).
  //   2. Advierte sobre el uso de APIs de React que están obsoletas o en desuso.
  // En producción (npm run build) StrictMode se elimina automáticamente.
  <StrictMode>
    {/* AuthProvider envuelve toda la aplicación para que CUALQUIER componente
        en el árbol pueda acceder al estado de autenticación (usuario logueado,
        token JWT, funciones de login/logout) sin necesidad de pasar props
        manualmente por cada nivel de componentes.
        Es el equivalente frontend del JWT del backend — centraliza quién está autenticado. */}
    <AuthProvider>
      {/* App contiene el router y decide qué página mostrar según la URL */}
      <App />
    </AuthProvider>
  </StrictMode>,
)