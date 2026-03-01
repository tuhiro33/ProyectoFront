import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../assets/styles/home.module.css';
import logoApp from '../../assets/images/Logo.png';

// Base de datos simulada para nuestro álbum
const featuredCards = [
  { id: 1, title: "Black Lotus", game: "Magic: The Gathering", time: "Hace 2 horas", color: "magic" },
  { id: 2, title: "Charizard 1st Edition", game: "Pokémon TCG", time: "Hace 5 horas", color: "pokemon" },
  { id: 3, title: "Mox Pearl", game: "Magic: The Gathering", time: "Hace 1 día", color: "magic" },
  { id: 4, title: "Umbreon VMAX", game: "Pokémon TCG", time: "Hace 2 días", color: "pokemon" },
  { id: 5, title: "Jace, the Mind Sculptor", game: "Magic: The Gathering", time: "Hace 3 días", color: "magic" },
  { id: 6, title: "Pikachu Illustrator", game: "Pokémon TCG", time: "Hace 1 semana", color: "pokemon" },
];

const HomePage = () => {
  return (
    <div className={styles.homeContainer}>
      
      <header className={styles.header}>
        <div className={styles.logoGroup}>
          <div className={styles.logoIcon}><img src={logoApp} alt="el logo deberia ir... aqui?" className={styles.logoIcon} /></div>
          <span className={styles.logoText}>*nombre de la aplicacion que se me ocurrio en el momento*</span>
        </div>
        
        <nav className={styles.navLinks}>
          <a href="#caracteristicas"><Link to="/coleccion">Mi coleccion</Link></a>
          <a href="#mercado">Mercado</a>
          <a href="#Publicaciones"><Link to="/mercado">Publicaciones de cartas</Link></a>
        </nav>

        <div className={styles.headerActions}>
          <Link to="/login" className="btn-secondary">Iniciar Sesión</Link>
          <Link to="/registro" className="btn-primary is-neutral">Registrarse</Link>
        </div>
      </header>


      <section className={styles.hero}>
        <h1 className={styles.title}>El santuario definitivo para tus colecciones</h1>
        <p className={styles.subtitle}>
          Gestiona, organiza y presume tus cartones brillosos en un solo lugar.
        </p>
        <div className={styles.ctaGroup}>
          <Link to="/login" className="btn-primary is-neutral">Comenzar mi colección</Link>
        </div>
      </section>

      <section className={styles.albumSection} id="mercado">
        <div className={styles.albumHeader}>
          <h2>Descubre el Mercado</h2>
          <p>Explora las últimas joyas añadidas por otros coleccionistas.</p>
        </div>

        <div className={styles.grid}>
          {featuredCards.map((card) => (
            <div key={card.id} className={styles.card}>
              <div className={`${styles.cardImage} ${card.color === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
                 <span>{card.title.charAt(0)}</span>
              </div>
              <div className={styles.cardBody}>
                <h3>{card.title}</h3>
                <p className={styles.cardText}>{card.game}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.btnGroup}>
                    <button className={styles.btnOutline}>Ver detalle</button>
                  </div>
                  <small className={styles.textMuted}>{card.time}</small>
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