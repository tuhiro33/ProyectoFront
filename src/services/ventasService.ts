// Servicio de ventas: centraliza las llamadas HTTP relacionadas con
// publicaciones de cartas en el marketplace y su ciclo de vida
// (crear, listar, vender, eliminar).
//
// Se comunica con publicacionVentas_controller.go del backend.
// Las interfaces deben coincidir con dto.PublicacionResponse del backend.
import apiClient from "../api/apiClient";

// ColeccionDTO representa los datos de la colección anidados dentro
// de una publicación. Viene del Preload("Coleccion.Carta") que hace
// el backend en ObtenerPublicaciones.
//
// ⚠️  POSIBLE DESAJUSTE CON EL BACKEND:
// Los campos carta_nombre, carta_juego y carta_imagen sugieren que
// el DTO del backend aplana la carta dentro de la colección.
// Verificar que MapPublicacionToDTO en el backend efectivamente
// devuelve estos campos con estos nombres exactos — si no coinciden,
// estos valores llegarán como undefined sin error visible.
export interface ColeccionDTO {
  id: number;
  cantidad: number;
  carta_nombre: string;
  carta_juego: 'magic' | 'pokemon';
  carta_imagen: string;
}

// VendedorDTO representa los datos básicos del vendedor dentro
// de una publicación. Viene del Preload("Vendedor") del backend.
export interface VendedorDTO {
  id: number;
  nombre: string;
}

// PublicacionVenta es la representación completa de una publicación
// tal como la devuelve el backend en GET /publicaciones y GET /mis-publicaciones.
// Debe coincidir con dto.PublicacionResponse del backend.
export interface PublicacionVenta {
  id: number;
  precio: number;
  estado_carta: string;
  foto_url: string;
  estado_publicacion: string; // "Activa" | "Vendida" | "Eliminada"
  fecha_publicacion: string;  // String ISO 8601 — convertir a Date si se necesita formatear
  vendedor: VendedorDTO;      // Datos del vendedor (viene del Preload)
  coleccion: ColeccionDTO;    // Datos de la carta publicada (viene del Preload anidado)
}

// CrearPublicacionPayload es el objeto que se envía en POST /publicaciones.
// Debe coincidir con el struct anónimo que usa CrearPublicacion en el backend.
// VendedorID no se incluye aquí — el backend lo toma del JWT correctamente.
export interface CrearPublicacionPayload {
  coleccion_id: number;
  precio: number;
  estado_carta: string;
  foto_url: string;
}

// obtenerPublicaciones trae todas las publicaciones con estado "Activa".
// El operador ?? (nullish coalescing) devuelve [] si res.data es null o undefined,
// evitando que el componente reciba null y falle al intentar hacer .map() sobre él.
// Promise<PublicacionVenta[]> le dice a TypeScript que esta función
// siempre resolverá con un array de PublicacionVenta (nunca con otro tipo).
export async function obtenerPublicaciones(): Promise<PublicacionVenta[]> {
  const res = await apiClient.get('/publicaciones');
  return res.data ?? [];
}

// crearPublicacion envía una nueva publicación al marketplace.
// Retorna la publicación creada tal como la devuelve el backend.
//
// ⚠️  El backend actualmente devuelve models.PublicacionVenta directamente
// (sin DTO) en CrearPublicacion — si el modelo tiene campos extra o relaciones
// no cargadas, el tipo PublicacionVenta aquí puede no coincidir exactamente.
export async function crearPublicacion(payload: CrearPublicacionPayload): Promise<PublicacionVenta> {
  const res = await apiClient.post('/publicaciones', payload);
  return res.data;
}

// eliminarPublicacion hace soft delete en el backend —
// cambia estado_publicacion a "Eliminada" sin borrar el registro de la BD.
// Promise<void> indica que no se espera ningún valor de retorno útil.
export async function eliminarPublicacion(id: number): Promise<void> {
  await apiClient.delete(`/publicaciones/${id}`);
}

// obtenerMisPublicaciones trae las publicaciones activas del usuario autenticado.
// Array.isArray verifica que res.data sea un array antes de usarlo —
// más seguro que ?? [] porque también maneja el caso de que el backend
// devuelva un objeto en lugar de un array por error.
//
// ⚠️  RECORDAR EL BUG DEL BACKEND: ObtenerMisPublicaciones no filtra
// por usuario actualmente — devuelve TODAS las publicaciones activas
// del sistema, no solo las del usuario logueado.
// Cuando se corrija el backend (agregando WHERE vendedor_id = ?),
// este servicio funcionará correctamente sin cambios.
export async function obtenerMisPublicaciones(): Promise<PublicacionVenta[]> {
  const res = await apiClient.get('/mis-publicaciones');
  return Array.isArray(res.data) ? res.data : [];
}

// contarPublicacionesActivas cuenta cuántas publicaciones activas tiene
// el usuario para una entrada de colección específica.
// Se usa en el frontend para validar que no se publique más copias
// de las disponibles (misma lógica que CrearPublicacion en el backend).
//
// ⚠️  INEFICIENTE: hace GET /mis-publicaciones trayendo TODAS las publicaciones
// solo para filtrarlas en el cliente con .filter().
// Si el usuario tiene muchas publicaciones esto descarga datos innecesarios.
// Alternativa más eficiente: agregar un endpoint en el backend que reciba
// coleccionId y devuelva solo el conteo:
//   GET /publicaciones/activas/count?coleccion_id=5
//
// ⚠️  Hereda el bug de obtenerMisPublicaciones — mientras el backend
// no filtre por usuario, el conteo incluirá publicaciones de otros usuarios
// para la misma coleccion_id, dando un número incorrecto.
export async function contarPublicacionesActivas(coleccionId: number): Promise<number> {
  const res = await apiClient.get('/mis-publicaciones');
  const todas: PublicacionVenta[] = Array.isArray(res.data) ? res.data : [];
  // .filter() recorre el array y devuelve solo los elementos donde la condición es true.
  // .length cuenta cuántos elementos pasaron el filtro.
  return todas.filter(p => p.coleccion.id === coleccionId).length;
}

// marcarComoVendida notifica al backend que una carta fue vendida.
// Dispara la transacción atómica del backend que cambia estado_publicacion
// a "Vendida" y reduce la cantidad en ColeccionUsuario.
export async function marcarComoVendida(id: number): Promise<void> {
  await apiClient.put(`/publicaciones/${id}/vendida`);
}