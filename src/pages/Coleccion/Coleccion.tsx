import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Coleccion.module.css';
import { Link, useLocation } from 'react-router-dom';
import { obtenerColeccion, eliminarCartaDeColeccion } from '../../services/cardService';
import type { ColeccionItem } from '../../services/cardService';
import { useAuth } from "../../context/AuthContext";
import type { CrearPublicacionPayload } from '../../services/ventasService';
import { crearPublicacion, contarPublicacionesActivas } from '../../services/ventasService';
import { useAsync } from '../../services/useAsync';

const ColeccionPage = () => {
  const [coleccion, setColeccion] = useState<ColeccionItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<ColeccionItem | null>(null);
  const [publicacionesUsadas, setPublicacionesUsadas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const { isLoading, run } = useAsync();

  const [saleForm, setSaleForm] = useState({
    precio: '',
    estado: 'NM',
    imagen: null as File | null
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
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

  const handleOpenSaleModal = async (item: ColeccionItem) => {
    setSelectedCard(item);
    setShowModal(true);
    try {
      const usadas = await contarPublicacionesActivas(item.id);
      setPublicacionesUsadas(usadas);
    } catch {
      setPublicacionesUsadas(0);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setSaleForm({ precio: '', estado: 'NM', imagen: null });
  };

  const handleVenderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (!selectedCard) return;
      let fotoURL = selectedCard.carta.url_imagen;
      if (saleForm.imagen) {
        const token = localStorage.getItem("token");
        const uploadData = new FormData();
        uploadData.append("image", saleForm.imagen);
        const uploadRes = await fetch("http://localhost:8080/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadData,
        });
        if (!uploadRes.ok) throw new Error("Error al subir la imagen");
        const uploadJson = await uploadRes.json();
        fotoURL = uploadJson.url;
      }
      const payload: CrearPublicacionPayload = {
        coleccion_id: selectedCard.id,
        precio: Number(saleForm.precio),
        estado_carta: saleForm.estado,
        foto_url: fotoURL,
      };
      await crearPublicacion(payload);
      alert(`¡"${selectedCard.carta.nombre}" publicada en el mercado!`);
      handleCloseModal();
    });
  };

  const handleEliminarCarta = (id: number, ExtretNombre: string) => {
    run(async () => {
      if (!window.confirm(`¿Eliminar ${ExtretNombre} de tu colección?`)) return;
      await eliminarCartaDeColeccion(id);
      setColeccion(prev => prev.filter(i => i.id !== id));
    });
  };

  if (loading) return <div className={styles.loadingFull}>Cargando tu colección...</div>;

  // =================================================================
  // FILTRADO CLAVE: Filtrar las cartas para mostrar solo las que tengan cantidad > 0
  // =================================================================
  const coleccionVisible = coleccion.filter(item => item.cantidad > 0);

  return (
    <div className={styles.coleccionContainer}>
      <div className={styles.header}>
        <div>
          <h1>Mi Colección</h1>
          <p>Gestiona las cartas que posees en físico.</p>
        </div>
        <button className="btn-primary is-neutral">
          <Link to="/AgregarC" className="btn-primary is-neutral" style={{ textDecoration: 'none' }}>
            Añadir Nueva Carta
          </Link>
        </button>
      </div>

      <div className={styles.grid}>
        {/* Usamos coleccionVisible en lugar del array original */}
        {coleccionVisible.length === 0 ? (
          <p>No tienes cartas disponibles en tu colección todavía.</p>
        ) : (
          coleccionVisible.map((item) => (
            <div key={item.id} className={`${styles.card} ${item.es_foil ? styles.isFoil : ''}`}>
              <div className={styles.badgeContainer}>
                <span className={styles.qtyBadge}>x{item.cantidad}</span>
                {item.es_foil && <span className={styles.foilBadge}>Foil</span>}
              </div>

              <div className={styles.imageContainer}>
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
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleOpenSaleModal(item)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cargando...' : 'Al Mercado'}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleEliminarCarta(item.id, item.carta.nombre)}
                    disabled={isLoading}
                  >
                    {isLoading ? '...' : '🗑️'}
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

            <div className={styles.stockIndicator}>
              <span>Publicaciones activas:</span>
              <span className={
                publicacionesUsadas >= selectedCard.cantidad
                  ? styles.stockAgotado
                  : styles.stockDisponible
              }>
                {publicacionesUsadas} / {selectedCard.cantidad}
              </span>
            </div>

            {publicacionesUsadas >= selectedCard.cantidad && (
              <p className={styles.stockWarning}>
                Ya tienes todas tus copias publicadas en el mercado.
              </p>
            )}
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
                <button
                  type="submit"
                  className={styles.confirmBtn}
                  disabled={isLoading || publicacionesUsadas >= (selectedCard?.cantidad ?? 0)}
                >
                  {isLoading ? 'Publicando...' : 'Publicar ahora'}
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