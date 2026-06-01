// Página de perfil: permite al usuario autenticado ver y editar
// sus datos personales, cambiar contraseña, actualizar foto de perfil
// y eliminar su cuenta permanentemente.
//
// A diferencia de PerfilPublico.tsx que muestra datos de cualquier usuario,
// esta página siempre opera sobre el usuario del JWT (c.GetUint("user_id")
// en el backend) — el usuario solo puede editar su propio perfil.
import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Perfil.module.css';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import apiClient from '../../api/apiClient';

const PerfilPage = () => {
  // user viene de AuthContext — contiene los datos del usuario logueado.
  // Se asigna a 'usuario' por claridad semántica en el contexto de este componente.
  const { user, logout } = useAuth();
  const usuario = user;
  const navigate = useNavigate();

  // ⚠️  useAuth() se llama dos veces en el código original — una para user
  // y otra para logout. Se puede unificar en una sola llamada:
  //   const { user, logout } = useAuth()
  // Ambas formas funcionan igual porque useContext devuelve siempre el mismo objeto.

  // formData agrupa todos los campos editables del formulario.
  // foto_file almacena el File seleccionado antes de subirlo —
  // es un File del navegador, no una URL.
  // new_password y confirm_password solo se envían al backend si tienen valor.
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email: '',
    foto_file: null as File | null,
    new_password: '',
    confirm_password: ''  // Solo para validación en el cliente — no se envía al backend
  });

  // previewImage muestra la imagen de perfil en el avatar antes de guardar.
  // Se actualiza con URL.createObjectURL() al seleccionar un archivo local,
  // mostrando una vista previa inmediata sin subir al servidor todavía.
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // useEffect inicializa el formulario con los datos actuales del usuario
  // cuando AuthContext termina de cargar (usuario puede ser null al inicio).
  // [usuario] como dependencia re-ejecuta si el objeto usuario cambia.
  useEffect(() => {
    if (usuario) {
      setFormData(prev => ({
        ...prev,                                    // Mantiene foto_file y passwords vacíos
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email
      }));
      setPreviewImage(usuario.foto_perfil || null);
    }
  }, [usuario]);

  // handleDeleteAccount elimina la cuenta del usuario autenticado.
  // El backend identifica al usuario por el JWT — no se envía ID en el body.
  // Después de eliminar, limpia la sesión y redirige al login.
  const handleDeleteAccount = async () => {
    const confirmacion = window.confirm(
      "⚠️ Esta acción eliminará tu cuenta permanentemente.\n\n¿Estás seguro?"
    );
    if (!confirmacion) return;

    try {
      // DELETE /usuarios — el backend usa c.GetUint("user_id") del JWT
      // para saber qué cuenta eliminar. No se necesita enviar el ID en la URL.
      await apiClient.delete("/usuarios");

      alert("Cuenta completa e irreversiblemente eliminada.");
      // logout() limpia localStorage y el estado de AuthContext.
      // navigate("/login") redirige sin recargar la página.
      logout();
      navigate("/login");

    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al eliminar la cuenta");
    }
  };

  // Renderizado condicional mientras AuthContext carga el usuario.
  // Puede ocurrir brevemente al refrescar la página antes de que
  // el useEffect de AuthContext termine de verificar el token con GET /me.
  if (!usuario) return <div className={styles.loadingFull}>Cargando perfil del santuario...</div>;

  // handleChange es el manejador genérico para inputs de texto —
  // mismo patrón que Register.tsx con name + spread operator.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // handleFileChange maneja la selección de imagen de perfil.
  // URL.createObjectURL() crea una URL temporal en memoria del navegador
  // que apunta al archivo local — permite mostrar la vista previa
  // sin hacer ninguna petición HTTP todavía.
  // ⚠️  Las URLs de createObjectURL() deben liberarse con URL.revokeObjectURL()
  // cuando ya no se necesitan para evitar memory leaks, aunque en este caso
  // el impacto es mínimo porque el componente se desmonta limpiando la memoria.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, foto_file: file }));
      setPreviewImage(URL.createObjectURL(file)); // Vista previa local inmediata
    }
  };

  // handleSave procesa el formulario en hasta tres pasos:
  //  1. (Opcional) Sube la imagen al endpoint /upload si el usuario eligió una nueva foto
  //  2. Construye el body con los campos a actualizar
  //  3. Envía PUT /usuarios con los datos actualizados
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de contraseña en el cliente antes de llamar al backend.
    if (formData.new_password !== formData.confirm_password) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
      // fotoPerfil inicia con la URL actual — se reemplaza solo si
      // el usuario seleccionó un archivo nuevo.
      let fotoPerfil = usuario.foto_perfil;

      if (formData.foto_file) {
        // Mismo patrón de FormData + multipart/form-data que Coleccion.tsx.
        // "image" debe coincidir con c.FormFile("image") en el backend.
        const uploadData = new FormData();
        uploadData.append("image", formData.foto_file);

        const uploadRes = await apiClient.post("/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fotoPerfil = uploadRes.data.url; // URL pública de la imagen subida
      }

      // Record<string, string> es el tipo TypeScript para un objeto
      // con claves y valores string — equivalente a { [key: string]: string }.
      // Se usa porque los campos son dinámicos (password se agrega condicionalmente).
      const body: Record<string, string> = {
        nombre_usuario: formData.nombre_usuario,
        email:          formData.email,
        foto_perfil:    fotoPerfil
      };

      // La contraseña solo se incluye si el usuario escribió una nueva.
      // Si new_password está vacío, el backend no cambia la contraseña actual
      // gracias a la validación if (request.Password != "") en ActualizarUsuario.
      if (formData.new_password) {
        body.password = formData.new_password;
      }

      // PUT /usuarios — el backend identifica al usuario por el JWT,
      // no por un ID en la URL. Solo actualiza los campos no vacíos.
      await apiClient.put("/usuarios", body);

      alert("¡Perfil actualizado correctamente!");

      // Limpiar campos sensibles después de guardar exitosamente.
      // nombre_usuario, email y previewImage mantienen sus valores
      // para que el formulario siga mostrando los datos actualizados.
      setFormData(prev => ({
        ...prev,
        new_password:    '',
        confirm_password: '',
        foto_file:       null
      }));

      // ⚠️  AuthContext no se actualiza tras el PUT — user.nombre_usuario y
      // user.foto_perfil en el contexto siguen con los valores anteriores
      // hasta que el usuario recargue la página o cierre y abra sesión.
      // La corrección sería llamar GET /me después del PUT y actualizar el contexto.

    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar los cambios");
    }
  };

  // toLocaleDateString con opciones formatea la fecha ISO del backend
  // a texto legible en español: "15 de marzo de 2024"
  const fechaFormateada = new Date(usuario.fecha_registro).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.perfilContainer}>
      <div className={styles.profileCard}>

        {/* Banner con avatar — muestra previewImage si hay archivo seleccionado,
            foto_perfil si no hay preview, o imagen placeholder como último recurso */}
        <div className={styles.banner}>
          <div className={styles.avatarContainer}>
            <img
              src={previewImage || usuario.foto_perfil || "https://i.pravatar.cc/150"}
              alt="Avatar del Coleccionista"
              className={styles.avatarImage}
            />
          </div>
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.userInfo}>
            <h1>Actualizar Perfil</h1>
            {/* padStart(6, '0') formatea el ID con ceros a la izquierda:
                ID 42 → "#000042", ID 1000 → "#001000" */}
            <p>ID: #{usuario.id.toString().padStart(6, '0')}</p>
            <p>Miembro desde {fechaFormateada}</p>
          </div>
        </div>

        <div className={styles.formSection}>
          <form onSubmit={handleSave}>

            <div className={styles.inputGroup}>
              <label>Nombre de Usuario</label>
              <input
                type="text"
                name="nombre_usuario"
                className={styles.inputControl}
                value={formData.nombre_usuario}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Correo Electrónico</label>
              <input
                type="email"
                name="email"
                className={styles.inputControl}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Subir Nueva Foto de Perfil</label>
              {/* accept="image/*" limita el selector a archivos de imagen */}
              <input
                type="file"
                accept="image/*"
                className={styles.inputControl}
                onChange={handleFileChange}
              />
            </div>

            {/* Campo de solo lectura — el rol no es editable por el usuario.
                Se muestra como div estilizado en lugar de input para
                comunicar visualmente que no es modificable. */}
            <div className={styles.inputGroup}>
              <label>Rol asignado</label>
              <div className={`${styles.inputControl} ${styles.readonlyInput}`}>
                {usuario.rol === 'admin' ? '🛡️ Administrador' : '🎒 Coleccionista'}
              </div>
            </div>

            {/* Sección de seguridad — campos opcionales.
                Si se dejan vacíos, el backend no modifica la contraseña actual. */}
            <div className={styles.securitySection}>
              <h3>Security</h3>
              <div className={styles.inputGroup}>
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  name="new_password"
                  className={styles.inputControl}
                  value={formData.new_password}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Confirmar Contraseña</label>
                <input
                  type="password"
                  name="confirm_password"
                  className={styles.inputControl}
                  value={formData.confirm_password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => navigate("/Home")}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.saveBtn}>
                Guardar Cambios
              </button>
            </div>

            {/* Zona peligrosa separada visualmente del resto del formulario.
                type="button" evita que este botón dispare el onSubmit del form. */}
            <div className={styles.dangerZone}>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={handleDeleteAccount}
              >
                🗑️ Eliminar Cuenta Permanentemente
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;