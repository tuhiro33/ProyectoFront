// Servicio de cartas: centraliza todas las llamadas HTTP relacionadas
// con la colección personal de cartas TCG de cada usuario.
//
// Este servicio se comunica con los endpoints de colección del backend
// (coleccionUsuarios_controller.go) y define las interfaces TypeScript
// que deben coincidir con los modelos y DTOs de Go.
import apiClient from "../api/apiClient";

// DetallesCarta representa los datos de una carta que vienen de las APIs externas
// (Scryfall para Magic, PokéAPI para Pokémon) y que se envían al backend
// para que los guarde en CartaCache.
//
// Debe coincidir con el struct anónimo Carta dentro de AgregarCartaRequest
// en dto/coleccionUsuario_dto.go del backend.
// 'magic' | 'pokemon' es un union type de TypeScript — solo permite
// exactamente esos dos strings como valor válido para juego,
// equivalente a una validación en tiempo de compilación.
export interface DetallesCarta {
  api_id: string;
  juego: 'magic' | 'pokemon';
  nombre: string;
  url_imagen: string;
}

// CartaCache representa cómo el backend devuelve los datos de una carta
// cuando hace Preload("Carta") en una consulta de ColeccionUsuario.
// Debe coincidir con models/cartasCache.go del backend.
//
// ⚠️  DetallesCarta y CartaCache tienen exactamente los mismos campos.
// Podrían unificarse en una sola interface para evitar duplicación:
//   export interface Carta {
//     api_id: string;
//     juego: 'magic' | 'pokemon';
//     nombre: string;
//     url_imagen: string;
//   }
// La distinción semántica (datos de entrada vs datos de respuesta)
// podría mantenerse con alias: type CartaCache = Carta
export interface CartaCache {
  api_id: string;
  juego: 'magic' | 'pokemon';
  nombre: string;
  url_imagen: string;
}

// ColeccionItem representa una entrada en la colección del usuario
// tal como la devuelve GET /coleccion/:usuarioId.
// Debe coincidir con models/coleccionUsuario.go del backend,
// incluyendo el campo carta que GORM rellena con Preload("Carta").
export interface ColeccionItem {
  id: number;
  usuario_id: number;
  carta_api_id: string;
  cantidad: number;
  es_foil: boolean;
  carta: CartaCache; // Datos completos de la carta, disponibles gracias al Preload del backend
}

// CardPayload es el objeto completo que se envía en POST /coleccion.
// Debe coincidir con dto.AgregarCartaRequest del backend.
//
// ⚠️  Incluye usuario_id como campo explícito — recordar la advertencia
// del backend: este valor debería ignorarse y tomarse del JWT.
// Si el backend se corrige para usar c.GetUint("user_id"), este campo
// podría eliminarse del payload sin romper la funcionalidad.
export interface CardPayload {
  usuario_id: number;
  cantidad: number;
  es_foil: boolean;
  carta: DetallesCarta; // Objeto anidado requerido por AgregarCartaRequest del backend
}

// agregarCartaAColeccion envía una carta al backend para agregarla
// a la colección del usuario, haciendo upsert en CartaCache primero.
//
// try/catch captura errores de la petición HTTP (red caída, backend
// devuelve 4xx/5xx) para loguearlos antes de relanzarlos.
// El throw error al final propaga el error al componente que llamó
// esta función, para que pueda mostrar un mensaje al usuario.
// Sin el throw, el componente no sabría que algo falló.
export async function agregarCartaAColeccion(payload: CardPayload) {
  try {
    const response = await apiClient.post("/coleccion", payload);
    return response.data;
  } catch (error) {
    console.error("Error al agregar la carta:", error);
    throw error; // Propaga el error al componente llamador
  }
}

// obtenerColeccion trae todas las cartas de la colección de un usuario.
// Llama a GET /coleccion/:usuarioId — el backend devuelve un array
// de ColeccionItem con los datos de cada carta precargados.
//
// ⚠️  A diferencia de agregarCartaAColeccion, esta función no tiene
// try/catch — si la petición falla, el error se propaga directamente
// sin loguear. Considerar agregar manejo de errores consistente
// con el resto del servicio.
export async function obtenerColeccion(usuarioId: number) {
  const response = await apiClient.get(`/coleccion/${usuarioId}`);
  return response.data; // Array de ColeccionItem[]
}

// eliminarCartaDeColeccion elimina una entrada de la colección por su ID.
// Llama a DELETE /coleccion/:id en el backend.
//
// Devuelve la respuesta completa de Axios (no solo response.data)
// a diferencia de las otras funciones — el componente que la llame
// recibirá el objeto Axios completo con status, headers, etc.
// Para consistencia con las otras funciones debería retornar
// solo response.data o simplemente await sin return ya que
// un DELETE exitoso no suele tener body relevante.
export async function eliminarCartaDeColeccion(id: number) {
  return await apiClient.delete(`/coleccion/${id}`);
}