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
import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient"; // 1. Importamos tu apiClient personalizado

interface Usuario {
  id: number;
  nombre_usuario: string;
  email: string;
  rol: string;
  fecha_registro: string; 
  foto_perfil: string;    
}

interface AuthContextType {
  token: string | null;
  user: Usuario | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  
  // ================= 🛡️ CONFIGURACIÓN ROBUSTA Y SEGURA AQUÍ =================
  const [user, setUser] = useState<Usuario | null>(() => {
    const savedUser = localStorage.getItem("user");
    
    // Si no hay nada, o si quedó guardado el texto "undefined" por error, devolvemos null limpiamente
    if (!savedUser || savedUser === "undefined") return null; 
    
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error("Error parseando el usuario del localStorage:", e);
      return null;
    }
  });
  // =========================================================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      setToken(savedToken);

      // ================= CÓDIGO CORREGIDO CON APICLIENT =================
      apiClient.get("/me")
        .then(res => {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data)); 
        })
        .catch((err) => {
          console.error("Token inválido o expirado en el servidor:", err);
          logout();
        });
      // =================================================================
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token, 
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}