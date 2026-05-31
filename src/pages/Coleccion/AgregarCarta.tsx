// Página para agregar cartas a la colección personal.
// Busca cartas en APIs externas (Scryfall para Magic, TCGDex para Pokémon)
// y las guarda en el backend (que las almacena en CartaCache + ColeccionUsuario).
//
// Flujo completo:
//   1. Usuario escribe en el buscador
//   2. Debounce espera 500ms antes de llamar a la API externa
//   3. Resultados se muestran en un grid de cartas
//   4. Usuario selecciona una carta → modal de cantidad/foil
//   5. Al confirmar → agregarCartaAColeccion() envía al backend propio
import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/AgregarCarta.module.css';
import { useAuth } from "../../context/AuthContext";
import { agregarCartaAColeccion } from '../../services/cardService';
import type { CardPayload } from '../../services/cardService';

// ResultadoBusqueda define la forma normalizada de una carta
// independientemente de si vino de Scryfall (Magic) o TCGDex (Pokémon).
// Ambas APIs devuelven estructuras distintas — el mapeo dentro del
// useEffect las convierte a este formato común.
interface ResultadoBusqueda {
  api_id: string;
  nombre: string;
  imageUrl: string;
  set_name: string;               // Nombre del set/expansión de la carta
  juego: 'magic' | 'pokemon';
}

const AgregarCartaPage = () => {
  const { user } = useAuth();

  // juegoActivo determina qué API externa se consulta y el tema visual del header.
  const [juegoActivo, setJuegoActivo] = useState<'magic' | 'pokemon'>('magic');

  // searchTerm es el texto del input de búsqueda.
  // Cada cambio dispara el useEffect que implementa el debounce.
  const [searchTerm, setSearchTerm] = useState('');

  // resultados almacena las cartas encontradas en la API externa,
  // normalizadas al formato ResultadoBusqueda.
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);

  // isSearching muestra el indicador "Buscando..." mientras espera la API externa.
  const [isSearching, setIsSearching] = useState(false);

  // cartaSeleccionada es la carta sobre la que se abrió el modal de confirmación.
  const [cartaSeleccionada, setCartaSeleccionada] = useState<ResultadoBusqueda | null>(null);

  // cantidad y esFoil son los datos adicionales que el usuario configura
  // en el modal antes de confirmar agregar la carta.
  const [cantidad, setCantidad] = useState(1);
  const [esFoil, setEsFoil] = useState(false);

  // useEffect implementa el patrón debounce para la búsqueda:
  // evita llamar a la API externa en cada tecla que el usuario presiona.
  // En cambio, espera 500ms después de que el usuario deja de escribir.
  //
  // Dependencias [searchTerm, juegoActivo]: el efecto se re-ejecuta cuando
  // cambia el texto de búsqueda o cuando el usuario cambia de juego.
  useEffect(() => {
    // No buscar si el término tiene menos de 3 caracteres —
    // evita búsquedas demasiado amplias que devuelven miles de resultados.
    if (searchTerm.trim().length < 3) {
      setResultados([]);
      setIsSearching(false);
      return;
    }

    // setTimeout programa la búsqueda 500ms en el futuro.
    // Si el usuario escribe otra letra antes de esos 500ms,
    // el return () => clearTimeout(delayDebounceFn) cancela el timeout anterior
    // y se programa uno nuevo — así solo se busca cuando el usuario "para" de escribir.
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (juegoActivo === 'magic') {
          // Scryfall es la API oficial de Magic: The Gathering.
          // /cards/search?q= acepta el nombre de la carta como texto libre.
          // ⚠️  Llama directamente a la API externa desde el navegador (fetch nativo).
          // Scryfall permite CORS desde el navegador, por eso funciona sin proxy.
          const res = await fetch(`https://api.scryfall.com/cards/search?q=${searchTerm}`);
          if (!res.ok) throw new Error('No se encontraron cartas');
          const data = await res.json();

          // data.data es el array de cartas. slice(0, 12) limita a 12 resultados
          // para no sobrecargar el grid visual.
          // c.image_uris?.normal es la URL de imagen para cartas normales.
          // c.card_faces?.[0]?.image_uris?.normal es para cartas de doble cara
          // (transforming cards) donde la imagen está en el primer face, no en la raíz.
          // El ?. (optional chaining) evita error si el campo no existe.
          const mapeadoMagic = data.data.slice(0, 12).map((c: any) => ({
            api_id: c.id,
            nombre: c.name,
            imageUrl: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || '',
            set_name: c.set_name,
            juego: 'magic'
          }));
          setResultados(mapeadoMagic);

        } else {
          // TCGDex es una API no oficial de Pokémon TCG en español (/es/).
          // ⚠️  Devuelve un array directamente (no envuelto en { data: [] })
          // a diferencia de Scryfall — por eso se usa data.slice() en lugar de data.data.slice().
          const res = await fetch(`https://api.tcgdex.net/v2/es/cards?name=${searchTerm}`);
          if (!res.ok) throw new Error('Error buscando en TCGDex');
          const data = await res.json();

          // c.image + '/high.webp' construye la URL de imagen de alta calidad.
          // TCGDex devuelve la base de la URL sin extensión — se agrega el sufijo.
          // c.id tiene formato "set-numero" (ej: "base1-58") — split('-')[0]
          // extrae solo el código del set para mostrarlo como nombre.
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
        // ⚠️  El error se loguea pero no se muestra al usuario —
        // la página queda vacía sin indicar si fue "no encontrado" o "error de red".
        // Considerar un estado de error separado para distinguir ambos casos.
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms de espera antes de buscar

    // Función de limpieza del useEffect: se ejecuta antes de cada re-render
    // del efecto y al desmontar el componente.
    // clearTimeout cancela el timeout pendiente si searchTerm cambia
    // antes de que pasen los 500ms — implementa el debounce.
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, juegoActivo]);

  // Al seleccionar una carta del grid, se abre el modal reseteando
  // cantidad y foil a sus valores por defecto.
  const handleSeleccionarCarta = (carta: ResultadoBusqueda) => {
    setCartaSeleccionada(carta);
    setCantidad(1);
    setEsFoil(false);
  };

  // window.history.back() es equivalente al botón "atrás" del navegador —
  // vuelve a la página anterior sin necesitar useNavigate ni una ruta fija.
  // Funciona correctamente porque siempre se llega aquí desde /coleccion.
  const handleRegresar = () => {
    window.history.back();
  };

  // handleConfirmarAgregar arma el payload y llama al backend propio.
  // El backend hace upsert en CartaCache y crea la entrada en ColeccionUsuario.
  const handleConfirmarAgregar = async () => {
    // Guardia doble: verificar carta seleccionada y usuario logueado.
    if (!cartaSeleccionada || !user?.id) return;

    // Construye el CardPayload que espera AgregarCartaRequest del backend.
    // Incluye tanto los datos de la entrada (cantidad, foil) como los
    // datos de la carta (para el upsert en CartaCache).
    const dataParaBackend: CardPayload = {
      usuario_id: Number(user.id), // ⚠️  Ver nota de seguridad en cardService.ts
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
      // Cierra el modal y limpia la selección tras agregar exitosamente.
      // ⚠️  No usa useAsync — si el usuario hace clic varias veces en
      // "Confirmar" antes de que responda el backend, puede agregar duplicados.
      // Considerar deshabilitar el botón o usar useAsync como en Coleccion.tsx.
      setCartaSeleccionada(null);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al agregar la carta");
    }
  };

  return (
    <div className={styles.agregarContainer}>

      <button className={styles.backBtn} onClick={handleRegresar}>
        ← Volver a la Colección
      </button>

      {/* Header con buscador — cambia de fondo según el juego activo */}
      <div className={`${styles.searchHeader} ${juegoActivo === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
        <h1>Buscar Cartas</h1>

        {/* Toggle Magic/Pokémon — al cambiar de juego limpia el buscador
            para evitar buscar el mismo término en la API del otro juego */}
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
          {/* isSearching se muestra durante los 500ms de debounce
              y mientras la API externa responde */}
          {isSearching && <span className={styles.loadingText}>Buscando...</span>}
        </div>
      </div>

      {/* Estado vacío: solo visible cuando hay término de búsqueda suficiente,
          no está buscando, y no hay resultados — distingue "aún no buscado"
          de "buscado pero sin resultados" */}
      {searchTerm.length >= 3 && !isSearching && resultados.length === 0 && (
        <div className={styles.emptyState}>
          No se encontraron cartas con el nombre "{searchTerm}".
        </div>
      )}

      {/* Grid de resultados — key={carta.api_id} usa el ID de la API externa
          en lugar de un índice numérico, más estable si el array cambia */}
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

      {/* Modal de confirmación — solo visible cuando hay carta seleccionada */}
      {cartaSeleccionada && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Agregar a Colección</h2>
            <strong>{cartaSeleccionada.nombre}</strong>

            <div className={styles.formGroup}>
              <label>Cantidad</label>
              {/* min=1 max=99 limita el rango en la UI — el backend
                  no valida rango, solo que cantidad sea required */}
              <input
                type="number"
                min={1}
                max={99}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>

            <div className={styles.formGroup}>
              {/* Checkbox de foil — e.target.checked devuelve boolean directamente
                  a diferencia de e.target.value que siempre devuelve string */}
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