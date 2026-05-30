import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../assets/styles/home.module.css';
import logoApp from '../../assets/images/Logo.png';
import { useAuth } from "../../context/AuthContext";
import { obtenerPublicaciones } from '../../services/ventasService';
import type { PublicacionVenta } from '../../services/ventasService';
import apiClient from '../../api/apiClient';

interface SugerenciaUsuario {
  id: number;
  nombre: string;
}

const HomePage = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [publicaciones, setPublicaciones] = useState<PublicacionVenta[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchUser, setSearchUser] = useState('');
  const [usuariosUnicos, setUsuariosUnicos] = useState<SugerenciaUsuario[]>([]);
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<SugerenciaUsuario[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const cargarComponentesHome = async () => {
      try {
        // NOTA: Asegúrate de aplicar la corrección en ventasService.ts para que obtenerPublicaciones() use apiClient
        const [resPublicaciones, resUsuarios] = await Promise.all([
          obtenerPublicaciones(),
          apiClient.get('/usuarios/coleccionistas')
        ]);

        setPublicaciones(resPublicaciones.slice(0, 6));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setSearchUser(valor);

    if (valor.trim() === '') {
      setSugerenciasFiltradas([]);
      setShowDropdown(false);
      return;
    }

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

  if (loading) return <div className={styles.loadingFull}>Cargando el santuario...</div>;

  return (
    <div className={styles.homeContainer}>

      <header className={styles.header}>
        <div className={styles.logoGroup}>
          <img src={logoApp} alt="Logo" className={styles.logoIcon} />
          <span className={styles.logoText}>TCG Vault</span>
        </div>

        {/* ================= BARRA CON AUTOCOMPLETADO ================= */}
        <div className={styles.searchWrapper}>
          <form onSubmit={handleSearchUserSubmit}>
            <input
              type="text"
              className={styles.searchBar}
              placeholder="🔍 Buscar coleccionista..."
              value={searchUser}
              onChange={handleInputChange}
              onFocus={() => searchUser.trim() !== '' && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
            />
          </form>

          {/* MENÚ DESPLEGABLE DE SUGERENCIAS */}
          {showDropdown && sugerenciasFiltradas.length > 0 && (
            <ul className={styles.dropdownList}>
              {sugerenciasFiltradas.map((usuario) => (
                <li
                  key={usuario.id}
                  onClick={() => handleSelectUsuario(usuario.id)}
                  className={styles.dropdownItem}
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
                // CORRECCIÓN: Usamos navigate para limpiar el estado sin tumbar la subruta de GitHub Pages
                navigate("/login"); 
              }}
              className="btn-secondary"
            >
              Logout
            </button>
          )}
        </div>
      </header>

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
              <div className={styles.cardImageWrapper}>
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
            <h3>TCG Vault</h3>
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
          <p>&copy; {new Date().getFullYear()} TCG Vault. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;