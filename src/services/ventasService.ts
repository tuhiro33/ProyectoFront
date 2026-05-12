import apiClient from "../api/apiClient";

export interface ColeccionDTO {
  id: number;
  cantidad: number;
  carta_nombre: string;
  carta_juego: 'magic' | 'pokemon';
  carta_imagen: string;
}

export interface VendedorDTO {
  id: number;
  nombre: string;
}

export interface PublicacionVenta {
  id: number;
  precio: number;
  estado_carta: string;
  foto_url: string;
  estado_publicacion: string;
  fecha_publicacion: string;
  vendedor: VendedorDTO;
  coleccion: ColeccionDTO;
}

export interface CrearPublicacionPayload {
  coleccion_id: number;
  precio: number;
  estado_carta: string;
  foto_url: string;
}

export async function obtenerPublicaciones(): Promise<PublicacionVenta[]> {
  const res = await apiClient.get('/publicaciones');
  return res.data ?? []; 
}

export async function crearPublicacion(payload: CrearPublicacionPayload): Promise<PublicacionVenta> {
  const res = await apiClient.post('/publicaciones', payload);
  return res.data;
}

export async function eliminarPublicacion(id: number): Promise<void> {
  await apiClient.delete(`/publicaciones/${id}`);
}

export async function obtenerMisPublicaciones(): Promise<PublicacionVenta[]> {
  const res = await apiClient.get('/publicaciones/mis');
  return res.data;
}