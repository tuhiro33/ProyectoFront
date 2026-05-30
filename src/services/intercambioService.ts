// Importas el cliente que acabas de mostrarme
import apiClient from "../api/apiClient"; // Ajusta la ruta relativa de donde guardaste tu archivo

// La interfaz para asegurar la integridad de los datos de la carta
export interface IntercambioRequest {
  nombreCarta: string;
  precio: number;
  estadoCarta: string;
  nombreDestinatario: string;
  correoComprador: string;
}

export const intercambioService = {
  /**
   * Envía la oferta de intercambio usando tu configuración global de Axios
   */
  enviarNotificacion: async (datos: IntercambioRequest): Promise<boolean> => {
    try {
      // Al usar apiClient, ya lleva el baseURL, las cabeceras y el Token de localStorage automáticamente
      const response = await apiClient.post('/api/intercambio/notificar', datos);
      
      // Axios resuelve con éxito si el status es 2xx
      console.log('Respuesta de Go:', response.data.message);
      return true;

    } catch (error: any) {
      // Axios maneja los errores HTTP (400, 401, 500, etc.) en el bloque catch
      if (error.response) {
        console.error('Error del backend:', error.response.data.error || error.response.data);
      } else {
        console.error('Error de conexión o red:', error.message);
      }
      return false;
    }
  }
};