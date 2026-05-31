// Componente de layout principal: define la estructura visual que comparten
// todas las páginas protegidas de la aplicación.
//
// En React Router, un layout component es un componente que actúa como
// "marco" para un grupo de rutas — renderiza las partes comunes (sidebar,
// navbar) y deja un espacio (<Outlet />) donde aparece el contenido
// específico de cada página según la URL actual.
//
// En App.tsx este componente envuelve las rutas protegidas:
//   <Route element={<AppLayout />}>        ← marco común
//     <Route path="/mercado" element={...} />   ← contenido variable
//     <Route path="/coleccion" element={...} /> ← contenido variable
//   </Route>
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import styles from '../../assets/styles/AppLayout.module.css';

// AppLayout no recibe props — su contenido variable viene de React Router
// a través de <Outlet />, no de props del componente padre.
const AppLayout = () => {
  return (
    // styles.layoutContainer aplica los estilos del módulo CSS.
    // Los CSS Modules (archivo .module.css) generan nombres de clase únicos
    // automáticamente para evitar conflictos de nombres entre componentes —
    // styles.layoutContainer en este archivo genera algo como "AppLayout_layoutContainer__x3k2"
    // en el HTML final, garantizando que estos estilos solo afecten este componente.
    <div className={styles.layoutContainer}>

      {/* Sidebar es la barra lateral fija — visible en todas las páginas protegidas.
          Al estar fuera del Outlet, no se re-renderiza al cambiar de página,
          lo que mantiene el estado del sidebar (menú abierto/cerrado) entre navegaciones. */}
      <Sidebar />

      {/* main es el contenedor semántico HTML5 para el contenido principal.
          styles.mainContent define su tamaño y posición relativa al sidebar.
          
          Outlet es el componente de React Router que actúa como placeholder —
          renderiza aquí el componente hijo que corresponda a la URL actual:
            /#/mercado    → <MarketplacePage />
            /#/coleccion  → <ColeccionPage />
            /#/Perfil     → <PerfilPage />
          
          Cuando el usuario navega entre rutas, solo este Outlet cambia
          — el Sidebar permanece intacto. */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

    </div>
  );
};

// ⚠️  PROTECCIÓN DE RUTAS AUSENTE:
// Como se mencionó al comentar App.tsx, este componente es el guardián
// de todas las rutas protegidas, pero actualmente no verifica si hay
// una sesión activa antes de renderizar el contenido.
//
// La protección debería agregarse aquí con useAuth():
//   const { isAuthenticated } = useAuth()
//   if (!isAuthenticated) return <Navigate to="/login" replace />
//
// Sin esto, un usuario sin sesión puede acceder a /mercado, /coleccion, etc.
// navegando directamente a la URL — el backend rechazará las peticiones
// con 401, pero la página se renderizará igual mostrando contenido vacío
// en lugar de redirigir al login.

export default AppLayout;