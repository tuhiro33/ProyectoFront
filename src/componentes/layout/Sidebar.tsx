import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../assets/styles/Sidebar.module.css';
import logoApp from '../../assets/images/Logo.png';

const Sidebar: React.FC = () => {
  // Esto nos dice en qué URL estamos actualmente
  const location = useLocation();

  // Función auxiliar para saber si el link está activo
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={styles.sidebar}>
      
      {/* Branding / Logo */}
      <Link to="/Home" className={styles.brand}>
        <img src={logoApp} alt="Logo" className={styles.logo} />
        <span className={styles.brandName}>Cartas</span>
      </Link>

      <hr className={styles.divider} />

      {/* Navegación Principal */}
      <ul className={styles.navList}>
        <li>
          {/* Si isActive es true, le agrega la clase 'active' */}
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
          <Link to="/ajustes" className={`${styles.navLink} ${isActive('/ajustes') ? styles.active : ''}`}>
            ⚙️ <span className={styles.linkText}>Ajustes</span>
          </Link>
        </li>
      </ul>

      <hr className={styles.divider} />

      {/* Perfil de Usuario (Dropdown falso por ahora) */}
      <div className={styles.userProfile}>
        <img src="https://pbs.twimg.com/media/HBxw4A6awAAxcwd?format=jpg&name=large" alt="Perfil" className={styles.avatar} />
        <div className={styles.userInfo}>
          <strong>Tomas</strong>
          <span className={styles.userRole}>Coleccionista</span>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;