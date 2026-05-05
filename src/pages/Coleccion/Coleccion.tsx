import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Coleccion.module.css';
import { Link,useLocation} from 'react-router-dom';
import { obtenerColeccion, eliminarCartaDeColeccion } from '../../services/cardService';
import type { ColeccionItem } from '../../services/cardService';
import { useAuth } from "../../context/AuthContext";



const ColeccionPage = () => {
  const [coleccion, setColeccion] = useState<ColeccionItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<ColeccionItem | null>(null);
  // Estado inicial vacío para cargar desde el backend
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const [saleForm, setSaleForm] = useState({
    precio: '',
    estado: 'NM',
    imagen: null as File | null
  });

  // 2. EFECTO PARA CARGAR DATOS REALES
  useEffect(() => {
  const cargarDatos = async () => {
    try {
      
      // VALIDACIÓN: Si no hay datos, detenemos la ejecución
      if (!user || !user.id) {
          console.warn("No se encontró usuario iniciado.");
          setLoading(false);
          return;
        }

        const data = await obtenerColeccion(Number(user.id));
        setColeccion(data);
      
      
    } catch (error) {
      console.error("Error al cargar colección:", error);
    } finally {
      setLoading(false);
    }
  };

  cargarDatos();
}, [user]);

  const handleOpenSaleModal = (item: any) => {
    setSelectedCard(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setSaleForm({ precio: '', estado: 'NM', imagen: null });
  };

 const handleVenderSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // ✅ Verificamos que no sea null antes de acceder a sus propiedades
  if (!selectedCard) return;
  
  alert(`La carta ${selectedCard.carta.nombre} se ha subido al mercado.`);
  handleCloseModal();
};
  // 3. ELIMINACIÓN REAL MEDIANTE SERVICIO
  const handleEliminarCarta = async (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar ${nombre} de tu colección?`)) {
      try {
        // Asumiendo que añadiste esta función al cardService
        await eliminarCartaDeColeccion(id);
        setColeccion(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        alert("No se pudo eliminar la carta");
      }
    }
  };

  if (loading) return <div className={styles.loadingFull}>Cargando tu colección...</div>;


  return (
    <div className={styles.coleccionContainer}>
      <div className={styles.header}>
        <div>
          <h1>Mi Colección</h1>
          <p>Gestiona las cartas que posees en físico.</p>
        </div>
        <button className="btn-primary is-neutral">
          <Link to="/AgregarC" style={{ color: 'inherit', textDecoration: 'none' }}>Añadir Nueva Carta</Link>
        </button>
      </div>

      <div className={styles.grid}>
        {coleccion.length === 0 ? (
          <p>No tienes cartas en tu colección todavía.</p>
        ) : (
          coleccion.map((item) => (
            <div key={item.id} className={`${styles.card} ${item.es_foil ? styles.isFoil : ''}`}>
              <div className={styles.badgeContainer}>
                <span className={styles.qtyBadge}>x{item.cantidad}</span>
                {item.es_foil && <span className={styles.foilBadge}>Foil</span>}
              </div>

              <div className={styles.imageContainer}>
                {/* 4. USAMOS LA URL QUE YA VIENE DEL BACKEND */}
                <img
                  src={item.carta.url_imagen}
                  alt={item.carta.nombre}
                  className={styles.cardImage}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'fallback-image-url.png' }}
                />
              </div>

              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle}>{item.carta.nombre}</h3>
                <span className={styles.gameLabel}>
                  {item.carta.juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                </span>

                <div className={styles.cardActions}>
                  <button className={styles.actionBtn} onClick={() => handleOpenSaleModal(item)}>
                    Al Mercado
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleEliminarCarta(item.id, item.carta.nombre)}>
                    🗑️
                  </button>
                </div>
            </div>
            </div>
          ))
        )}
      </div>

      {/* ================= MODAL DE VENTA ================= */}
      {showModal && selectedCard && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Publicar para Venta</h2>
            <strong className={styles.cardNameHighlight}>{selectedCard.carta.nombre}</strong>

            <form className={styles.saleForm} onSubmit={handleVenderSubmit}>
              <div className={styles.formGroup}>
                <label>Estado de la Carta</label>
                <select
                  value={saleForm.estado}
                  onChange={(e) => setSaleForm({ ...saleForm, estado: e.target.value })}
                >
                  <option value="NM">Near Mint (NM)</option>
                  <option value="LP">Lightly Played (LP)</option>
                  <option value="MP">Moderately Played (MP)</option>
                  <option value="HP">Heavily Played (HP)</option>
                  <option value="DMG">Damaged (DMG)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Precio de Venta ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={saleForm.precio}
                  onChange={(e) => setSaleForm({ ...saleForm, precio: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Foto Real de tu Carta</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setSaleForm({ ...saleForm, imagen: e.target.files ? e.target.files[0] : null })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Publicar ahora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColeccionPage;