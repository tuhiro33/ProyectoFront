// Componente de barra lateral: navegación principal de la aplicación.
// Visible en todas las páginas protegidas gracias a AppLayout.
// Muestra el logo, los links de navegación y el perfil del usuario activo.
//
// React.FC es una abreviación de React.FunctionComponent —
// es una forma de tipar el componente en TypeScript que agrega
// automáticamente el tipo de retorno (JSX.Element) sin declararlo explícitamente.
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../assets/styles/Sidebar.module.css';
import logoApp from '../../assets/images/Logo.png';
import { useAuth } from "../../context/AuthContext";

const Sidebar: React.FC = () => {

  // useLocation es un hook de React Router que devuelve información
  // sobre la URL actual. location.pathname contiene la ruta activa:
  // por ejemplo "/#/mercado" → pathname = "/mercado"
  // Se usa para resaltar visualmente el link de la página donde está el usuario.
  const location = useLocation();

  // Función auxiliar que compara la ruta recibida con la URL actual.
  // Devuelve true si coinciden, false si no.
  // Se usa para aplicar condicionalmente la clase CSS 'active' al link correspondiente.
  const isActive = (path: string) => location.pathname === path;

  // useAuth() lee el estado global de AuthContext —
  // user contiene los datos del usuario logueado (nombre, foto, rol, etc.)
  // o null si no hay sesión activa.
  const { user } = useAuth();

  return (
    // aside es el elemento HTML semántico para contenido lateral/complementario.
    // El navegador y los lectores de pantalla lo identifican como barra lateral.
    <aside className={styles.sidebar}>

      {/* Logo y nombre de la app — Link navega a /Home al hacer clic.
          Link de React Router no recarga la página completa como <a href>,
          solo actualiza la URL y renderiza el componente correspondiente. */}
      <Link to="/Home" className={styles.brand}>
        <img src={logoApp} alt="Logo" className={styles.logo} />
        <span className={styles.brandName}>Cartas</span>
      </Link>

      <hr className={styles.divider} />

      {/* Lista de navegación principal.
          El patrón de clase condicional:
            `${styles.navLink} ${isActive('/ruta') ? styles.active : ''}`
          combina siempre la clase base navLink con la clase active
          solo cuando esa ruta está activa — el CSS de active
          resalta visualmente el link de la página actual. */}
      <ul className={styles.navList}>
        <li>
          {/* ⚠️  BUG: el Link navega a "/Home" pero isActive verifica "/mi-boveda".
              Nunca se aplicará la clase active a este link porque las rutas no coinciden.
              Corrección: isActive('/Home') */}
          <Link to="/Home" className={`${styles.navLink} ${isActive('/mi-boveda') ? styles.active : ''}`}>
            🏠 <span className={styles.linkText}>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/coleccion" className={`${styles.navLink} ${isActive('/coleccion') ? styles.active : ''}`}>
            🎴 <span className={styles.linkText}>Mis Cartas</span>
          </Link>
        </li>
        <li>
          <Link to="/mercado" className={`${styles.navLink} ${isActive('/mercado') ? styles.active : ''}`}>
            🛒 <span className={styles.linkText}>Mercado</span>
          </Link>
        </li>
        <li>
          {/* ⚠️  BUG: el Link navega a "/Perfil" pero isActive verifica "/ajustes".
              Igual que el Dashboard, la clase active nunca se aplicará.
              Corrección: isActive('/Perfil') */}
          <Link to="/Perfil" className={`${styles.navLink} ${isActive('/ajustes') ? styles.active : ''}`}>
            ⚙️ <span className={styles.linkText}>Ajustes</span>
          </Link>
        </li>
      </ul>

      <hr className={styles.divider} />

      {/* Sección de perfil del usuario activo.
          user?.id usa optional chaining de TypeScript — el ?. evita un error
          si user es null, devolviendo undefined en lugar de crashear.
          Si user es null (no hay sesión), redirige a /Login en lugar del perfil. */}
      <Link
        to={user?.id ? `/perfil/${user.id}` : '/Login'}
        className={styles.userProfile}
        style={{ textDecoration: 'none' }}
      >
        {/* Foto de perfil con imagen de respaldo (fallback).
            El operador || devuelve el lado derecho si el izquierdo es falsy
            (null, undefined, cadena vacía) — si el usuario no tiene foto_perfil
            configurada, muestra una imagen genérica de placeholder. */}
        <img
          src={user?.foto_perfil || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwI-SIdNOEHGxNnr0zNVPf7TD4TaBAxahdSA&s"}
          alt="Perfil"
          className={styles.avatar}
        />

        <div className={styles.userInfo}>
          {/* || "Usuario" muestra "Usuario" como texto por defecto
              si nombre_usuario es null o undefined (sesión no cargada aún) */}
          <strong style={{ color: '#EDEDED' }}>
            {user?.nombre_usuario || "Usuario"}
          </strong>

          {/* Muestra el rol del usuario (ej: "admin", "usuario")
              o "Coleccionista" como valor por defecto */}
          <span className={styles.userRole}>
            {user?.rol || "Coleccionista"}
          </span>
        </div>
      </Link>

    </aside>
  );
};

export default Sidebar;