import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/AgregarCarta.module.css';

// 1. Interfaz unificada para nuestra interfaz gráfica
interface ResultadoBusqueda {
  api_id: string;
  nombre: string;
  imageUrl: string;
  set_name: string;
  juego: 'magic' | 'pokemon';
}

const AgregarCartaPage = () => {
  const [juegoActivo, setJuegoActivo] = useState<'magic' | 'pokemon'>('magic');
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 2. El Efecto de Búsqueda con "Debouncing"
  useEffect(() => {
    // Si el usuario borra el texto o escribe menos de 3 letras, limpiamos la pantalla
    if (searchTerm.trim().length < 3) {
      setResultados([]);
      setIsSearching(false);
      return;
    }

    // Iniciamos un temporizador. Si el usuario sigue escribiendo, este temporizador se reinicia.
    // Solo hace la petición cuando el usuario hace una pausa de 500ms.
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        if (juegoActivo === 'magic') {
          // Búsqueda en Scryfall (Soporta nombres parciales)
          const res = await fetch(`https://api.scryfall.com/cards/search?q=${searchTerm}`);
          if (!res.ok) throw new Error('No se encontraron cartas');
          const data = await res.json();
          
          // Mapeamos los datos de Scryfall a nuestra interfaz
          const mapeadoMagic = data.data.slice(0, 12).map((c: any) => ({
            api_id: c.id,
            nombre: c.name,
            imageUrl: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || '',
            set_name: c.set_name,
            juego: 'magic'
          }));
          setResultados(mapeadoMagic);
        } 
        else {
          // Búsqueda en Pokémon TCG (Usamos comodines * para búsqueda parcial)
          const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:*${searchTerm}*&pageSize=12`);
          const data = await res.json();
          
          // Mapeamos los datos de Pokémon a nuestra interfaz
          const mapeadoPokemon = data.data.map((c: any) => ({
            api_id: c.id,
            nombre: c.name,
            imageUrl: c.images?.large || c.images?.small || '',
            set_name: c.set.name,
            juego: 'pokemon'
          }));
          setResultados(mapeadoPokemon);
        }
      } catch (error) {
        console.error("Error en la búsqueda:", error);
        setResultados([]); // Si no hay resultados o hay error, vaciamos la lista
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500 milisegundos de espera

    // Cleanup: Limpia el temporizador si el componente se desmonta o el usuario teclea algo nuevo
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, juegoActivo]); // El efecto se dispara cuando cambia el texto o el juego

  // Función simulada para agregar a la base de datos
  const handleAgregarCarta = (carta: ResultadoBusqueda) => {
    alert(`Has agregado "${carta.nombre}" a tu bóveda.\n(Aquí conectaremos con tu backend en Go)`);
  };

  return (
    <div className={styles.agregarContainer}>
      
      {/* Cabecera con fondo dinámico según el juego seleccionado */}
      <div className={`${styles.searchHeader} ${juegoActivo === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
        <h1>Buscar Cartas</h1>
        
        {/* Toggle para cambiar de API */}
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

        {/* Input de Búsqueda */}
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

      {/* Resultados de Búsqueda */}
      {searchTerm.length >= 3 && !isSearching && resultados.length === 0 && (
        <div className={styles.emptyState}>
          No se encontraron cartas con el nombre "{searchTerm}".
        </div>
      )}

      <div className={styles.resultsGrid}>
        {resultados.map((carta) => (
          <div key={carta.api_id} className={styles.resultCard}>
            
            <div className={styles.cardImageWrapper}>
              {carta.imageUrl ? (
                <img src={carta.imageUrl} alt={carta.nombre} className={styles.cardImage} />
              ) : (
                <span style={{color: 'gray'}}>Sin Imagen</span>
              )}
            </div>

            <h3 className={styles.cardTitle}>{carta.nombre}</h3>
            <span className={styles.cardSet}>{carta.set_name}</span>
            
            <button 
              className={styles.addBtn}
              onClick={() => handleAgregarCarta(carta)}
            >
              + Agregar a Colección
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AgregarCartaPage;