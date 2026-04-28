import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/PerfilPublico.module.css';

// ================= INTERFACES =================
interface CartaCache {
  api_id: string;
  juego: 'magic' | 'pokemon';
  nombre: string;
}

interface ColeccionItem {
  id: number;
  cantidad: number;
  es_foil: boolean;
  carta: CartaCache;
  imageUrl?: string; 
}

interface PublicacionVenta {
  ID: number;
  Precio: number;
  EstadoCarta: string;
  FotoURL: string;
  Coleccion: { nombre_carta: string; juego: 'magic' | 'pokemon' };
}

// ================= DATOS DE PRUEBA DEL USUARIO =================
const usuarioPerfil = {
  nombre: "Tomas",
  rol: "Coleccionista",
  ubicacion: "Delicias, Chihuahua",
  avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwI-SIdNOEHGxNnr0zNVPf7TD4TaBAxahdSA&s",
  miembroDesde: "2024"
};

const mockVentasUsuario: PublicacionVenta[] = [
  {
    ID: 201, Precio: 185.50, EstadoCarta: "LP",
    FotoURL: "https://i.redd.it/lots-of-hype-for-the-lugia-v-alt-art-and-i-know-im-not-v0-oz84101wk6x91.jpg?width=3024&format=pjpg&auto=webp&s=1ba547e066031bb0c3e8903de6d6e1bc84073e4b", 
    Coleccion: { nombre_carta: "Lugia V Alt Art", juego: "pokemon" }
  },
  {
    ID: 202, Precio: 45.00, EstadoCarta: "NM",
    FotoURL: "https://gatherer-static.wizards.com/Cards/medium/9EE93146CA14A256CD5C29FE40C394DDEFB749C2D8DC6FEB1AFAF3DCE97E5862.png", 
    Coleccion: { nombre_carta: "Force of Will", juego: "magic" }
  }
];

const mockColeccionUsuario: ColeccionItem[] = [
  { id: 1, cantidad: 1, es_foil: true, carta: { api_id: "xy1-1", juego: "pokemon", nombre: "Venusaur EX" } },
  { id: 2, cantidad: 4, es_foil: false, carta: { api_id: "0000579f-7b35-4ed3-b44c-db2a538066fe", juego: "magic", nombre: "Black Lotus" } }
];

// ================= COMPONENTE =================
const PerfilPublico = () => {
  const [coleccion, setColeccion] = useState<ColeccionItem[]>([]);

  // Efecto para cargar las imágenes de la colección desde las APIs
  useEffect(() => {
    const fetchImages = async () => {
      const coleccionConImagenes = await Promise.all(
        mockColeccionUsuario.map(async (item) => {
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
    fetchImages();
  }, []);

  return (
    <div className={styles.container}>
      
      {/* ================= HEADER DEL PERFIL ================= */}
      <div className={styles.profileHeader}>
        <div className={styles.banner}>
          <div className={styles.avatarWrapper}>
            <img src={usuarioPerfil.avatar} alt={usuarioPerfil.nombre} className={styles.avatarImage} />
          </div>
        </div>
        <div className={styles.userInfo}>
          <div>
            <h1>{usuarioPerfil.nombre}</h1>
            <div className={styles.userMeta}>
              <span className={styles.metaItem}>🛡️ {usuarioPerfil.rol}</span>
              <span className={styles.metaItem}>📍 {usuarioPerfil.ubicacion}</span>
              <span className={styles.metaItem}>📅 Miembro desde {usuarioPerfil.miembroDesde}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECCIÓN 1: EN VENTA (MARKETPLACE) ================= */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>🛒 Artículos en Venta</h2>
        
        {mockVentasUsuario.length > 0 ? (
          <div className={styles.grid}>
            {mockVentasUsuario.map((pub) => (
              <div key={pub.ID} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img src={pub.FotoURL} alt={pub.Coleccion.nombre_carta} className={styles.cardImage} />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{pub.Coleccion.nombre_carta}</h3>
                  <div className={styles.cardMeta}>
                    {pub.Coleccion.juego === 'magic' ? 'Magic' : 'Pokémon'}
                    <br />
                    <span className={styles.badge}>Estado: {pub.EstadoCarta}</span>
                  </div>
                  <div className={styles.priceTag}>${pub.Precio.toFixed(2)}</div>
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
        <h2 className={styles.sectionTitle}>🎴 Colección de {usuarioPerfil.nombre}</h2>
        
        {coleccion.length > 0 ? (
          <div className={styles.grid}>
            {coleccion.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.carta.nombre} className={styles.cardImage} />
                  ) : (
                    <span>Cargando...</span>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{item.carta.nombre}</h3>
                  <div className={styles.cardMeta}>
                    {item.carta.juego === 'magic' ? 'Magic' : 'Pokémon'}
                    <br />
                    <span className={styles.badge}>Cantidad: {item.cantidad}</span>
                    {item.es_foil && <span className={styles.badge} style={{marginLeft: '5px', color: '#F59E0B'}}>Foil</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>La colección de este usuario es privada o está vacía.</div>
        )}
      </div>

    </div>
  );
};

export default PerfilPublico;