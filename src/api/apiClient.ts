// Módulo central de comunicación HTTP con el backend.
// Equivalente a config/db.go en el backend — configura la conexión base
// que todos los servicios (authService, cardService, etc.) usan para
// hacer peticiones. En lugar de conectarse a PostgreSQL, se conecta al servidor Go.
//
// Usa Axios: una librería que simplifica las peticiones HTTP fetch.
// Ventaja sobre fetch nativo: manejo automático de JSON, interceptores,
// y mejor manejo de errores.
import axios from "axios";

// axios.create() genera una instancia de Axios preconfigurada.
// Todos los servicios que importen apiClient heredan esta configuración
// sin tener que repetirla en cada petición.
//
// La configuración de localhost está comentada para cambiar entre
// desarrollo local y producción sin borrar la URL anterior.
//
// ⚠️  MEJOR PRÁCTICA: en lugar de comentar/descomentar manualmente,
// usar variables de entorno de Vite que cambian automáticamente según el entorno:
//
//   baseURL: import.meta.env.VITE_API_URL
//
// Y definir en cada archivo de entorno:
//   .env.development  → VITE_API_URL=http://localhost:8080
//   .env.production   → VITE_API_URL=https://proyectobackendcartas-production.up.railway.app
//
// Vite ya incluye estos archivos en el proyecto (.env.development, .env.production)
// así que el cambio sería inmediato y sin riesgo de subir la URL incorrecta.
const apiClient = axios.create({
  baseURL: "https://proyectobackendcartas-production.up.railway.app",
  withCredentials: false, // false porque la autenticación usa JWT en headers,
                          // no cookies. Solo se pondría true si el backend
                          // usara sesiones con cookies (Set-Cookie).
});

// Interceptor de peticiones: función que Axios ejecuta automáticamente
// ANTES de enviar cualquier petición al backend.
//
// Un interceptor es como AuthMiddleware del backend pero al revés —
// en lugar de validar el token que llega, aquí se adjunta el token
// a cada petición que sale del frontend.
//
// Flujo:
//  1. Un servicio llama a apiClient.get("/coleccion/5")
//  2. Antes de enviar, el interceptor lee el token de localStorage
//  3. Si existe, lo agrega al header: Authorization: Bearer eyJhbGci...
//  4. El backend recibe la petición con el header y AuthMiddleware lo valida
//
// localStorage es el almacenamiento del navegador que persiste entre
// sesiones (a diferencia de sessionStorage que se borra al cerrar el tab).
// El token se guarda ahí en authService al hacer login.
//
// ⚠️  localStorage es accesible desde cualquier JavaScript en la página,
// lo que lo hace vulnerable a ataques XSS (Cross-Site Scripting).
// Una alternativa más segura es usar cookies HttpOnly (que JS no puede leer),
// pero requeriría cambiar withCredentials a true y configurar el backend.
// Para este proyecto el riesgo es aceptable dado el contexto académico.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Lee el JWT guardado al hacer login
    if (token && config.headers) {
      // Adjunta el token en el formato que AuthMiddleware del backend espera:
      // "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Devuelve la config modificada para que Axios continúe con el envío
  },
  // Segunda función del interceptor: maneja errores ANTES de que la petición salga.
  // Promise.reject(error) propaga el error para que el servicio que hizo
  // la llamada pueda capturarlo con try/catch o .catch()
  (error) => Promise.reject(error)
);

// Se exporta como default para que todos los servicios puedan importarlo:
//   import apiClient from '../api/apiClient'
export default apiClient;