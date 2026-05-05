import apiClient from "../api/apiClient";

/// 1. Definimos la interfaz interna para los datos de la carta
export interface DetallesCarta {
  api_id: string;
  juego: 'magic' | 'pokemon';
  nombre: string;
  url_imagen: string;
}

export interface CartaCache {
  api_id: string;
  juego: 'magic' | 'pokemon';
  nombre: string;
  url_imagen: string;
}

export interface ColeccionItem {
  id: number;
  usuario_id: number;
  carta_api_id: string;
  cantidad: number;
  es_foil: boolean;
  carta: CartaCache;  // ← anidada gracias al Preload
}

// 2. Definimos la interfaz principal que espera el Backend
export interface CardPayload {
  usuario_id: number;
  cantidad: number;
  es_foil: boolean;
  carta: DetallesCarta; // ← objeto anidado, no carta_api_id plano
}

export async function agregarCartaAColeccion(payload: CardPayload) {
  try {
    const response = await apiClient.post("/coleccion", payload);
    return response.data;
  } catch (error) {
    console.error("Error al agregar la carta:", error);
    throw error;
  }
}



export async function obtenerColeccion(usuarioId: number) {
  const response = await apiClient.get(`/coleccion/${usuarioId}`);
  return response.data;
}

export async function eliminarCartaDeColeccion(id: number) {
  return await apiClient.delete(`/coleccion/${id}`); // Ajusta la ruta según tu back
}