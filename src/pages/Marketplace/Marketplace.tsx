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
  

  // ESTADOS PARA EL MODAL DE COMPRA
  const [selectedPub, setSelectedPub] = useState<PublicacionVenta | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true); 


  const publicaciones = mockPublicaciones;

  // Funciones para manejar el Modal
  const handleOpenBuyModal = (pub: PublicacionVenta) => {
    setSelectedPub(pub);
  };

  const handleCloseModal = () => {
    setSelectedPub(null);
  };

  const handleConfirmPurchase = () => {
    if (selectedPub) {
      alert(`Has confirmado la compra de ${selectedPub.Coleccion.nombre_carta} por $${selectedPub.Precio.toFixed(2)}.\n\n(Aquí se conectará tu backend en Go)`);
      handleCloseModal();
    }
  };

  ///////////////////////////////////////////////////////////////////////
  return (
    <div className={styles.marketplaceContainer}>
      {/* ================= MODAL FLOTANTE DE DESCARGO (APARECE PRIMERO) ================= */}
      {showDisclaimer && (
        <div className={styles.modalOverlay}>
          <div className={styles.disclaimerModalContent}>
            <h2>⚠️ Advertencia Importante</h2>
            
            <div className={styles.disclaimerText}>
              <p>
                Nuestra aplicación actúa únicamente como una plataforma de intermediación que conecta a compradores y vendedores de cartas. 
                No participamos en la compraventa directa de los productos ni verificamos la autenticidad, estado, legalidad o procedencia de las cartas ofrecidas por los usuarios.
              </p>
              
              <p>Al utilizar esta aplicación, reconoces y aceptas que:</p>
              
              <ul>
                <li>Todas las transacciones se realizan directamente entre comprador y vendedor bajo su propia responsabilidad.</li>
                <li>La aplicación no garantiza la autenticidad, calidad, estado o valor de las cartas publicadas.</li>
                <li>No nos hacemos responsables por fraudes, estafas, productos falsificados, pérdidas económicas o cualquier otro inconveniente.</li>
                <li>Es tu responsabilidad verificar la reputación, información y condiciones del vendedor o comprador antes de concretar cualquier operación.</li>
                <li>Recomendamos tomar las precauciones necesarias al realizar transacciones en línea, incluyendo el uso de métodos de pago seguros.</li>
              </ul>

              <p style={{ color: '#A855F7', fontWeight: 600, textAlign: 'center', marginTop: '1.5rem' }}>
                Al continuar utilizando la plataforma, aceptas estos términos en su totalidad.
              </p>
            </div>

            <button 
              className={styles.acceptDisclaimerBtn} 
              onClick={() => setShowDisclaimer(false)}
            >
              Acepto las condiciones
            </button>
          </div>
        </div>
      )}
      {/* ================= BANNER HERO ================= */}
      <div className={styles.heroBanner}>
        <div className={styles.heroText}>
          <h1>Mercado Global</h1>
          <p>Descubre, compra y vende joyas para tu colección en tiempo real.</p>
        </div>
        
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
      
      {/* ================= BARRA DE FILTROS ================= */}
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
                {/* AL HACER CLIC, ABRIMOS EL MODAL */}
                <button 
                  className={styles.buyBtn}
                  onClick={() => handleOpenBuyModal(pub)}
                >
                  Comprar
                </button>
              </div>
            </div>
            
          </div>
        ))}
      </div>

      {/* ================= MODAL DE DETALLES DE COMPRA ================= */}
      {selectedPub && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          {/* El stopPropagation evita que al hacer clic dentro de la caja se cierre el modal */}
          <div className={styles.buyModalContent} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalBody}>
              
              {/* Lado Izquierdo: Imagen Grande */}
              <div className={styles.modalImageWrapper}>
                {selectedPub.FotoURL ? (
                  <img src={selectedPub.FotoURL} alt={selectedPub.Coleccion.nombre_carta} className={styles.modalLargeImage} />
                ) : (
                  <div className={`${styles.modalPlaceholder} ${selectedPub.Coleccion.juego === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
                    <span>{selectedPub.Coleccion.nombre_carta.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Lado Derecho: Información */}
              <div className={styles.modalDetails}>
                <h2>{selectedPub.Coleccion.nombre_carta}</h2>
                <div className={styles.gameSubtitle}>
                  {selectedPub.Coleccion.juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Estado de la carta:</span>
                  <span className={styles.detailValue}>
                    <span className={styles.conditionBadge}>{selectedPub.EstadoCarta}</span>
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Vendedor:</span>
                  <span className={styles.detailValue}>{selectedPub.Vendedor.nombre_usuario}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Publicado el:</span>
                  <span className={styles.detailValue}>
                    {new Date(selectedPub.FechaPublicacion).toLocaleDateString()}
                  </span>
                </div>

                <div className={styles.priceHuge}>
                  ${selectedPub.Precio.toFixed(2)}
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button className={styles.confirmBuyBtn} onClick={handleConfirmPurchase}>
                    Confirmar Compra
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MarketplacePage;