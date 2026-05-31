// Página de colección: muestra las cartas físicas del usuario y permite
// publicarlas en el mercado o eliminarlas de la colección.
//
// Es la página más compleja del frontend — combina:
//   - Carga de datos del backend (useEffect + obtenerColeccion)
//   - Modal de publicación con subida de imagen (FormData + apiClient)
//   - Protección contra doble clic (useAsync)
//   - Validación de stock antes de publicar (contarPublicacionesActivas)
import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Coleccion.module.css';
import { Link } from 'react-router-dom';
import { obtenerColeccion, eliminarCartaDeColeccion } from '../../services/cardService';
import type { ColeccionItem } from '../../services/cardService';
import { useAuth } from "../../context/AuthContext";
import type { CrearPublicacionPayload } from '../../services/ventasService';
import { crearPublicacion, contarPublicacionesActivas } from '../../services/ventasService';
import { useAsync } from '../../services/useAsync';
import apiClient from '../../api/apiClient';

const ColeccionPage = () => {
  // coleccion almacena el array de cartas del usuario cargado desde el backend.
  // ColeccionItem[] es el tipo definido en cardService.ts — array vacío por defecto.
  const [coleccion, setColeccion] = useState<ColeccionItem[]>([]);

  // selectedCard guarda la carta sobre la que se abrió el modal de venta.
  // null significa que ningún modal está activo.
  const [selectedCard, setSelectedCard] = useState<ColeccionItem | null>(null);

  // publicacionesUsadas cuenta cuántas publicaciones activas ya existen
  // para la carta seleccionada — se usa para el indicador de stock en el modal.
  const [publicacionesUsadas, setPublicacionesUsadas] = useState(0);

  // loading controla el estado inicial de carga — muestra un mensaje
  // mientras se espera la respuesta del backend al montar la página.
  const [loading, setLoading] = useState(true);

  // showModal controla si el modal de publicación está visible o no.
  const [showModal, setShowModal] = useState(false);

  // user contiene los datos del usuario logueado — se necesita user.id
  // para llamar a obtenerColeccion(user.id).
  const { user } = useAuth();

  // isLoading y run vienen de useAsync — protegen contra doble clic
  // en los botones "Al Mercado" y "🗑️" mientras hay una operación en curso.
  const { isLoading, run } = useAsync();

  // saleForm agrupa los campos del formulario del modal de venta.
  // precio como string porque los inputs HTML siempre devuelven strings —
  // se convierte a Number al armar el payload para el backend.
  const [saleForm, setSaleForm] = useState({
    precio: '',
    estado: 'NM',           // Near Mint es el estado por defecto
    imagen: null as File | null  // File es el tipo del navegador para archivos subidos
  });

  // useEffect carga la colección del usuario al montar el componente.
  // [user] como dependencia significa: re-ejecutar si el objeto user cambia
  // (por ejemplo, si el usuario hace login después de que el componente montó).
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Guardia de seguridad: si no hay usuario logueado, no intentar cargar.
        // Puede ocurrir si AuthContext aún no terminó de verificar el token.
        if (!user || !user.id) {
          console.warn("No se encontró usuario iniciado.");
          setLoading(false);
          return;
        }

        // obtenerColeccion llama a GET /coleccion/:usuarioId en el backend.
        // Number() convierte user.id de string a number porque el backend
        // espera un número en la URL.
        const data = await obtenerColeccion(Number(user.id));
        setColeccion(data);
      } catch (error) {
        console.error("Error al cargar colección:", error);
        // ⚠️  El error se loguea pero no se muestra al usuario —
        // la página simplemente quedará vacía sin indicar qué falló.
        // Considerar agregar un estado de error para mostrar un mensaje.
      } finally {
        // finally garantiza que loading se desactiva tanto si la carga
        // fue exitosa como si falló — evita el spinner infinito.
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user]);

  // handleOpenSaleModal abre el modal para una carta específica y
  // consulta cuántas publicaciones activas ya tiene esa entrada de colección.
  const handleOpenSaleModal = async (item: ColeccionItem) => {
    setSelectedCard(item);
    setShowModal(true);
    try {
      // contarPublicacionesActivas llama a GET /mis-publicaciones y filtra
      // por coleccion_id en el cliente — ver nota de eficiencia en ventasService.ts.
      const usadas = await contarPublicacionesActivas(item.id);
      setPublicacionesUsadas(usadas);
    } catch {
      // Si falla la consulta de conteo, se asume 0 para no bloquear al usuario.
      setPublicacionesUsadas(0);
    }
  };

  // handleCloseModal limpia todos los estados del modal al cerrarlo.
  // Importante resetear saleForm para que la próxima apertura empiece limpia.
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setSaleForm({ precio: '', estado: 'NM', imagen: null });
  };

  // handleVenderSubmit maneja el envío del formulario de publicación.
  // Se envuelve en run() de useAsync para deshabilitar el botón mientras procesa.
  const handleVenderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (!selectedCard) return;

      // Por defecto usa la imagen oficial de la carta del caché.
      // Si el usuario subió una foto propia, se reemplaza con la URL subida.
      let fotoURL = selectedCard.carta.url_imagen;

      if (saleForm.imagen) {
        // FormData es la forma de enviar archivos binarios por HTTP.
        // A diferencia de JSON, FormData puede contener texto y archivos mezclados.
        // apiClient.post necesita el header multipart/form-data para que
        // el backend (Go) sepa que viene un archivo y no JSON.
        // "image" debe coincidir exactamente con el nombre que busca el backend
        // en el handler UploadImage con c.FormFile("image").
        const uploadData = new FormData();
        uploadData.append("image", saleForm.imagen);

        const uploadRes = await apiClient.post("/upload", uploadData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // El backend responde con { url: "https://..." } tras guardar la imagen.
        fotoURL = uploadRes.data.url;
      }

      // Armar el payload que espera CrearPublicacion en el backend.
      // Number(saleForm.precio) convierte el string del input a número.
      const payload: CrearPublicacionPayload = {
        coleccion_id: selectedCard.id,
        precio: Number(saleForm.precio),
        estado_carta: saleForm.estado,
        foto_url: fotoURL,
      };

      await crearPublicacion(payload);
      alert(`¡"${selectedCard.carta.nombre}" publicada en el mercado!`);
      handleCloseModal();

      // ⚠️  La colección no se recarga después de publicar.
      // La cantidad disponible cambió en el backend pero el frontend
      // sigue mostrando la cantidad anterior hasta que el usuario recargue.
      // Considerar llamar a cargarDatos() o actualizar el estado local.
    });
  };

  // handleEliminarCarta pide confirmación antes de eliminar.
  // window.confirm() muestra un diálogo nativo del navegador — funcional
  // pero visualmente inconsistente con el diseño de la app.
  // ExtretNombre (nombre poco convencional) es el nombre de la carta
  // para mostrar en el mensaje de confirmación.
  const handleEliminarCarta = (id: number, ExtretNombre: string) => {
    run(async () => {
      if (!window.confirm(`¿Eliminar ${ExtretNombre} de tu colección?`)) return;
      await eliminarCartaDeColeccion(id);
      // Actualización optimista: elimina la carta del estado local inmediatamente
      // sin esperar una nueva carga del backend.
      // .filter() devuelve un nuevo array con todos los items EXCEPTO el eliminado.
      setColeccion(prev => prev.filter(i => i.id !== id));
    });
  };

  // Renderizado condicional: muestra spinner mientras carga la colección.
  if (loading) return <div className={styles.loadingFull}>Cargando tu colección...</div>;

  // Filtra las cartas con cantidad 0 — pueden existir en la BD pero
  // no tienen copias disponibles, por lo que no se muestran en la UI.
  const coleccionVisible = coleccion.filter(item => item.cantidad > 0);

  return (
    <div className={styles.coleccionContainer}>
      <div className={styles.header}>
        <div>
          <h1>Mi Colección</h1>
          <p>Gestiona las cartas que posees en físico.</p>
        </div>
        {/* Link a la página de agregar cartas — fuera del grid para que
            siempre sea visible independientemente de cuántas cartas haya */}
        <Link to="/AgregarC" className={styles.addCardBtn}>
          Añadir Nueva Carta
        </Link>
      </div>

      <div className={styles.grid}>
        {coleccionVisible.length === 0 ? (
          <p>No tienes cartas disponibles en tu colección todavía.</p>
        ) : (
          coleccionVisible.map((item) => (
            // key={item.id} es requerido por React cuando se renderiza una lista.
            // Permite a React identificar qué elemento cambió, se agregó o eliminó
            // sin re-renderizar toda la lista.
            // La clase isFoil agrega estilos especiales (brillo/animación) a cartas foil.
            <div key={item.id} className={`${styles.card} ${item.es_foil ? styles.isFoil : ''}`}>

              <div className={styles.badgeContainer}>
                {/* x{item.cantidad} muestra cuántas copias tiene el usuario */}
                <span className={styles.qtyBadge}>x{item.cantidad}</span>
                {/* El badge Foil solo se renderiza si es_foil es true */}
                {item.es_foil && <span className={styles.foilBadge}>Foil</span>}
              </div>

              <div className={styles.imageContainer}>
                <img
                  src={item.carta.url_imagen}
                  alt={item.carta.nombre}
                  className={styles.cardImage}
                  // onError maneja imágenes rotas — si la URL falla,
                  // reemplaza el src con una imagen de fallback.
                  // (e.target as HTMLImageElement) es un cast de TypeScript
                  // necesario porque e.target es de tipo genérico EventTarget.
                  // ⚠️  'fallback-image-url.png' no existe — debería ser
                  // una URL válida o una imagen importada del proyecto.
                  onError={(e) => { (e.target as HTMLImageElement).src = 'fallback-image-url.png' }}
                />
              </div>

              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle}>{item.carta.nombre}</h3>
                <span className={styles.gameLabel}>
                  {/* Convierte el valor interno ('magic'/'pokemon') a texto legible */}
                  {item.carta.juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                </span>

                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleOpenSaleModal(item)}
                    disabled={isLoading} // Deshabilita mientras hay operación en curso
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

      {/* Modal de publicación — solo se renderiza cuando showModal es true
          y hay una carta seleccionada. El operador && evita renderizar
          el modal con datos vacíos. */}
      {showModal && selectedCard && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Publicar para Venta</h2>
            <strong className={styles.cardNameHighlight}>{selectedCard.carta.nombre}</strong>

            {/* Indicador de stock: muestra publicaciones activas vs copias disponibles.
                El color cambia según si el stock está agotado o disponible. */}
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

            {/* Aviso de stock agotado — solo visible si todas las copias están publicadas */}
            {publicacionesUsadas >= selectedCard.cantidad && (
              <p className={styles.stockWarning}>
                Ya tienes todas tus copias publicadas en el mercado.
              </p>
            )}

            <form className={styles.saleForm} onSubmit={handleVenderSubmit}>
              <div className={styles.formGroup}>
                <label>Estado de la Carta</label>
                {/* Nomenclatura estándar del mercado TCG para estado físico de cartas:
                    NM=Near Mint, LP=Lightly Played, MP=Moderately Played,
                    HP=Heavily Played, DMG=Damaged */}
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
                {/* step="0.01" permite decimales en el input numérico (ej: 15.99).
                    Sin step, solo acepta enteros. */}
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
                {/* accept="image/*" limita el selector de archivos a imágenes.
                    e.target.files es un FileList — se toma solo el primer archivo [0]. */}
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
                {/* Botón deshabilitado si hay operación en curso O si el stock está agotado.
                    ?? 0 es el operador nullish coalescing — usa 0 si selectedCard es null,
                    aunque el && selectedCard arriba garantiza que nunca será null aquí. */}
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