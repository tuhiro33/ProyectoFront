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

  // Efecto para consumir las APIs de Magic y Pokémon al cargar la página
  useEffect(() => {
    const fetchImagesFromApis = async () => {
      const coleccionConImagenes = await Promise.all(
        mockMiColeccion.map(async (item) => {
          let imageUrl = '';

          try {
            if (item.carta.juego === 'pokemon') {
              // Fetch a Pokémon TCG API
              const res = await fetch(`https://api.pokemontcg.io/v2/cards/${item.carta.api_id}`);
              const data = await res.json();
              imageUrl = data.data.images.large; 
            } 
            else if (item.carta.juego === 'magic') {
              // Fetch a Scryfall API
              const res = await fetch(`https://api.scryfall.com/cards/${item.carta.api_id}`);
              const data = await res.json();
              imageUrl = data.image_uris?.normal || ''; 
            }
          } catch (error) {
            console.error("Error cargando imagen para:", item.carta.nombre);
          }

          return { ...item, imageUrl };
        })
      );

      setColeccion(coleccionConImagenes);
    };

    fetchImagesFromApis();
  }, []);

  // Función para eliminar una carta de la colección
  const handleEliminarCarta = (idCarta: number, nombreCarta: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de que quieres eliminar "${nombreCarta}" de tu bóveda?`);
    
    if (confirmacion) {
      // Filtramos la colección para quitar la carta que el usuario eliminó
      setColeccion((prevColeccion) => prevColeccion.filter((item) => item.id !== idCarta));
      
      // En el futuro, aquí irá la petición a Go: 
      // fetch(`http://localhost:8080/api/coleccion/${idCarta}`, { method: 'DELETE' })
    }
  };

  return (
    <div className={styles.coleccionContainer}>
      
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <div>
          <h1>Mi Colección</h1>
          <p>Gestiona las cartas que posees en físico.</p>
        </div>
        <button className="btn-primary is-neutral"><Link to="/AgregarC">Añadir Nueva Carta</Link></button>
      </div>

      {/* ================= GRID DE CARTAS ================= */}
      <div className={styles.grid}>
        {coleccion.map((item) => (
          <div key={item.id} className={`${styles.card} ${item.es_foil ? styles.isFoil : ''}`}>
            
            {/* Badges de Cantidad y Foil */}
            <div className={styles.badgeContainer}>
              <span className={styles.qtyBadge}>x{item.cantidad}</span>
              {item.es_foil && <span className={styles.foilBadge}>Foil</span>}
            </div>

            {/* Imagen consumida de la API */}
            <div className={styles.imageContainer}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.carta.nombre} className={styles.cardImage} />
              ) : (
                <span className={styles.loadingText}>Cargando API...</span>
              )}
            </div>

            {/* Información y Botones de Acción */}
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>{item.carta.nombre}</h3>
              <span className={styles.gameLabel}>
                {item.carta.juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
              </span>
              
              <div className={styles.cardActions}>
                <button className={styles.actionBtn}>Al Mercado</button>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleEliminarCarta(item.id, item.carta.nombre)}
                  title="Eliminar carta"
                >
                  🗑️
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ColeccionPage;