// Página de perfil público: muestra la información visible de cualquier usuario
// (colección de cartas y publicaciones en venta) accesible sin autenticación.
//
// A diferencia de Perfil.tsx que opera sobre el usuario del JWT,
// esta página recibe el ID del usuario a mostrar desde la URL (:usuarioId)
// y carga datos de tres endpoints en paralelo.
//
// Accesible desde:
//   - Buscador de coleccionistas en Home.tsx
//   - Link en el Sidebar (perfil del usuario logueado)
//   - Ruta directa: /#/perfil/:usuarioId
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../../assets/styles/PerfilPublico.module.css';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

// Interfaces locales — definen la forma de los datos usados en esta página.
// Son similares a las de otros archivos pero se redefinen aquí porque
// PerfilPublico maneja una vista diferente de los mismos datos.

// UsuarioDTO representa los datos del perfil que se muestran en el header.
// Los campos opcionales (?) pueden no venir del backend y se rellenan
// con valores por defecto en el código.
interface UsuarioDTO {
  id: number;
  nombre: string;
  rol?: string;
  miembroDesde?: string;
  avatar?: string;
}

// CartaCache, ColeccionItem y PublicacionVenta son versiones locales
// de las interfaces definidas en cardService.ts y ventasService.ts.
// ⚠️  Duplicación de interfaces — si las de los servicios cambian,
// estas también deben actualizarse manualmente.
// Considerar exportar las interfaces desde los servicios y reutilizarlas aquí.
interface CartaCache {
  api_id: string;
  juego: 'magic' | 'pokemon';
  nombre: string;
  url_imagen: string;
}

interface ColeccionItem {
  id: number;
  cantidad: number;
  es_foil: boolean;
  carta: CartaCache;
}

interface PublicacionVenta {
  id: number;
  precio: number;
  estado_carta: string;
  foto_url: string;
  coleccion: {
    carta_nombre: string;
    carta_juego: 'magic' | 'pokemon';
    carta_imagen: string;
  };
}

const PerfilPublico = () => {
  // useParams extrae el parámetro dinámico :usuarioId de la URL.
  // Si la ruta es /#/perfil/42, usuarioId será el string "42".
  // El tipo genérico <{ usuarioId: string }> le dice a TypeScript
  // qué parámetros esperar — siempre strings en React Router.
  const { usuarioId } = useParams<{ usuarioId: string }>();

  // loggedInUser es el usuario de la sesión activa — se usa para
  // detectar si el perfil que se visita es el propio usuario
  // y pre-cargar sus datos desde el contexto sin llamada extra al backend.
  const { user: loggedInUser } = useAuth();

  const [usuario, setUsuario]     = useState<UsuarioDTO | null>(null);
  const [ventas, setVentas]       = useState<PublicacionVenta[]>([]);
  const [coleccion, setColeccion] = useState<ColeccionItem[]>([]);
  const [loading, setLoading]     = useState(true);

  // error almacena el mensaje de error si alguna petición falla.
  // null significa sin error — la condición en el render solo muestra
  // el mensaje cuando tiene contenido.
  const [error, setError]         = useState<string | null>(null);

  // useEffect carga los datos del perfil cuando cambia usuarioId o loggedInUser.
  // [usuarioId, loggedInUser] como dependencias re-ejecuta si el usuario
  // navega de un perfil a otro sin desmontar el componente.
  useEffect(() => {
    const cargarDatosPerfil = async () => {
      if (!usuarioId) return;

      setLoading(true);
      setError(null);

      try {
        // Optimización: si el perfil visitado es el del usuario logueado,
        // pre-carga los datos desde AuthContext inmediatamente
        // sin esperar la respuesta del backend.
        // Esto evita el parpadeo de "cargando" al visitar el propio perfil.
        if (loggedInUser && Number(loggedInUser.id) === Number(usuarioId)) {
          setUsuario({
            id:           Number(loggedInUser.id),
            nombre:       loggedInUser.nombre_usuario || "Usuario",
            rol:          loggedInUser.rol || "Coleccionista",
            miembroDesde: "2025",  // ⚠️  Hardcodeado — debería venir de fecha_registro
            avatar:       loggedInUser.foto_perfil || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwI-SIdNOEHGxNnr0zNVPf7TD4TaBAxahdSA&s"
          });
        }

        // Promise.all lanza las tres peticiones simultáneamente.
        // La página carga en el tiempo de la petición más lenta,
        // no en la suma de las tres.
        const [resColeccion, resPublicaciones, resInfoUsuario] = await Promise.all([
          apiClient.get(`/coleccion/${usuarioId}`),   // GET /coleccion/:usuarioId
          apiClient.get('/publicaciones'),             // GET /publicaciones (todas las activas)
          apiClient.get(`/usuarios/perfil/${usuarioId}`) // GET /usuarios/perfil/:usuarioId
        ]);

        // Filtrar cartas con cantidad > 0 — misma lógica que Coleccion.tsx.
        // Cartas con cantidad 0 existen en la BD pero no tienen copias disponibles.
        const coleccionData: ColeccionItem[] = Array.isArray(resColeccion.data)
          ? resColeccion.data : [];
        setColeccion(coleccionData.filter(item => item.cantidad > 0));

        // ⚠️  INEFICIENTE: descarga TODAS las publicaciones activas del marketplace
        // solo para filtrar las del usuario en el cliente.
        // Si hay muchas publicaciones, esto es innecesariamente pesado.
        // Alternativa: agregar endpoint GET /publicaciones?vendedor_id=X en el backend.
        const todasLasPublicaciones: PublicacionVenta[] = Array.isArray(resPublicaciones.data)
          ? resPublicaciones.data : [];

        // (pub as any).vendedor?.id necesita el cast a 'any' porque la interface
        // PublicacionVenta local no incluye el campo vendedor — está definida
        // sin él aunque el backend sí lo devuelve.
        // Solución: agregar vendedor a la interface local:
        //   vendedor: { id: number; nombre: string }
        const ventasUsuario = todasLasPublicaciones.filter(pub =>
          (pub as any).vendedor?.id === Number(usuarioId)
        );
        setVentas(ventasUsuario);

        // Solo actualiza con datos remotos si NO es el perfil del usuario logueado
        // (que ya fue seteado arriba con datos del contexto).
        if (!loggedInUser || Number(loggedInUser.id) !== Number(usuarioId)) {
          const datosRemotos = resInfoUsuario.data;
          setUsuario({
            id:    Number(usuarioId),
            // Intenta nombre_usuario primero (UsuarioResponse del backend),
            // luego nombre como fallback, luego un placeholder con el ID.
            nombre: datosRemotos.nombre_usuario || datosRemotos.nombre || `Usuario #${usuarioId}`,
            // datosRemotos.rol?.nombre intenta leer el nombre si rol es un objeto,
            // aunque MapUsuarioToDTO devuelve rol como string plano — el ?. protege
            // si la respuesta tiene una estructura diferente a la esperada.
            rol:          datosRemotos.rol?.nombre || datosRemotos.rol || "Coleccionista",
            miembroDesde: "2025", // ⚠️  Hardcodeado — usar datosRemotos.fecha_registro
            avatar:       datosRemotos.foto_perfil || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwI-SIdNOEHGxNnr0zNVPf7TD4TaBAxahdSA&s"
          });
        }

      } catch (err) {
        console.error("Error al cargar el perfil público:", err);
        setError("No se pudo cargar la información del perfil del usuario.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatosPerfil();
  }, [usuarioId, loggedInUser]);

  if (loading) return <div className={styles.loadingFull}>Cargando perfil del usuario...</div>;
  if (error || !usuario) return <div className={styles.loadingFull}>⚠️ {error || "Usuario no encontrado"}</div>;

  return (
    <div className={styles.container}>

      {/* Header del perfil: avatar, nombre, rol y fecha de membresía */}
      <div className={styles.profileHeader}>
        <div className={styles.banner}>
          <div className={styles.avatarWrapper}>
            <img src={usuario.avatar} alt={usuario.nombre} className={styles.avatarImage} />
          </div>
        </div>
        <div className={styles.userInfo}>
          <div>
            <h1>{usuario.nombre}</h1>
            <div className={styles.userMeta}>
              <span className={styles.metaItem}>🛡️ {usuario.rol}</span>
              <span className={styles.metaItem}>📅 Miembro desde {usuario.miembroDesde}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de publicaciones en venta del usuario */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>🛒 Artículos en Venta</h2>

        {ventas.length > 0 ? (
          <div className={styles.grid}>
            {ventas.map((pub) => (
              <div key={pub.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  {/* ?. (optional chaining) protege contra coleccion undefined
                      en caso de que el backend devuelva una publicación sin colección */}
                  <img
                    src={pub.foto_url || pub.coleccion?.carta_imagen}
                    alt={pub.coleccion?.carta_nombre}
                    className={styles.cardImage}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/fallback-image.png' }}
                  />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{pub.coleccion?.carta_nombre}</h3>
                  <div className={styles.cardMeta}>
                    {pub.coleccion?.carta_juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                    <br />
                    <span className={styles.badge}>Estado: {pub.estado_carta}</span>
                  </div>
                  <div className={styles.priceTag}>${pub.precio.toFixed(2)}</div>
                  {/* ⚠️  Botón "Comprar" sin funcionalidad — no abre modal ni
                      navega al marketplace. Conectar con handleOpenBuyModal
                      de Marketplace.tsx o navegar a /#/mercado. */}
                  <button className={styles.buyBtn}>Comprar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            Este usuario no tiene cartas a la venta actualmente.
          </div>
        )}
      </div>

      {/* Sección de colección personal del usuario */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>🎴 Colección de {usuario.nombre}</h2>

        {coleccion.length > 0 ? (
          <div className={styles.grid}>
            {coleccion.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img
                    src={item.carta?.url_imagen}
                    alt={item.carta?.nombre}
                    className={styles.cardImage}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/fallback-image.png' }}
                  />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{item.carta?.nombre}</h3>
                  <div className={styles.cardMeta}>
                    {item.carta?.juego === 'magic' ? 'Magic: The Gathering' : 'Pokémon TCG'}
                    <br />
                    <span className={styles.badge}>Cantidad: {item.cantidad}</span>
                    {/* Badge foil: solo visible si es_foil es true */}
                    {item.es_foil && <span className={styles.foilBadge}>Foil</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            La colección de este usuario está vacía o es privada.
          </div>
        )}
      </div>

    </div>
  );
};

export default PerfilPublico;