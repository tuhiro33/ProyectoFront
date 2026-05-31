// Servicio de autenticación: centraliza las llamadas HTTP relacionadas
// con el inicio de sesión y registro de usuarios.
//
// En la arquitectura del frontend, los servicios son la capa equivalente
// a los controladores del backend — se encargan de comunicarse con la API
// y devolver los datos procesados a los componentes que los necesiten.
//
// Actualmente solo contiene login(). Register probablemente esté
// en su propio componente o pendiente de agregar aquí.
import apiClient from "../api/apiClient";

// login() envía las credenciales al backend y guarda la sesión localmente.
//
// async/await es la forma moderna de manejar operaciones asíncronas en JavaScript.
// Una operación asíncrona es aquella que tarda tiempo (como una llamada HTTP)
// y no queremos bloquear el resto de la aplicación mientras espera.
// await pausa la ejecución de esta función hasta que apiClient.post termine,
// sin congelar el navegador.
//
// Flujo completo:
//  1. Componente Login llama login(email, password)
//  2. apiClient.post("/login", {...}) envía POST al backend Go
//  3. El backend valida credenciales con bcrypt y devuelve { token: "eyJ..." }
//  4. Se guarda el token en localStorage para que persista entre recargas
//  5. Se devuelve response.data al componente para que pueda redirigir o mostrar error
//
// ⚠️  PROBLEMA DE SINCRONÍA CON AuthContext:
// Esta función guarda el token en localStorage directamente, pero AuthContext
// no se entera del cambio automáticamente — useState no reacciona a cambios
// en localStorage hechos desde fuera del contexto.
// El componente Login probablemente fuerza una recarga (window.location.reload)
// o redirige, lo cual hace que AuthContext lea el token al montarse de nuevo.
// La solución más limpia sería usar la función login() del contexto
// sugerida al comentar AuthContext.tsx.
export async function login(email: string, password: string) {
  const response = await apiClient.post("/login", {
    email,
    password
  });

  // El backend responde con { token: "eyJhbGci..." } según Login() en usuarios_controller.go
  const token = response.data.token;

  // ⚠️  INCONSISTENCIA CON EL BACKEND:
  // response.data.usuario intenta leer un campo "usuario" de la respuesta,
  // pero el backend solo devuelve { "token": "..." } — no incluye datos del usuario.
  // Esto significa que user siempre será undefined aquí.
  //
  // AuthContext resuelve esto haciendo GET /me después de encontrar el token
  // en localStorage al montarse, así que en la práctica funciona,
  // pero localStorage.setItem("user", JSON.stringify(undefined)) guarda
  // el string "undefined" — exactamente el caso que AuthContext maneja
  // con la validación: if (!savedUser || savedUser === "undefined") return null
  const user = response.data.usuario;

  // Guarda el token en localStorage para que persista al recargar la página.
  // apiClient lo leerá automáticamente en cada petición via el interceptor.
  localStorage.setItem("token", token);

  // ⚠️  Guarda "undefined" como string si el backend no devuelve usuario.
  // Ver explicación arriba. Con la corrección del backend o agregando
  // GET /me aquí, este valor sería un objeto Usuario válido.
  localStorage.setItem("user", JSON.stringify(user));

  return response.data;
}