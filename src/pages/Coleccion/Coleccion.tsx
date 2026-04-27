import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Coleccion.module.css';
import { Link, useLocation } from 'react-router-dom';
// =========================================
// 1. INTERFACES (Espejo de tu Base de Datos)
// =========================================
interface CartaCache {
  api_id: string; 
  juego: 'magic' | 'pokemon';
  nombre: string;
}

interface ColeccionItem {
  id: number;
  usuario_id: number;
  cantidad: number;
  es_foil: boolean;
  carta: CartaCache; 
}

// =========================================
// 2. DATOS DE PRUEBA (Mock Data)
// =========================================
const mockMiColeccion: ColeccionItem[] = [
  {
    id: 1, usuario_id: 1, cantidad: 3, es_foil: true,
    carta: { api_id: "xy1-1", juego: "pokemon", nombre: "Venusaur EX" }
  },
  {
    id: 2, usuario_id: 1, cantidad: 1, es_foil: false,
    carta: { api_id: "0000579f-7b35-4ed3-b44c-db2a538066fe", juego: "magic", nombre: "Black Lotus" } 
  },
  {
    id: 3, usuario_id: 1, cantidad: 4, es_foil: false,
    carta: { api_id: "base1-4", juego: "pokemon", nombre: "Charizard" }
  },
  {
    id: 4, usuario_id: 1, cantidad: 1, es_foil: true,
    carta: { api_id: "c32024e6-2811-462f-9159-426d9876f254", juego: "magic", nombre: "Lightning Bolt" }
  }
];

// =========================================
// 3. COMPONENTE PRINCIPAL
// =========================================
const ColeccionPage = () => {
  // Estado de la colección que incluye la URL de la imagen de la API
  const [coleccion, setColeccion] = useState<(ColeccionItem & { imageUrl?: string })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [saleForm, setSaleForm] = useState({
    precio: '',
    estado: 'NM',
    imagen: null as File | null
  });
  useEffect(() => {
    const fetchImagesFromApis = async () => {
      const coleccionConImagenes = await Promise.all(
        mockMiColeccion.map(async (item) => {
          let imageUrl = '';
          try {
            if (item.carta.juego === 'pokemon') {
              const res = await fetch(`https://api.tcgdex.net/v2/es/cards/${item.carta.api_id}`);
              const data = await res.json();
              imageUrl = data.image ? `${data.image}/high.webp` : ''; 
            } else {
              const res = await fetch(`https://api.scryfall.com/cards/${item.carta.api_id}`);
              const data = await res.json();
              imageUrl = data.image_uris?.normal || ''; 
            }
          } catch (error) { console.error(error); }
          return { ...item, imageUrl };
        })
      );
      setColeccion(coleccionConImagenes);
    };
    fetchImagesFromApis();
  }, []);

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
    console.log("Subiendo a venta:", {
      id_coleccion: selectedCard.id,
      nombre: selectedCard.carta.nombre,
      ...saleForm
    });
    alert(`La carta ${selectedCard.carta.nombre} se ha subido al mercado.`);
    handleCloseModal();
  };

  const handleEliminarCarta = (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar ${nombre}?`)) {
      setColeccion(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className={styles.coleccionContainer}>
      <div className={styles.header}>
        <div>
          <h1>Mi Colección</h1>
          <p>Gestiona las cartas que posees en físico.</p>
        </div>
        <button className="btn-primary is-neutral">
          <Link to="/AgregarC" style={{color: 'inherit', textDecoration: 'none'}}>Añadir Nueva Carta</Link>
        </button>
      </div>

      <div className={styles.grid}>
        {coleccion.map((item) => (
          <div key={item.id} className={`${styles.card} ${item.es_foil ? styles.isFoil : ''}`}>
            <div className={styles.badgeContainer}>
              <span className={styles.qtyBadge}>x{item.cantidad}</span>
              {item.es_foil && <span className={styles.foilBadge}>Foil</span>}
            </div>

            <div className={styles.imageContainer}>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.carta.nombre} className={styles.cardImage} /> : <span className={styles.loadingText}>Cargando...</span>}
            </div>

            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>{item.carta.nombre}</h3>
              <span className={styles.gameLabel}>{item.carta.juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}</span>
              
              <div className={styles.cardActions}>
                {/* BOTÓN QUE ABRE EL MODAL */}
                <button 
                  className={styles.actionBtn} 
                  onClick={() => handleOpenSaleModal(item)}
                >
                  Al Mercado
                </button>
                <button className={styles.deleteBtn} onClick={() => handleEliminarCarta(item.id, item.carta.nombre)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
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
                  onChange={(e) => setSaleForm({...saleForm, estado: e.target.value})}
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
                  onChange={(e) => setSaleForm({...saleForm, precio: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Foto Real de tu Carta</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={(e) => setSaleForm({...saleForm, imagen: e.target.files ? e.target.files[0] : null})}
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