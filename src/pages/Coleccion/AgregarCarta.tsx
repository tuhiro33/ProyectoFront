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
          // Búsqueda en Scryfall (Se queda igual)
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
        } 
        else {
          // NUEVO: Búsqueda ultra rápida en TCGDex (En español)
          const res = await fetch(`https://api.tcgdex.net/v2/es/cards?name=${searchTerm}`);
          if (!res.ok) throw new Error('Error buscando en TCGDex');
          
          const data = await res.json();
          
          // TCGDex devuelve el arreglo directamente. 
          // Construimos la URL de la imagen en alta calidad agregando /high.webp
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

  // Función simulada para agregar a la base de datos
  const handleAgregarCarta = (carta: ResultadoBusqueda) => {
    alert(`Has agregado "${carta.nombre}" a tu bóveda.\n(Aquí conectaremos con tu backend en Go)`);
  };

  return (
    <div className={styles.agregarContainer}>
      
      {/* Cabecera con fondo dinámico según el juego seleccionado */}
      <div className={`${styles.searchHeader} ${juegoActivo === 'magic' ? 'is-magic' : 'is-pokemon'}`}>
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