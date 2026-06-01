// Página del marketplace: muestra todas las publicaciones activas de cartas TCG
// y permite a los usuarios comprar, vender o gestionar sus propias publicaciones.
//
// Características principales:
//   - Modal de descargo legal al entrar (showDisclaimer)
//   - Filtros de búsqueda por nombre, juego y estado de la carta
//   - Vista diferenciada: botones de dueño vs botones de comprador
//   - Modal de compra que envía notificación por email al vendedor
import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Marketplace.module.css';
import type { PublicacionVenta } from '../../services/ventasService';
import { useAuth } from "../../context/AuthContext";
import { obtenerPublicaciones, marcarComoVendida, eliminarPublicacion } from '../../services/ventasService';
import { useAsync } from '../../services/useAsync';
import { intercambioService } from '../../services/intercambioService';

const MarketplacePage = () => {
  const { user } = useAuth();

  // publicaciones almacena todas las publicaciones activas cargadas del backend.
  const [publicaciones, setPublicaciones] = useState<PublicacionVenta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de los tres filtros de búsqueda — se aplican en conjunto
  // dentro de publicacionesFiltradas sin llamadas adicionales al backend.
  const [searchTerm, setSearchTerm] = useState('');
  const [juegoFiltro, setJuegoFiltro] = useState('all');
  const [estadoFiltro, setEstadoFiltro] = useState('all');

  // selectedPub guarda la publicación sobre la que se abrió el modal de compra.
  const [selectedPub, setSelectedPub] = useState<PublicacionVenta | null>(null);

  // showDisclaimer controla el modal de descargo legal.
  // Inicia en true para que aparezca inmediatamente al entrar al marketplace.
  // ⚠️  Se resetea a true cada vez que el usuario navega fuera y vuelve —
  // no persiste en localStorage. Para no mostrarlo en cada visita:
  //   useState(() => !localStorage.getItem('disclaimerAceptado'))
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // isLoading y run de useAsync protegen contra doble clic en acciones
  // que llaman al backend (marcar vendida, eliminar, enviar oferta).
  const { isLoading, run } = useAsync();

  // Carga inicial de publicaciones al montar el componente.
  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerPublicaciones();
        // Array.isArray verifica que el backend devolvió un array
        // en lugar de null u otro tipo inesperado.
        setPublicaciones(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar publicaciones:", error);
        // ⚠️  Error silencioso — el marketplace queda vacío sin mensaje al usuario.
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // publicacionesFiltradas aplica los tres filtros simultáneamente.
  // Se recalcula automáticamente cada vez que cambia searchTerm,
  // juegoFiltro, estadoFiltro o publicaciones — sin botón "Buscar".
  // Todos los filtros deben ser true para que la publicación aparezca.
  const publicacionesFiltradas = publicaciones.filter(pub => {
    const coincideNombre = pub.coleccion.carta_nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const coincideJuego = juegoFiltro === 'all' || pub.coleccion.carta_juego === juegoFiltro;
    // .toLowerCase() para que "NM" del backend coincida con "nm" del select
    const coincideEstado = estadoFiltro === 'all' || pub.estado_carta.toLowerCase() === estadoFiltro;
    return coincideNombre && coincideJuego && coincideEstado;
  });

  const handleOpenBuyModal = (pub: PublicacionVenta) => setSelectedPub(pub);
  const handleCloseModal = () => setSelectedPub(null);

  // handleConfirmPurchase envía una notificación por email al vendedor
  // usando intercambioService — NO registra una transacción en el backend.
  // El flujo de compra es: email de contacto → negociación externa → marcar vendida.
  const handleConfirmPurchase = () => {
    if (!selectedPub) return;

    // Verificación de sesión: aunque el botón "Comprar" solo aparece
    // cuando hay usuario logueado, esta guardia protege contra
    // llamadas directas a la función.
    if (!user) {
      alert("Debes iniciar sesión para poder comprar o enviar una oferta.");
      return;
    }

    // run() de useAsync deshabilita el botón mientras se envía el email,
    // evitando que se envíen múltiples notificaciones al mismo vendedor.
    run(async () => {
      const mensajeConfirmacion = `¿Estás seguro de que quieres enviar una oferta de compra por "${selectedPub.coleccion.carta_nombre}" por $${selectedPub.precio.toFixed(2)}?\n\nSe le enviará un correo de notificación al vendedor para coordinar la entrega.`;

      // window.confirm muestra un diálogo nativo de confirmación.
      // Si el usuario cancela, return corta la ejecución dentro del run.
      if (!window.confirm(mensajeConfirmacion)) return;

      // Arma el objeto que espera IntercambioRequest en intercambioService.ts
      // y que el backend mapea a su struct IntercambioRequest.
      const datosNotificacion = {
        nombreCarta:        selectedPub.coleccion.carta_nombre,
        precio:             selectedPub.precio,
        estadoCarta:        selectedPub.estado_carta,
        nombreDestinatario: selectedPub.vendedor.nombre, // Destinatario del email
        correoComprador:    user.email || ""             // Se muestra en el email al vendedor
      };

      // enviarNotificacion devuelve true/false en lugar de lanzar error —
      // ver intercambioService.ts para el manejo de errores interno.
      const exito = await intercambioService.enviarNotificacion(datosNotificacion);

      if (exito) {
        alert(`¡Solicitud enviada! Se ha notificado por correo a ${selectedPub.vendedor.nombre}.`);
        handleCloseModal();
      } else {
        alert("Hubo un error al procesar la notificación de compra. Por favor, inténtalo de nuevo.");
      }
    });
  };

  // handleMarcarVendida es para el vendedor — cambia el estado de la publicación
  // a "Vendida" y reduce la cantidad en ColeccionUsuario (transacción atómica en el backend).
  // Después actualiza el estado local eliminando la publicación del grid
  // sin recargar todas las publicaciones.
  const handleMarcarVendida = (pub: PublicacionVenta) => {
    run(async () => {
      if (!window.confirm(`¿Marcar "${pub.coleccion.carta_nombre}" como vendida?`)) return;
      await marcarComoVendida(pub.id);
      // Actualización optimista: elimina del estado local sin nuevo GET al backend.
      // .filter() devuelve un array nuevo excluyendo la publicación marcada como vendida.
      setPublicaciones(prev => prev.filter(p => p.id !== pub.id));
      handleCloseModal();
      alert("Carta marcada como vendida y colección actualizada.");
    });
  };

  // handleEliminarPublicacion hace soft delete en el backend —
  // cambia estado_publicacion a "Eliminada" y la quita del grid local.
  const handleEliminarPublicacion = (pub: PublicacionVenta) => {
    run(async () => {
      if (!window.confirm(`¿Eliminar la publicación de "${pub.coleccion.carta_nombre}"?`)) return;
      await eliminarPublicacion(pub.id);
      setPublicaciones(prev => prev.filter(p => p.id !== pub.id));
      handleCloseModal();
      alert("Publicación eliminada.");
    });
  };

  if (loading) return <div className={styles.loadingFull}>Cargando mercado...</div>;

  return (
    <div className={styles.marketplaceContainer}>

      {/* Modal de descargo legal — bloquea la vista del marketplace hasta que
          el usuario acepta las condiciones. showDisclaimer inicia en true. */}
      {showDisclaimer && (
        <div className={styles.modalOverlay}>
          <div className={styles.disclaimerModalContent}>
            <h2>⚠️ Advertencia Importante</h2>
            <div className={styles.disclaimerText}>
              <p>
                Nuestra aplicación actúa únicamente como plataforma de intermediación.
                No participamos en la compraventa directa ni verificamos autenticidad,
                estado, legalidad o procedencia de las cartas.
              </p>
              <p>Al utilizar esta aplicación, reconoces y aceptas que:</p>
              <ul>
                <li>Las transacciones son directas entre comprador y vendedor bajo su responsabilidad.</li>
                <li>No garantizamos autenticidad, calidad, estado o valor de las cartas.</li>
                <li>No nos responsabilizamos por fraudes, estafas o pérdidas económicas.</li>
                <li>Es tu responsabilidad verificar al vendedor antes de cualquier operación.</li>
                <li>Recomendamos usar métodos de pago seguros en transacciones en línea.</li>
              </ul>
              <p style={{ color: '#A855F7', fontWeight: 600, textAlign: 'center', marginTop: '1.5rem' }}>
                Al continuar, aceptas estos términos en su totalidad.
              </p>
            </div>
            {/* Al aceptar, showDisclaimer pasa a false y el modal desaparece,
                revelando el contenido del marketplace debajo. */}
            <button
              className={styles.acceptDisclaimerBtn}
              onClick={() => setShowDisclaimer(false)}
            >
              Acepto las condiciones
            </button>
          </div>
        </div>
      )}

      {/* Hero banner con contador de publicaciones activas en tiempo real.
          publicaciones.length refleja el total cargado del backend. */}
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

      {/* Barra de filtros — todos operan en el cliente sobre el array ya cargado.
          Cambiar cualquier filtro re-evalúa publicacionesFiltradas instantáneamente. */}
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
          <select
            className={styles.filterSelect}
            value={juegoFiltro}
            onChange={(e) => setJuegoFiltro(e.target.value)}
          >
            <option value="all">Todos los Juegos</option>
            <option value="magic">Magic: The Gathering</option>
            <option value="pokemon">Pokémon TCG</option>
          </select>
          <select
            className={styles.filterSelect}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            <option value="all">Cualquier Estado</option>
            <option value="nm">Near Mint (NM)</option>
            <option value="lp">Lightly Played (LP)</option>
            <option value="mp">Moderately Played (MP)</option>
            <option value="hp">Heavily Played (HP)</option>
            <option value="dmg">Damaged (DMG)</option>
          </select>
        </div>
      </div>

      {/* Grid de publicaciones filtradas.
          pub.vendedor.id === Number(user.id) detecta si el usuario actual
          es el dueño de la publicación para mostrar controles distintos:
            Dueño    → botones "Vendida" y "Eliminar"
            Comprador → botón "Comprar" */}
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
                  // Vista del dueño: puede marcar como vendida o eliminar
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
                  // Vista del comprador: abre el modal de compra
                  <button className={styles.buyBtn} onClick={() => handleOpenBuyModal(pub)}>
                    Comprar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de compra — se abre al hacer clic en "Comprar".
          onClick en el overlay cierra el modal al hacer clic fuera.
          e.stopPropagation() en el contenido interno evita que el clic
          dentro del modal lo cierre — sin esto, cualquier clic dentro
          propagaría al overlay y cerraría el modal involuntariamente. */}
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
                  {/* toLocaleDateString() convierte el string ISO 8601 del backend
                      a formato de fecha legible según la configuración del navegador.
                      Ejemplo: "2024-03-15T10:30:00Z" → "15/3/2024" en es-MX */}
                  <span className={styles.detailValue}>
                    {new Date(selectedPub.fecha_publicacion).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.priceHuge}>${selectedPub.precio.toFixed(2)}</div>

                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={handleCloseModal}>
                    Cancelar
                  </button>

                  {user && selectedPub.vendedor.id === Number(user.id) ? (
                    // El dueño ve controles de gestión también dentro del modal
                    <>
                      <button
                        className={styles.soldBtn}
                        onClick={() => handleMarcarVendida(selectedPub)}
                      >
                        ✅ Marcar como Vendida
                      </button>
                      <button
                        className={styles.deletePubBtn}
                        onClick={() => handleEliminarPublicacion(selectedPub)}
                      >
                        🗑️ Eliminar
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.confirmBuyBtn}
                      onClick={handleConfirmPurchase}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Enviando oferta...' : 'Confirmar Compra'}
                    </button>
                  )}
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