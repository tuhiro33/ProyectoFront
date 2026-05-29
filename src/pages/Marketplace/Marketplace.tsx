import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Marketplace.module.css';
import type { PublicacionVenta } from '../../services/ventasService';
import { useAuth } from "../../context/AuthContext";
import { obtenerPublicaciones, marcarComoVendida, eliminarPublicacion } from '../../services/ventasService';
import { useAsync } from '../../services/useAsync';

const MarketplacePage = () => {
  const { user } = useAuth();
  const [publicaciones, setPublicaciones] = useState<PublicacionVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [juegoFiltro, setJuegoFiltro] = useState('all');
  const [estadoFiltro, setEstadoFiltro] = useState('all');
  const [selectedPub, setSelectedPub] = useState<PublicacionVenta | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const { isLoading, run } = useAsync();

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerPublicaciones();
        setPublicaciones(Array.isArray(data) ? data : []);
        setPublicaciones(data);
      } catch (error) {
        console.error("Error al cargar publicaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Filtros aplicados
  const publicacionesFiltradas = publicaciones.filter(pub => {
    const coincideNombre = pub.coleccion.carta_nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const coincideJuego = juegoFiltro === 'all' || pub.coleccion.carta_juego === juegoFiltro;
    const coincideEstado = estadoFiltro === 'all' || pub.estado_carta.toLowerCase() === estadoFiltro;
    return coincideNombre && coincideJuego && coincideEstado;
  });

  const handleOpenBuyModal = (pub: PublicacionVenta) => setSelectedPub(pub);
  const handleCloseModal = () => setSelectedPub(null);

  const handleConfirmPurchase = () => {
    if (!selectedPub) return;
    alert(`Compra de "${selectedPub.coleccion.carta_nombre}" por $${selectedPub.precio.toFixed(2)} confirmada.\n(Aquí se conectará el flujo de pago)`);
    handleCloseModal();
  };

  const handleMarcarVendida = (pub: PublicacionVenta) => {
    run(async () => {
      if (!window.confirm(`¿Marcar "${pub.coleccion.carta_nombre}" como vendida?`)) return;
      await marcarComoVendida(pub.id);
      setPublicaciones(prev => prev.filter(p => p.id !== pub.id));
      handleCloseModal();
      alert("Carta marcada como vendida y colección actualizada.");
    });
  };

  const handleEliminarPublicacion = (pub: PublicacionVenta) => {
    run(async () => {
      if (!window.confirm(`¿Eliminar la publicación de "${pub.coleccion.carta_nombre}"?`)) return;
      await eliminarPublicacion(pub.id);
      setPublicaciones(prev => prev.filter(p => p.id !== pub.id));
      handleCloseModal();
      alert("Publicación eliminada.");
    });
  };

  if (loading) return <div>Cargando mercado...</div>;
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

            <button className={styles.acceptDisclaimerBtn} onClick={() => setShowDisclaimer(false)}>
              Acepto las condiciones
            </button>
          </div>
        </div>
      )}
      {/* HERO BANNER — igual que antes */}
      <div className={styles.heroBanner}>
        <div className={styles.heroText}>
          <h1>Mercado Global</h1>
          <p>Descubre, compra y vende joyas para tu colección en tiempo real.</p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{publicaciones.length}</span>
            <span className={styles.statLabel}>Cartas listadas</span>
          </div>
        </div>
      </div>

      {/* FILTROS — ahora funcionales */}
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
          <select className={styles.filterSelect} value={juegoFiltro} onChange={(e) => setJuegoFiltro(e.target.value)}>
            <option value="all">Todos los Juegos</option>
            <option value="magic">Magic: The Gathering</option>
            <option value="pokemon">Pokémon TCG</option>
          </select>
          <select className={styles.filterSelect} value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="all">Cualquier Estado</option>
            <option value="nm">Near Mint (NM)</option>
            <option value="lp">Lightly Played (LP)</option>
            <option value="mp">Moderately Played (MP)</option>
            <option value="hp">Heavily Played (HP)</option>
            <option value="dmg">Damaged (DMG)</option>
          </select>
        </div>
      </div>

      {/* GRID — ahora con datos reales y campos correctos */}
      <div className={styles.grid}>
        {publicacionesFiltradas.map((pub) => (
          <div key={pub.id} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img
                src={pub.foto_url || pub.coleccion.carta_imagen}
                alt={pub.coleccion.carta_nombre}
                className={styles.realImage}
                onError={(e) => { (e.target as HTMLImageElement).src = '/fallback-image.png' }}
              />
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{pub.coleccion.carta_nombre}</h3>
                <span className={styles.priceTag}>${pub.precio.toFixed(2)}</span>
              </div>
              <div className={styles.cardMeta}>
                {pub.coleccion.carta_juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                <br />
                <span className={styles.conditionBadge}>Estado: {pub.estado_carta}</span>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.sellerInfo}>
                  Vendedor: <span className={styles.sellerName}>{pub.vendedor.nombre}</span>
                </div>

                {user && pub.vendedor.id === Number(user.id) ? (
                  // Es el dueño — mostrar controles de gestión
                  <div className={styles.ownerActions}>
                    <button
                      className={styles.soldBtn}
                      onClick={() => handleMarcarVendida(pub)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Procesando...' : '✅ Vendida'}
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleEliminarPublicacion(pub)}
                      disabled={isLoading}
                    >
                      {isLoading ? '...' : '🗑️'}
                    </button>
                  </div>
                ) : (
                  // Es otro usuario — mostrar botón de compra normal
                  <button className={styles.buyBtn} onClick={() => handleOpenBuyModal(pub)}>
                    Comprar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE COMPRA — campos actualizados */}
      {selectedPub && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.buyModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalBody}>
              <div className={styles.modalImageWrapper}>
                <img
                  src={selectedPub.foto_url || selectedPub.coleccion.carta_imagen}
                  alt={selectedPub.coleccion.carta_nombre}
                  className={styles.modalLargeImage}
                />
              </div>
              <div className={styles.modalDetails}>
                <h2>{selectedPub.coleccion.carta_nombre}</h2>
                <div className={styles.gameSubtitle}>
                  {selectedPub.coleccion.carta_juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Estado:</span>
                  <span className={styles.conditionBadge}>{selectedPub.estado_carta}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Vendedor:</span>
                  <span className={styles.detailValue}>{selectedPub.vendedor.nombre}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Publicado el:</span>
                  <span className={styles.detailValue}>
                    {new Date(selectedPub.fecha_publicacion).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.priceHuge}>${selectedPub.precio.toFixed(2)}</div>
                <div className={styles.modalActions}>
                  <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={handleCloseModal}>Cancelar</button>

                    {user && selectedPub.vendedor.id === Number(user.id) ? (
                      // Dueño ve sus opciones de gestión
                      <>
                        <button className={styles.soldBtn} onClick={() => handleMarcarVendida(selectedPub)}>
                          ✅ Marcar como Vendida
                        </button>
                        <button className={styles.deletePubBtn} onClick={() => handleEliminarPublicacion(selectedPub)}>
                          🗑️ Eliminar Publicación
                        </button>
                      </>
                    ) : (
                      // Comprador ve el botón de compra
                      <button className={styles.confirmBuyBtn} onClick={handleConfirmPurchase}>
                        Confirmar Compra
                      </button>
                    )}
                  </div>
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