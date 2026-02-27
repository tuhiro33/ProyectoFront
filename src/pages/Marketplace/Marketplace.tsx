import React, { useState } from 'react';
import styles from '../../assets/styles/Marketplace.module.css';

// ================= INTERFACES (Espejo de tu Backend en Go) =================
interface Usuario {
  id: number;
  nombre_usuario: string; 
}

interface ColeccionUsuario {
  id: number;
  nombre_carta: string;   
  juego: 'magic' | 'pokemon'; 
}

interface PublicacionVenta {
  ID: number;
  Precio: number;
  EstadoCarta: string;
  FotoURL: string;
  EstadoPublicacion: string;
  FechaPublicacion: string;
  Vendedor: Usuario;
  Coleccion: ColeccionUsuario;
}

// ================= DATOS DE PRUEBA (Mock Data) =================
const mockPublicaciones: PublicacionVenta[] = [
  {
    ID: 1,
    Precio: 850.00,
    EstadoCarta: "NM",
    FotoURL: "https://abyssproxyshop.com/wp-content/uploads/2022/02/Gaeas-Cradle-C.jpg", 
    EstadoPublicacion: "Activa",
    FechaPublicacion: "2026-02-26T10:00:00Z",
    Vendedor: { id: 1, nombre_usuario: "UrzaStore" },
    Coleccion: { id: 101, nombre_carta: "Gaea's Cradle", juego: "magic" }
  },
  {
    ID: 2,
    Precio: 185.50,
    EstadoCarta: "LP",
    // Aquí le pusimos una imagen de prueba real para ver cómo se ve el FotoURL
    FotoURL: "https://i.redd.it/lots-of-hype-for-the-lugia-v-alt-art-and-i-know-im-not-v0-oz84101wk6x91.jpg?width=3024&format=pjpg&auto=webp&s=1ba547e066031bb0c3e8903de6d6e1bc84073e4b", 
    EstadoPublicacion: "Activa",
    FechaPublicacion: "2026-02-25T15:30:00Z",
    Vendedor: { id: 2, nombre_usuario: "PokeCenter" },
    Coleccion: { id: 102, nombre_carta: "Lugia V Alt Art", juego: "pokemon" }
  },
  {
    ID: 3,
    Precio: 95.00,
    EstadoCarta: "Mint",
    FotoURL: "https://gatherer-static.wizards.com/Cards/medium/9EE93146CA14A256CD5C29FE40C394DDEFB749C2D8DC6FEB1AFAF3DCE97E5862.png", 
    EstadoPublicacion: "Activa",
    FechaPublicacion: "2026-02-26T08:15:00Z",
    Vendedor: { id: 3, nombre_usuario: "BlueMage99" },
    Coleccion: { id: 103, nombre_carta: "Force of Will", juego: "magic" }
  }
  
];



// ================= COMPONENTE PRINCIPAL =================
const MarketplacePage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Usamos los datos falsos por ahora hasta que el fetch a Go esté listo
  const publicaciones = mockPublicaciones;

  return (
    
    <div className={styles.marketplaceContainer}>
      
      <div className={styles.marketplaceContainer}>
      
      {/* ================= BANNER HERO (NUEVO) ================= */}
      <div className={styles.heroBanner}>
        <div className={styles.heroText}>
          <h1>Mercado Global</h1>
          <p>Descubre, compra y vende joyas para tu colección en tiempo real.</p>
        </div>
        
        {/* Estadísticas falsas para darle vida al diseño */}
        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>1,204</span>
            <span className={styles.statLabel}>Cartas listadas</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>+300</span>
            <span className={styles.statLabel}>Vendedores</span>
          </div>
        </div>
      </div>

      {/* ================= BARRA DE FILTROS (ACTUALIZADA) ================= */}
      <div className={styles.filtersContainer}>
        <h3 className={styles.filtersTitle}>Filtros de Búsqueda</h3>
        <div className={styles.filtersBar}>
          
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Ej. Charizard 1st Edition..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select className={styles.filterSelect}>
            <option value="all">Todos los Juegos</option>
            <option value="magic">Magic: The Gathering</option>
            <option value="pokemon">Pokémon TCG</option>
          </select>

          <select className={styles.filterSelect}>
            <option value="all">Cualquier Estado</option>
            <option value="nm">Near Mint (NM)</option>
            <option value="lp">Lightly Played (LP)</option>
            <option value="mp">Moderately Played (MP)</option>
          </select>
        </div>
      </div>

      {/* ================= CUADRÍCULA DE CARTAS ================= */}
      <div className={styles.grid}>
        {publicaciones.map((pub) => (
          <div key={pub.ID} className={styles.card}>
            
            {pub.FotoURL ? (
              <div className={styles.imageWrapper}>
                <img src={pub.FotoURL} alt={pub.Coleccion.nombre_carta} className={styles.realImage} />
              </div>
            ) : (
              <div className={`${styles.cardImage} ${pub.Coleccion.juego === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
                <span>{pub.Coleccion.nombre_carta.charAt(0)}</span>
              </div>
            )}

            <div className={styles.cardInfo}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{pub.Coleccion.nombre_carta}</h3>
                <span className={styles.priceTag}>${pub.Precio.toFixed(2)}</span>
              </div>
              
              <div className={styles.cardMeta}>
                {pub.Coleccion.juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                <br />
                <span className={styles.conditionBadge}>Estado: {pub.EstadoCarta}</span>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.sellerInfo}>
                  Vendedor: <span className={styles.sellerName}>{pub.Vendedor.nombre_usuario}</span>
                </div>
                <button className={styles.buyBtn}>Comprar</button>
              </div>
            </div>
            
          </div>
        ))}
      </div>

    </div>

    </div>
  );
};

export default MarketplacePage;