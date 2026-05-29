import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../../assets/styles/PerfilPublico.module.css';
import apiClient from '../../api/apiClient'; 
import { useAuth } from '../../context/AuthContext'; 

// ================= INTERFACES ALINEADAS AL BACKEND =================
interface UsuarioDTO {
  id: number;
  nombre: string;
  rol?: string;       
  miembroDesde?: string;
  avatar?: string;
}

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
  const { usuarioId } = useParams<{ usuarioId: string }>();
  const { user: loggedInUser } = useAuth();

  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [ventas, setVentas] = useState<PublicacionVenta[]>([]);
  const [coleccion, setColeccion] = useState<ColeccionItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatosPerfil = async () => {
      if (!usuarioId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // 1. Si el ID de la URL coincide con el usuario logueado, usamos sus datos de sesión de inmediato
        if (loggedInUser && Number(loggedInUser.id) === Number(usuarioId)) {
          setUsuario({
            id: Number(loggedInUser.id),
            nombre: loggedInUser.nombre_usuario || "Usuario",
            rol: loggedInUser.rol || "Coleccionista",
            miembroDesde: "2025",
            avatar: loggedInUser.foto_perfil || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwI-SIdNOEHGxNnr0zNVPf7TD4TaBAxahdSA&s"
          });
        }

        // 2. Ejecutamos las peticiones concurrentes a la base de datos
        // ¡Añadimos la petición directa del perfil del usuario remoto!
        const [resColeccion, resPublicaciones, resInfoUsuario] = await Promise.all([
          apiClient.get(`/coleccion/${usuarioId}`),
          apiClient.get('/publicaciones'),
          apiClient.get(`/usuarios/perfil/${usuarioId}`) // 👈 Tu nuevo endpoint global
        ]);

        // Procesar colección filtrando los elementos con cantidad > 0
        const coleccionData: ColeccionItem[] = Array.isArray(resColeccion.data) ? resColeccion.data : [];
        const coleccionValida = coleccionData.filter(item => item.cantidad > 0);
        setColeccion(coleccionValida);

        // Filtrar publicaciones que correspondan al usuario de la URL
        const todasLasPublicaciones: PublicacionVenta[] = Array.isArray(resPublicaciones.data) ? resPublicaciones.data : [];
        const ventasUsuario = todasLasPublicaciones.filter(pub => {
          return (pub as any).vendedor?.id === Number(usuarioId);
        });
        setVentas(ventasUsuario);

        // 3. Si es un usuario externo, mapeamos la respuesta directa del backend
        if (!loggedInUser || Number(loggedInUser.id) !== Number(usuarioId)) {
          const datosRemotos = resInfoUsuario.data;
          
          setUsuario({
            id: Number(usuarioId),
            // Ajustamos las llaves según los nombres exactos que use tu dto.UsuarioResponse en Go
            nombre: datosRemotos.nombre_usuario || datosRemotos.nombre || `Usuario #${usuarioId}`,
            rol: datosRemotos.rol?.nombre || "Coleccionista",
            miembroDesde: "2025",
            avatar: datosRemotos.foto_perfil || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwI-SIdNOEHGxNnr0zNVPf7TD4TaBAxahdSA&s"
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

  if (loading) return <div className={styles.container}>Cargando perfil del usuario...</div>;
  if (error || !usuario) return <div className={styles.container}>⚠️ {error || "Usuario no encontrado"}</div>;

  return (
    <div className={styles.container}>
      
      {/* ================= HEADER DEL PERFIL ================= */}
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

      {/* ================= SECCIÓN 1: EN VENTA ================= */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>🛒 Artículos en Venta</h2>
        
        {ventas.length > 0 ? (
          <div className={styles.grid}>
            {ventas.map((pub) => (
              <div key={pub.id} className={styles.card}>
                <div className={styles.imageWrapper}>
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
                  <button className={styles.buyBtn}>Comprar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>Este usuario no tiene cartas a la venta actualmente.</div>
        )}
      </div>

      {/* ================= SECCIÓN 2: COLECCIÓN PERSONAL ================= */}
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
                    {item.es_foil && <span className={styles.badge} style={{marginLeft: '5px', color: '#F59E0B'}}>Foil</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>La colección de este usuario está vacía o es privada.</div>
        )}
      </div>

    </div>
  );
};

export default PerfilPublico;