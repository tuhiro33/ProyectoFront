// Página principal / landing page de TCG Vault.
// Es la única página con layout propio (header + footer) — no usa AppLayout
// porque es accesible sin autenticación y tiene navegación diferente al sidebar.
//
// Responsabilidades:
//   - Muestra las últimas publicaciones del marketplace (vista previa)
//   - Buscador de coleccionistas con autocompletado
//   - Navegación adaptada según si hay sesión activa o no
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../assets/styles/home.module.css';
import logoApp from '../../assets/images/Logo.png';
import { useAuth } from "../../context/AuthContext";
import { obtenerPublicaciones } from '../../services/ventasService';
import type { PublicacionVenta } from '../../services/ventasService';
import apiClient from '../../api/apiClient';

// SugerenciaUsuario es la forma del objeto que devuelve
// GET /usuarios/coleccionistas — solo id y nombre para el buscador.
// Debe coincidir con el struct UsuarioSugerencia de
// coleccionUsuarios_controller.go en el backend.
interface SugerenciaUsuario {
  id: number;
  nombre: string;
}

const HomePage = () => {
  // isAuthenticated determina qué botones mostrar en el header (Login/Register vs Logout).
  // logout cierra la sesión limpiando localStorage y el estado de AuthContext.
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [publicaciones, setPublicaciones] = useState<PublicacionVenta[]>([]);
  const [loading, setLoading] = useState(true);

  // searchUser es el texto actual del input del buscador de coleccionistas.
  const [searchUser, setSearchUser] = useState('');

  // usuariosUnicos almacena TODOS los coleccionistas cargados al montar —
  // el filtrado se hace en el cliente sin llamadas adicionales al backend.
  const [usuariosUnicos, setUsuariosUnicos] = useState<SugerenciaUsuario[]>([]);

  // sugerenciasFiltradas es el subconjunto de usuariosUnicos que coincide
  // con el texto actual del buscador — se recalcula en cada keystroke.
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<SugerenciaUsuario[]>([]);

  // showDropdown controla la visibilidad del menú de sugerencias.
  const [showDropdown, setShowDropdown] = useState(false);

  // useEffect carga en paralelo las publicaciones y los coleccionistas
  // usando Promise.all — ambas peticiones se lanzan simultáneamente en lugar
  // de esperar que una termine para iniciar la otra, reduciendo el tiempo total.
  // El array vacío [] significa que solo se ejecuta al montar el componente.
  useEffect(() => {
    const cargarComponentesHome = async () => {
      try {
        // Promise.all recibe un array de promesas y espera que TODAS terminen.
        // Si cualquiera falla, el catch captura el error y ningún dato se carga.
        // resPublicaciones y resUsuarios reciben los resultados en el mismo orden.
        const [resPublicaciones, resUsuarios] = await Promise.all([
          obtenerPublicaciones(),                        // GET /publicaciones
          apiClient.get('/usuarios/coleccionistas')      // GET /usuarios/coleccionistas
        ]);

        // .slice(0, 6) limita la vista previa del mercado a 6 cartas —
        // es solo un adelanto, el marketplace completo está en /mercado.
        setPublicaciones(resPublicaciones.slice(0, 6));

        const listaUsuarios: SugerenciaUsuario[] = Array.isArray(resUsuarios.data)
          ? resUsuarios.data
          : [];
        setUsuariosUnicos(listaUsuarios);

      } catch (error) {
        console.error("Error al cargar datos globales en el Home", error);
        // ⚠️  Error silencioso para el usuario — la página carga vacía
        // sin indicar qué falló. Considerar estados de error separados
        // para publicaciones y usuarios.
      } finally {
        setLoading(false);
      }
    };

    cargarComponentesHome();
  }, []);

  // handleInputChange actualiza el buscador y filtra sugerencias en el cliente.
  // El filtrado es local (no llama al backend) porque todos los coleccionistas
  // ya están cargados en usuariosUnicos desde el useEffect inicial.
  // .toLowerCase() en ambos lados hace la búsqueda insensible a mayúsculas.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setSearchUser(valor);

    if (valor.trim() === '') {
      setSugerenciasFiltradas([]);
      setShowDropdown(false);
      return;
    }

    // .includes() devuelve true si el nombre del usuario contiene el texto buscado
    // en cualquier posición (no solo al inicio).
    const filtrados = usuariosUnicos.filter(usuario =>
      usuario.nombre.toLowerCase().includes(valor.toLowerCase())
    );

    setSugerenciasFiltradas(filtrados);
    setShowDropdown(true);
  };

  // handleSelectUsuario navega al perfil público del coleccionista seleccionado
  // y limpia el estado del buscador.
  const handleSelectUsuario = (id: number) => {
    setShowDropdown(false);
    setSearchUser('');
    navigate(`/perfil/${id}`);
  };

  // handleSearchUserSubmit maneja el Enter en el buscador —
  // navega al primer resultado de las sugerencias filtradas.
  const handleSearchUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sugerenciasFiltradas.length > 0) {
      handleSelectUsuario(sugerenciasFiltradas[0].id);
    }
  };

  if (loading) return <div className={styles.loadingFull}>Cargando el santuario...</div>;

  return (
    <div className={styles.homeContainer}>

      {/* Header propio — diferente al Sidebar de AppLayout.
          Adapta su contenido según isAuthenticated:
            Sin sesión → botones Login y Registrarse
            Con sesión → botón Logout */}
      <header className={styles.header}>
        <div className={styles.logoGroup}>
          <img src={logoApp} alt="Logo" className={styles.logoIcon} />
          <span className={styles.logoText}>TCG Vault</span>
        </div>

        {/* Buscador de coleccionistas con dropdown de autocompletado.
            onFocus reactiva el dropdown si ya había texto escrito
            (por si el usuario hizo clic fuera y vuelve al input).
            onBlur cierra el dropdown cuando el input pierde el foco.
            setTimeout 200ms da tiempo para que el onClick del dropdown
            se ejecute ANTES de que onBlur lo cierre — sin este delay,
            el dropdown desaparecería antes de procesar el clic. */}
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

          {/* Dropdown: solo visible cuando showDropdown es true Y hay sugerencias.
              Cada li tiene onClick para navegar al perfil del coleccionista. */}
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
            // Usuario sin sesión: muestra opciones de entrada
            <>
              <Link to="/login" className="btn-secondary">Iniciar Sesión</Link>
              <Link to="/registro" className="btn-primary is-neutral">Registrarse</Link>
            </>
          ) : (
            // Usuario con sesión: logout limpia AuthContext y redirige al login.
            // navigate("/login") es más seguro que window.location.href en HashRouter
            // porque respeta el sistema de rutas de React Router sin recargar la página.
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="btn-secondary"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Hero section: llamada a la acción principal.
          El destino del CTA cambia según autenticación:
            Con sesión  → /coleccion (ir directo a su biblioteca)
            Sin sesión  → /login    (primero debe autenticarse) */}
      <section className={styles.hero}>
        <h1 className={styles.title}>El santuario definitivo para tus colecciones</h1>
        <p className={styles.subtitle}>
          Gestiona, organiza y presume tus cartones brillosos en un solo lugar.
        </p>
        <div className={styles.ctaGroup}>
          <Link to={isAuthenticated ? "/coleccion" : "/login"} className="btn-primary is-neutral">
            Comenzar mi colección
          </Link>
        </div>
      </section>

      {/* Vista previa del marketplace — muestra las 6 publicaciones más recientes.
          Para ver todas, el usuario debe ir a /mercado. */}
      <section className={styles.albumSection} id="mercado">
        <div className={styles.albumHeader}>
          <h2>Descubre el Mercado</h2>
          <p>Explora las últimas joyas añadidas por otros coleccionistas.</p>
        </div>

        <div className={styles.grid}>
          {publicaciones.map((pub) => (
            <div key={pub.id} className={styles.card}>
              <div className={styles.cardImageWrapper}>
                {/* Prioriza foto_url (imagen real subida por el vendedor)
                    sobre carta_imagen (imagen oficial de la API externa).
                    El operador || elige carta_imagen si foto_url está vacío. */}
                <img
                  src={pub.foto_url || pub.coleccion.carta_imagen}
                  alt={pub.coleccion.carta_nombre}
                  className={styles.realImage}
                  // ⚠️  '/fallback-image.png' debe existir en la carpeta public/
                  // del proyecto Vite para que funcione como imagen de respaldo.
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
                    {/* ⚠️  "Ver detalle" no navega a ningún lado —
                        falta implementar la ruta de detalle de publicación
                        o navegar a /mercado con el id de la publicación. */}
                    <button className={styles.btnOutline}>Ver detalle</button>
                  </div>
                  {/* .toFixed(2) formatea el precio con exactamente 2 decimales:
                      15 → "15.00", 9.5 → "9.50" */}
                  <small className={styles.textMuted}>${pub.precio.toFixed(2)}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer informativo — los enlaces con href="#" son placeholders
          sin funcionalidad implementada todavía. */}
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
        {/* new Date().getFullYear() inserta el año actual dinámicamente —
            el copyright siempre estará actualizado sin editar el código. */}
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} TCG Vault. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;