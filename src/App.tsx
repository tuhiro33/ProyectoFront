// Componente raíz de la aplicación — equivalente al main.go del backend
// en cuanto a que define la estructura y las rutas disponibles.
//
// Usa React Router para mapear URLs a componentes de página,
// igual que main.go mapea rutas HTTP a controladores.
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage      from './pages/Auth/Login';
import HomePage       from './pages/Home/Home';
import MarketplacePage from './pages/Marketplace/Marketplace';
import RegisterPage   from './pages/Auth/Register';
import ColeccionPage  from './pages/Coleccion/Coleccion';
import AgregarCPage   from './pages/Coleccion/AgregarCarta';
import PerfilPage     from './pages/Perfil/Perfil';
import AppLayout      from './componentes/layout/AppLayout';
import PerfilPublico  from './pages/Perfil/PerfilPublico';

function App() {
  return (
    // HashRouter maneja la navegación usando el símbolo # en la URL.
    // Ejemplo: https://tuhiro33.github.io/#/mercado
    //
    // Se eligió HashRouter en lugar de BrowserRouter porque el frontend
    // está desplegado en GitHub Pages, que es un servidor de archivos estáticos.
    // GitHub Pages no puede redirigir rutas desconocidas como /mercado al index.html
    // — devolvería un 404. Con HashRouter todo lo que va después del # es
    // manejado por JavaScript en el navegador, sin tocar el servidor.
    // BrowserRouter sería más limpio en URLs pero requiere configuración
    // del servidor para que todas las rutas apunten al index.html.
    <HashRouter>
      {/* Routes evalúa la URL actual y renderiza solo la primera Route que coincida */}
      <Routes>

        {/* Redirección automática: si el usuario entra a la raíz "/",
            Navigate lo manda a "/Home" sin agregar una entrada al historial
            del navegador (replace reemplaza la entrada actual en lugar de apilarla,
            así el botón "atrás" no queda atrapado en un bucle de redirecciones). */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/* Rutas públicas — accesibles sin iniciar sesión */}
        <Route path="/Home"     element={<HomePage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* Rutas protegidas — agrupadas dentro de AppLayout.
            AppLayout actúa como componente contenedor (wrapper): renderiza
            el sidebar, la barra de navegación y un <Outlet /> donde React Router
            inyecta el componente hijo que corresponda a la URL actual.
            Si AppLayout verifica autenticación internamente, todas las rutas
            hijas quedan protegidas sin repetir la lógica en cada página.
            
            ⚠️  La protección real depende de lo que haga AppLayout —
           .Confirmar que AppLayout redirige
            a /login cuando no hay sesión activa. */}
        <Route element={<AppLayout />}>
          <Route path="/mercado"             element={<MarketplacePage />} />
          <Route path="/coleccion"           element={<ColeccionPage />} />
          <Route path="/AgregarC"            element={<AgregarCPage />} />
          <Route path="/Perfil"              element={<PerfilPage />} />
          {/* :usuarioId es un parámetro dinámico de URL — en PerfilPublico
              se lee con useParams() para saber qué perfil mostrar.
              Ejemplo: /#/perfil/42 → usuarioId = "42" */}
          <Route path="/perfil/:usuarioId"   element={<PerfilPublico />} />
        </Route>

        {/* Ruta comodín: captura cualquier URL que no coincidió con ninguna ruta anterior.
            El * es equivalente al "404 Not Found" del backend.
            ⚠️  El JSX del mensaje 404 está inline aquí — para mantener consistencia
            de estilos considerar extraerlo a un componente separado NotFoundPage. */}
        <Route path="*" element={
          <h1 style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>
            404 - Carta no encontrada
          </h1>
        } />

      </Routes>
    </HashRouter>
  );
}

export default App;