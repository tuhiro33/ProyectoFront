// import { createContext, useContext, useState, useEffect } from "react";

// interface Usuario {
//   id: number;
//   nombre_usuario: string;
//   email: string;
//   rol: string;
//   fecha_registro: string; // 👈 AGREGAR
//   foto_perfil: string;    // 👈 recomendable también
// }

// interface AuthContextType {
//   token: string | null;
//   user: Usuario | null;
//   isAuthenticated: boolean;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {

//   const [token, setToken] = useState<string | null>(null);
//   const [user, setUser] = useState<Usuario | null>(null);

//   useEffect(() => {
//   const savedToken = localStorage.getItem("token");

//   if (savedToken) {
//     setToken(savedToken);

//     fetch("http://localhost:8080/me", {
//       headers: {
//         Authorization: `Bearer ${savedToken}`
//       }
//     })
//       .then(res => res.json())
//       .then(data => {
//         setUser(data);
//       })
//       .catch(() => {
//         logout();
//       });
//     }
//   }, []);

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setToken(null);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         token,
//         user,
//         isAuthenticated: !!token,
//         logout
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {

//   const context = useContext(AuthContext);

//   if (!context) {
//     throw new Error("useAuth debe usarse dentro de AuthProvider");
//   }

//   return context;
// }
// Contexto de autenticación: gestiona el estado global de sesión del usuario.
// Es el equivalente frontend del sistema JWT del backend —
// centraliza quién está autenticado y hace esa información disponible
// en cualquier componente sin pasar props manualmente entre niveles.
//
// Patrón Context de React:
//   1. createContext → crea el "contenedor" del estado global
//   2. AuthProvider  → componente que mantiene el estado y lo distribuye
//   3. useAuth       → hook que cualquier componente usa para leer ese estado
import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";

// Interface TypeScript que define la forma del objeto usuario.
// Debe coincidir exactamente con UsuarioResponse del backend (dto/usuario_dto.go).
// Si el backend agrega o cambia campos, esta interface debe actualizarse también.
interface Usuario {
  id: number;
  nombre_usuario: string;
  email: string;
  rol: string;
  fecha_registro: string;
  foto_perfil: string;
}

// Interface que define qué valores y funciones expone el contexto
// a los componentes que lo consuman con useAuth().
interface AuthContextType {
  token: string | null;        // El JWT crudo, o null si no hay sesión
  user: Usuario | null;        // Datos del usuario logueado, o null si no hay sesión
  isAuthenticated: boolean;    // true si hay token — simplifica las verificaciones en componentes
  logout: () => void;          // Función para cerrar sesión
}

// createContext crea el contexto con valor inicial undefined.
// undefined indica que el contexto aún no tiene un Provider padre —
// si un componente intenta usarlo fuera de AuthProvider, useAuth() lo detecta
// y lanza un error claro en lugar de fallar silenciosamente.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider es el componente que envuelve la aplicación en main.tsx.
// Mantiene el estado de autenticación y lo distribuye a todos sus hijos
// a través del Context.
//
// { children }: { children: React.ReactNode } es la forma de TypeScript
// de decir "este componente acepta componentes hijos entre sus etiquetas".
// React.ReactNode es el tipo que cubre cualquier cosa renderizable: JSX,
// strings, números, arrays de componentes, etc.
export function AuthProvider({ children }: { children: React.ReactNode }) {

  // useState con función inicializadora (lazy initialization):
  // La función () => localStorage.getItem("token") se ejecuta UNA SOLA VEZ
  // al montar el componente, no en cada re-render.
  // Esto carga el token guardado del navegador al refrescar la página,
  // manteniendo la sesión activa entre visitas.
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );

  // Mismo patrón para el usuario, con validaciones extra porque
  // localStorage solo guarda strings — el objeto Usuario debe ser
  // serializado a JSON al guardar y parseado al leer.
  const [user, setUser] = useState<Usuario | null>(() => {
    const savedUser = localStorage.getItem("user");

    // Doble verificación: null (clave no existe) o el string "undefined"
    // que puede quedar guardado si en algún momento se hizo
    // localStorage.setItem("user", undefined) por error.
    if (!savedUser || savedUser === "undefined") return null;

    try {
      // JSON.parse convierte el string guardado de vuelta a objeto JavaScript.
      // Ejemplo: '{"id":1,"nombre_usuario":"Juan"}' → { id: 1, nombre_usuario: "Juan" }
      return JSON.parse(savedUser);
    } catch (e) {
      // Si el string en localStorage está corrupto y no es JSON válido,
      // se descarta y se empieza con null en lugar de crashear la app.
      console.error("Error parseando el usuario del localStorage:", e);
      return null;
    }
  });

  // useEffect ejecuta su función después de que el componente se monta en el DOM.
  // El array vacío [] como segundo argumento significa "ejecutar solo una vez
  // al montar" — equivalente a un constructor en programación orientada a objetos.
  //
  // Propósito: verificar con el backend que el token guardado sigue siendo válido.
  // Un token puede estar en localStorage pero ya estar expirado en el servidor
  // (después de 24 horas según GenerarToken en utils/jwt.go).
  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      setToken(savedToken);

      // GET /me es el endpoint del backend que devuelve el perfil del usuario autenticado.
      // apiClient adjunta automáticamente el token en el header Authorization
      // gracias al interceptor configurado en apiClient.ts.
      // Si el token es válido → actualiza el estado user con datos frescos del servidor.
      // Si el token expiró o es inválido → el backend responde 401 y se ejecuta el .catch
      apiClient.get("/me")
        .then(res => {
          setUser(res.data);
          // Actualiza localStorage con los datos más recientes del servidor,
          // por si el usuario cambió su nombre o foto desde la última sesión.
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch((err) => {
          // Token inválido o expirado: limpiar la sesión local.
          // El usuario deberá volver a hacer login.
          console.error("Token inválido o expirado en el servidor:", err);
          logout();
        });
    }
  }, []); // [] → solo se ejecuta al montar AuthProvider (una vez al cargar la app)

  // logout limpia el estado tanto en memoria (useState) como en el navegador (localStorage).
  // Después de llamar logout(), isAuthenticated será false y cualquier componente
  // que use useAuth() se actualizará automáticamente gracias al sistema reactivo de React.
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    // AuthContext.Provider distribuye los valores a todos los componentes hijos.
    // Cualquier componente que llame useAuth() recibirá estos valores actualizados
    // automáticamente cuando cambien (por ejemplo, al hacer logout).
    <AuthContext.Provider
      value={{
        token,
        user,
        // !! convierte cualquier valor a booleano:
        // !!null → false, !!"eyJhbGci..." → true
        // Simplifica las verificaciones en componentes: if (isAuthenticated) en lugar de if (token !== null)
        isAuthenticated: !!token,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// useAuth es un custom hook — una función que encapsula el uso de useContext
// y agrega una validación útil para el desarrollo.
//
// En lugar de que cada componente importe useContext y AuthContext por separado,
// solo importan useAuth y obtienen todo listo:
//   const { user, isAuthenticated, logout } = useAuth()
//
// ⚠️  LIMITACIÓN: AuthProvider no expone login() ni setToken() —
// el flujo de login está manejado directamente en los componentes Login/Register
// que escriben en localStorage y recargan la página o redirigen.
// Para mayor consistencia considerar agregar una función login(token, user)
// al contexto que centralice también esa lógica aquí.
export function useAuth() {
  const context = useContext(AuthContext);

  // Protección en tiempo de desarrollo: si alguien usa useAuth() en un componente
  // que no está dentro de AuthProvider en el árbol, lanza un error descriptivo
  // en lugar del error críptico que daría TypeScript con undefined.
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}