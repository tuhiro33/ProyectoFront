import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../assets/styles/home.module.css';
import logoApp from '../../assets/images/Logo.png';
import { useAuth } from "../../context/AuthContext";
import { obtenerPublicaciones } from '../../services/ventasService';
import type { PublicacionVenta } from '../../services/ventasService';
import apiClient from '../../api/apiClient'; // Ajusta la cantidad de "../" según la ubicación de tu carpeta api

// Interfaz para estructurar los usuarios únicos que encontramos
interface SugerenciaUsuario {
  id: number;
  nombre: string;
}

const HomePage = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [publicaciones, setPublicaciones] = useState<PublicacionVenta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la barra de búsqueda global
  const [searchUser, setSearchUser] = useState('');
  const [usuariosUnicos, setUsuariosUnicos] = useState<SugerenciaUsuario[]>([]);
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<SugerenciaUsuario[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const cargarComponentesHome = async () => {
      try {
        // Ejecutamos ambas consultas en paralelo para máxima velocidad
        const [resPublicaciones, resUsuarios] = await Promise.all([
          obtenerPublicaciones(),
          apiClient.get('/usuarios/coleccionistas') // 👈 Tu nuevo endpoint global
        ]);

        // 1. Cargamos las publicaciones del feed
        setPublicaciones(resPublicaciones.slice(0, 6));

        // 2. Cargamos TODOS los usuarios que tienen colecciones activas directamente del back
        const listaUsuarios: SugerenciaUsuario[] = Array.isArray(resUsuarios.data) ? resUsuarios.data : [];
        setUsuariosUnicos(listaUsuarios);

      } catch (error) {
        console.error("Error al cargar datos globales en el Home", error);
      } finally {
        setLoading(false);
      }
    };

    cargarComponentesHome();
  }, []);

  // ================= LOS MANEJACORES DE FILTRADO SE QUEDAN IGUAL =================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setSearchUser(valor);

    if (valor.trim() === '') {
      setSugerenciasFiltradas([]);
      setShowDropdown(false);
      return;
    }

    // El filtro ahora buscará sobre CUALQUIER usuario con colección en la app, no solo los 6 del feed
    const filtrados = usuariosUnicos.filter(usuario =>
      usuario.nombre.toLowerCase().includes(valor.toLowerCase())
    );

    setSugerenciasFiltradas(filtrados);
    setShowDropdown(true);
  };

  const handleSelectUsuario = (id: number) => {
    setShowDropdown(false);
    setSearchUser('');
    navigate(`/perfil/${id}`);
  };

  const handleSearchUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sugerenciasFiltradas.length > 0) {
      handleSelectUsuario(sugerenciasFiltradas[0].id);
    }
  };

  if (loading) return <div>Cargando el santuario...</div>;
  return (
    <div className={styles.homeContainer}>

      <header className={styles.header}>
        <div className={styles.logoGroup}>
          <div className={styles.logoIcon}>
            <img src={logoApp} alt="Logo" className={styles.logoIcon} />
          </div>
          <span className={styles.logoText}>*nombre de la aplicacion que se me ocurrio en el momento*</span>
        </div>

        {/* ================= CONTENEDOR DE LA BARRA CON AUTOCOMPLETADO ================= */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px', margin: '0 2rem' }}>
          <form onSubmit={handleSearchUserSubmit}>
            <input
              type="text"
              placeholder="🔍 Buscar coleccionista..."
              value={searchUser}
              onChange={handleInputChange}
              onFocus={() => searchUser.trim() !== '' && setShowDropdown(true)}
              // Retraso para permitir el clic antes de ocultar el menú
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid #3f3f46',
                backgroundColor: '#18181b',
                color: '#ededed',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </form>

          {/* MENÚ DESPLEGABLE DE SUGERENCIAS */}
          {showDropdown && sugerenciasFiltradas.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              width: '100%',
              backgroundColor: '#1f1f23',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              listStyle: 'none',
              padding: '0.5rem 0',
              margin: 0,
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {sugerenciasFiltradas.map((usuario) => (
                <li
                  key={usuario.id}
                  onClick={() => handleSelectUsuario(usuario.id)}
                  style={{
                    padding: '0.6rem 1rem',
                    color: '#ededed',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'background-color 0.2s'
                  }}
                  // Efecto hover simple en línea
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272a')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  👤 {usuario.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className={styles.navLinks}>
          <Link to="/coleccion">Mi colección</Link>
          <Link to="/mercado">Publicaciones de cartas</Link>
        </nav>

        <div className={styles.headerActions}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn-secondary">Iniciar Sesión</Link>
              <Link to="/registro" className="btn-primary is-neutral">Registrarse</Link>
            </>
          ) : (
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              className="btn-secondary"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* ... El resto de tus secciones (Hero, Mercado y Footer) se quedan exactamente igual ... */}
      <section className={styles.hero}>
        <h1 className={styles.title}>El santuario definitivo para tus colecciones</h1>
        <p className={styles.subtitle}>Gestiona, organiza y presume tus cartones brillosos en un solo lugar.</p>
        <div className={styles.ctaGroup}>
          <Link to={isAuthenticated ? "/coleccion" : "/login"} className="btn-primary is-neutral">
            Comenzar mi colección
          </Link>
        </div>
      </section>

      <section className={styles.albumSection} id="mercado">
        <div className={styles.albumHeader}>
          <h2>Descubre el Mercado</h2>
          <p>Explora las últimas joyas añadidas por otros coleccionistas.</p>
        </div>

        <div className={styles.grid}>
          {publicaciones.map((pub) => (
            <div key={pub.id} className={styles.card}>
              <div className={styles.cardImage}>
                <img
                  src={pub.foto_url || pub.coleccion.carta_imagen}
                  alt={pub.coleccion.carta_nombre}
                  className={styles.realImage}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/fallback-image.png'; }}
                />
              </div>
              <div className={styles.cardBody}>
                <h3>{pub.coleccion.carta_nombre}</h3>
                <p className={styles.cardText}>
                  {pub.coleccion.carta_juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                </p>
                <div className={styles.cardFooter}>
                  <div className={styles.btnGroup}>
                    <button className={styles.btnOutline}>Ver detalle</button>
                  </div>
                  <small className={styles.textMuted}>${pub.precio.toFixed(2)}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>La Pagina sin un nombre</h3>
            <p>Construido por y para coleccionistas.</p>
          </div>
          <div className={styles.footerLinksGrid}>
            <div className={styles.linkColumn}>
              <h4>Plataforma</h4>
              <a href="#">Características</a>
              <a href="#">Precios</a>
              <a href="#">Actualizaciones</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Soporte</h4>
              <a href="#">Centro de Ayuda</a>
              <a href="#">Reglas del Mercado</a>
              <a href="#">Contacto</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Legal</h4>
              <a href="#">Privacidad</a>
              <a href="#">Términos de Servicio</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} *nombre de la aplicacion que se me ocurrio en el momento*. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;