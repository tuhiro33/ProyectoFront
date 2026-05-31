// Página de registro: permite a nuevos usuarios crear una cuenta.
// A diferencia de Login.tsx que usa authService, este componente
// llama a apiClient directamente — una inconsistencia menor ya que
// Register podría tener su propia función en authService.ts.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import styles from '../../assets/styles/Register.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();

  // formData agrupa todos los campos del formulario en un solo objeto de estado
  // en lugar de tener un useState separado por campo (como en Login.tsx).
  // Ambos enfoques son válidos — este es más escalable cuando hay muchos campos.
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email: '',
    password: '',
    confirmar_password: '' // Solo existe en el frontend — no se envía al backend
  });

  // error almacena el mensaje a mostrar debajo del formulario.
  // String vacío '' significa sin error — la condición {error && <p>} en el JSX
  // solo renderiza el párrafo cuando error tiene contenido.
  const [error, setError] = useState('');

  // handleChange es un manejador genérico que sirve para TODOS los inputs del form.
  // React.ChangeEvent<HTMLInputElement> es el tipo TypeScript del evento onChange de un input.
  // Funciona gracias a que cada input tiene name="campo" que coincide con
  // la clave correspondiente en formData:
  //   name="email" → actualiza formData.email
  //   name="password" → actualiza formData.password
  //
  // La sintaxis { ...prev, [name]: value } es el spread operator:
  //   ...prev copia todos los campos actuales de formData
  //   [name]: value sobreescribe solo el campo que cambió
  // Esto evita que actualizar un campo borre los valores de los demás.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiar errores anteriores antes de cada intento

    // Validaciones del lado del cliente — se ejecutan ANTES de llamar al backend.
    // Esto da feedback inmediato al usuario sin esperar una respuesta del servidor.
    // El backend también valida, pero estas validaciones mejoran la experiencia.

    // Verificar que ambas contraseñas coincidan antes de enviar.
    // confirmar_password nunca llega al backend — es solo para UX.
    if (formData.password !== formData.confirmar_password) {
      setError('Las contraseñas no coinciden. Revisa e intenta de nuevo.');
      return; // return corta la ejecución — no llega al apiClient.post
    }

    // Longitud mínima de contraseña validada en el cliente.
    // ⚠️  El backend (Register en usuarios_controller.go) no valida longitud mínima —
    // si alguien llama directamente a la API sin pasar por el frontend,
    // podría registrar contraseñas de 1 caracter. Considerar agregar
    // la validación también en el backend con binding:"min=6".
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      // apiClient.post serializa el objeto a JSON automáticamente
      // y agrega el header Content-Type: application/json.
      // Solo se envían los tres campos que el backend espera en RegisterRequest —
      // confirmar_password se omite intencionalmente.
      const response = await apiClient.post("/register", {
        nombre_usuario: formData.nombre_usuario,
        email: formData.email,
        password: formData.password
      });

      // Axios solo llega aquí si el status fue 2xx (200-299).
      // La verificación explícita de 200 || 201 es redundante —
      // si Axios no lanzó error, la petición fue exitosa.
      // Se puede simplificar a solo ejecutar el alert y navigate.
      if (response.status === 200 || response.status === 201) {
        alert("¡Cuenta creada con éxito!");
        // Redirige al login para que el usuario inicie sesión con su nueva cuenta.
        // A diferencia de Login.tsx, aquí no es necesario recargar la página
        // porque Register no modifica AuthContext — el usuario aún no está logueado.
        navigate("/login");
      }

    } catch (err: any) {
      console.error(err);

      // err.response existe cuando el servidor respondió con un error HTTP.
      // err.response.data.error es el campo "error" del gin.H{"error": "..."}
      // que devuelve el backend — por ejemplo: "El email ya está registrado"
      // Este mensaje se muestra directamente en el formulario (setError)
      // en lugar de un alert(), lo cual es mejor UX que en Login.tsx.
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        // Si no hay err.response, el problema fue de red o CORS,
        // no del servidor (igual que en intercambioService.ts).
        setError("No se pudo conectar con el servidor de la aplicación o el origen fue denegado.");
      }
    }
  };

  return (
    <div className={styles.splitLayout}>

      {/* Panel izquierdo: branding estático — sin toggle de tema como Login.tsx */}
      <div className={styles.brandingSide}>
        <h1 className={styles.brandTitle}>TCG Vault</h1>
        <p className={styles.brandSubtitle}>
          Únete a la comunidad de coleccionistas. Mantén tu colección segura,
          descubre nuevas cartas y negocia en el mercado global.
        </p>
      </div>

      {/* Panel derecho: formulario de registro */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>

          <div className={styles.formHeader}>
            <h2>Crear Cuenta</h2>
            <p>Ingresa tus datos para comenzar tu colección</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* htmlFor en <label> vincula la etiqueta con el input por su id.
                Al hacer clic en el label, el foco va al input correspondiente —
                mejora accesibilidad y área de clic. */}
            <div className={styles.inputGroup}>
              <label htmlFor="nombre_usuario">Nombre de Usuario</label>
              <input
                type="text"
                id="nombre_usuario"
                name="nombre_usuario"   // Debe coincidir con la clave en formData
                className={styles.inputControl}
                placeholder="Ej. Coleccionista99"
                value={formData.nombre_usuario}
                onChange={handleChange} // Un solo handler para todos los inputs
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.inputControl}
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                className={styles.inputControl}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmar_password">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmar_password"
                name="confirmar_password"
                className={styles.inputControl}
                placeholder="••••••••"
                value={formData.confirmar_password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Renderizado condicional del mensaje de error.
                El operador && en JSX funciona como: si error es truthy (no vacío),
                renderiza el <p>. Si error es '' (falsy), no renderiza nada. */}
            {error && <p className={styles.errorText}>{error}</p>}

            <button type="submit" className={styles.submitBtn}>
              Registrarme
            </button>
          </form>

          {/* Link correcto — sin antipatrón de <Link> dentro de <button>
              como ocurre en Login.tsx. Este es el patrón a seguir. */}
          <div className={styles.loginPrompt}>
            ¿Ya tienes una cuenta?
            <Link to="/login" className={styles.loginLink}>
              Inicia sesión aquí
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default RegisterPage;