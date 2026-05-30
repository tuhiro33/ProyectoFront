import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/AgregarCarta.module.css';
import { useAuth } from "../../context/AuthContext"
import { agregarCartaAColeccion } from '../../services/cardService';
import type { CardPayload } from '../../services/cardService';

interface ResultadoBusqueda {
  api_id: string;
  nombre: string;
  imageUrl: string;
  set_name: string;
  juego: 'magic' | 'pokemon';
}

const AgregarCartaPage = () => {
  const { user } = useAuth();
  const [juegoActivo, setJuegoActivo] = useState<'magic' | 'pokemon'>('magic');
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [cartaSeleccionada, setCartaSeleccionada] = useState<ResultadoBusqueda | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [esFoil, setEsFoil] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 3) {
      setResultados([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (juegoActivo === 'magic') {
          const res = await fetch(`https://api.scryfall.com/cards/search?q=${searchTerm}`);
          if (!res.ok) throw new Error('No se encontraron cartas');
          const data = await res.json();
          const mapeadoMagic = data.data.slice(0, 12).map((c: any) => ({
            api_id: c.id,
            nombre: c.name,
            imageUrl: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || '',
            set_name: c.set_name,
            juego: 'magic'
          }));
          setResultados(mapeadoMagic);
        } else {
          const res = await fetch(`https://api.tcgdex.net/v2/es/cards?name=${searchTerm}`);
          if (!res.ok) throw new Error('Error buscando en TCGDex');
          const data = await res.json();
          const mapeadoPokemon = data.slice(0, 12).map((c: any) => ({
            api_id: c.id,
            nombre: c.name,
            imageUrl: c.image ? `${c.image}/high.webp` : '',
            set_name: `Set: ${c.id.split('-')[0].toUpperCase()}`,
            juego: 'pokemon'
          }));
          setResultados(mapeadoPokemon);
        }
      } catch (error) {
        console.error("Error en la búsqueda:", error);
        setResultados([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, juegoActivo]);

  const handleSeleccionarCarta = (carta: ResultadoBusqueda) => {
    setCartaSeleccionada(carta);
    setCantidad(1);
    setEsFoil(false);
  };

  const handleRegresar = () => {
    // Aquí puedes poner tu lógica de navegación, ej: navigate('/coleccion')
    window.history.back();
  };

  const handleConfirmarAgregar = async () => {
    if (!cartaSeleccionada || !user?.id) return;

    const dataParaBackend: CardPayload = {
      usuario_id: Number(user.id),
      cantidad,
      es_foil: esFoil,
      carta: {
        api_id: cartaSeleccionada.api_id,
        juego: cartaSeleccionada.juego,
        nombre: cartaSeleccionada.nombre,
        url_imagen: cartaSeleccionada.imageUrl,
      }
    };

    try {
      await agregarCartaAColeccion(dataParaBackend);
      alert(`¡"${cartaSeleccionada.nombre}" agregada!`);
      setCartaSeleccionada(null);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al agregar la carta");
    }
  };

  return (
    <div className={styles.agregarContainer}>
      
      {/* Botón de regresar en la esquina superior izquierda */}
      <button className={styles.backBtn} onClick={handleRegresar}>
        ← Volver a la Colección
      </button>

      {/* Se corrigió la asignación de la clase del fondo dinámico haciendo match con el CSS module */}
      <div className={`${styles.searchHeader} ${juegoActivo === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
        <h1>Buscar Cartas</h1>
        <div className={styles.gameToggle}>
          <button
            className={`${styles.toggleBtn} ${juegoActivo === 'magic' ? styles.activeMagic : ''}`}
            onClick={() => { setJuegoActivo('magic'); setSearchTerm(''); }}
          >
            Magic
          </button>
          <button
            className={`${styles.toggleBtn} ${juegoActivo === 'pokemon' ? styles.activePokemon : ''}`}
            onClick={() => { setJuegoActivo('pokemon'); setSearchTerm(''); }}
          >
            Pokémon
          </button>
        </div>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            placeholder={`Busca una carta de ${juegoActivo === 'magic' ? 'Magic' : 'Pokémon'}...`}
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && <span className={styles.loadingText}>Buscando...</span>}
        </div>
      </div>

      {searchTerm.length >= 3 && !isSearching && resultados.length === 0 && (
        <div className={styles.emptyState}>
          No se encontraron cartas con el nombre "{searchTerm}".
        </div>
      )}

      <div className={styles.resultsGrid}>
        {resultados.map((carta) => (
          <div key={carta.api_id} className={styles.resultCard}>
            <div className={styles.cardImageWrapper}>
              <img src={carta.imageUrl} alt={carta.nombre} className={styles.cardImage} />
            </div>
            <h3 className={styles.cardTitle}>{carta.nombre}</h3>
            <span className={styles.cardSet}>{carta.set_name}</span>
            <button
              className={styles.addBtn}
              onClick={() => handleSeleccionarCarta(carta)}
            >
              + Agregar a Colección
            </button>
          </div>
        ))}
      </div>

      {/* Modal de cantidad y foil */}
      {cartaSeleccionada && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Agregar a Colección</h2>
            <strong>{cartaSeleccionada.nombre}</strong>

            <div className={styles.formGroup}>
              <label>Cantidad</label>
              <input
                type="number"
                min={1}
                max={99}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={esFoil}
                  onChange={(e) => setEsFoil(e.target.checked)}
                />
                {' '}¿Es Foil?
              </label>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setCartaSeleccionada(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirmarAgregar}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgregarCartaPage;