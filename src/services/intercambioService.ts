// Servicio de intercambio: maneja el envío de notificaciones por email
// cuando un usuario quiere hacer una oferta por la carta de otro usuario.
//
// Se comunica con intercambio_controller.go del backend
// (POST /api/intercambio/notificar).
//
// Nota de diseño: este servicio usa el patrón de objeto con métodos
// (export const intercambioService = { metodo: fn })
// mientras que los otros servicios exportan funciones sueltas.
// Ambos patrones son válidos — para consistencia considerar unificar
// al mismo estilo que authService y cardService.
import apiClient from "../api/apiClient";

// IntercambioRequest define los datos que se envían al backend.
// Debe coincidir exactamente con la struct IntercambioRequest
// de intercambio_controller.go — los nombres en camelCase aquí
// se mapean a los json:"..." tags del backend:
//   nombreCarta        → json:"nombreCarta"
//   precio             → json:"precio"
//   estadoCarta        → json:"estadoCarta"
//   nombreDestinatario → json:"nombreDestinatario"
//   correoComprador    → json:"correoComprador"
export interface IntercambioRequest {
  nombreCarta: string;
  precio: number;
  estadoCarta: string;
  nombreDestinatario: string;
  correoComprador: string;   // Email del comprador que se muestra en el email al vendedor
}

export const intercambioService = {

  // enviarNotificacion hace POST /api/intercambio/notificar con los datos
  // del intercambio y devuelve true si el backend recibió la petición,
  // false si hubo algún error.
  //
  // Promise<boolean> como tipo de retorno es una decisión de diseño:
  // en lugar de propagar el error al componente (con throw),
  // lo absorbe aquí y devuelve un booleano simple.
  // Ventaja: el componente solo necesita if (resultado) { ... } sin try/catch.
  // Desventaja: el componente no puede saber QUÉ salió mal, solo que falló.
  //
  // ⚠️  El backend responde con 200 OK inmediatamente (antes de que el email
  // se envíe, porque usa goroutine asíncrona). Esto significa que true aquí
  // solo garantiza que el backend RECIBIÓ la petición, no que el email
  // llegó al destinatario. Ver nota en intercambio_controller.go.
  enviarNotificacion: async (datos: IntercambioRequest): Promise<boolean> => {
    try {
      // apiClient adjunta automáticamente el JWT del localStorage en el header,
      // necesario porque /api/intercambio/notificar está dentro del grupo auth.
      const response = await apiClient.post('/api/intercambio/notificar', datos);

      // Axios considera exitosa cualquier respuesta con status 2xx (200-299).
      // Si el backend devuelve 4xx o 5xx, Axios lanza un error y va al catch.
      console.log('Respuesta de Go:', response.data.message);
      return true;

    } catch (error: any) {
      // error.response existe cuando el servidor respondió con un error HTTP
      // (400 datos inválidos, 401 sin token, 500 error interno, etc.)
      // En ese caso el cuerpo del error viene en error.response.data
      if (error.response) {
        // error.response.data.error es el campo "error" del gin.H{"error": "..."}
        // que devuelve el backend en sus respuestas de error
        console.error('Error del backend:', error.response.data.error || error.response.data);
      } else {
        // Si error.response no existe, el problema fue antes de llegar al servidor:
        // sin internet, servidor caído, timeout, CORS bloqueado, etc.
        console.error('Error de conexión o red:', error.message);
      }
      return false;
    }
  }
};