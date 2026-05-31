// Hook personalizado (custom hook) para manejar el estado de carga
// de operaciones asíncronas como llamadas HTTP.
//
// En React, un hook es una función que empieza con "use" y permite
// agregar comportamiento reutilizable a los componentes sin repetir código.
// Este hook resuelve un problema común: deshabilitar un botón mientras
// se espera una respuesta del servidor para evitar envíos duplicados.
//
// Uso típico en un componente:
//   const { isLoading, run } = useAsync()
//
//   const handleSubmit = () => run(async () => {
//     await crearPublicacion(datos)
//     navigate('/mercado')
//   })
//
//   <button disabled={isLoading} onClick={handleSubmit}>
//     {isLoading ? 'Guardando...' : 'Publicar'}
//   </button>
import { useState } from 'react';

// useAsync es el hook más pequeño y reutilizable del proyecto.
// Encapsula dos responsabilidades:
//   1. Rastrear si hay una operación asíncrona en curso (isLoading)
//   2. Prevenir que se lance la misma operación dos veces en paralelo
//
// ⚠️  La función fn está tipada como () => Promise<void> —
// solo acepta funciones que no devuelven valor.
// Si se necesita el resultado de la operación (por ejemplo, el ID
// de una publicación recién creada), este hook no lo soporta.
// Para ese caso habría que cambiar el tipo a () => Promise<T>
// y hacer que run también devuelva ese valor:
//   const run = async <T>(fn: () => Promise<T>): Promise<T | undefined>
export function useAsync() {

  // isLoading es el estado que los componentes pueden leer para
  // mostrar spinners o deshabilitar botones mientras hay una operación en curso.
  // useState(false) inicializa isLoading en false — sin carga al arrancar.
  const [isLoading, setIsLoading] = useState(false);

  // run recibe una función asíncrona y la ejecuta con seguridad.
  // fn: () => Promise<void> significa que run acepta cualquier función
  // que no reciba argumentos y devuelva una Promesa.
  // La función se pasa como argumento en lugar de ejecutarse directamente
  // para que run pueda controlar el ciclo de vida (antes, durante y después).
  const run = async (fn: () => Promise<void>) => {

    // Guarda de doble ejecución: si ya hay una operación en curso,
    // ignorar el nuevo intento. Previene el caso de usuario que
    // hace clic varias veces rápido en "Publicar" y genera
    // múltiples peticiones al backend.
    if (isLoading) return;

    setIsLoading(true); // Activar estado de carga antes de ejecutar

    try {
      await fn(); // Ejecutar la operación asíncrona y esperar que termine
    } finally {
      // finally se ejecuta SIEMPRE al terminar el try, tanto si fn()
      // tuvo éxito como si lanzó un error. Esto garantiza que isLoading
      // vuelve a false en cualquier caso — si no se usara finally y fn()
      // lanzara un error, isLoading quedaría en true para siempre
      // y el botón quedaría deshabilitado permanentemente.
      setIsLoading(false);
    }
  };

  // Devuelve los dos elementos que el componente necesita:
  //   isLoading → para mostrar feedback visual (spinner, texto, disabled)
  //   run       → para envolver la operación asíncrona con protección
  return { isLoading, run };
}