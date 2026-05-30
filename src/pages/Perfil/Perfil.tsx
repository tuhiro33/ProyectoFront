import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Perfil.module.css';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import apiClient from '../../api/apiClient'; // 1. Importamos tu apiClient personalizado

const PerfilPage = () => {
  const { user } = useAuth();
  const usuario = user;
  const navigate = useNavigate();
  const { logout } = useAuth(); // Quitamos 'token' de aquí ya que apiClient lo inyecta solo

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email: '',
    foto_file: null as File | null,
    new_password: '',
    confirm_password: ''
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setFormData(prev => ({
        ...prev,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email
      }));

      setPreviewImage(usuario.foto_perfil || null);
    }
  }, [usuario]);

  const handleDeleteAccount = async () => {
    const confirmacion = window.confirm(
      "⚠️ Esta acción eliminará tu cuenta permanentemente.\n\n¿Estás seguro?"
    );

    if (!confirmacion) return;

    try {
      // ================= CORRECCIÓN 1: ELIMINAR CUENTA =================
      await apiClient.delete("/usuarios");

      alert("Cuenta completa e irreversiblemente eliminada.");
      logout();
      navigate("/login");

    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al eliminar la cuenta");
    }
  };

  if (!usuario) return <div className={styles.loadingFull}>Cargando perfil del santuario...</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, foto_file: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
      let fotoPerfil = usuario.foto_perfil;

      if (formData.foto_file) {
        const uploadData = new FormData();
        uploadData.append("image", formData.foto_file);

        // ================= CORRECCIÓN 2: SUBIR IMAGEN DE PERFIL =================
        // Forzamos el encabezado correcto para saltarnos el JSON por defecto
        const uploadRes = await apiClient.post("/upload", uploadData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        fotoPerfil = uploadRes.data.url;
      }

      const body: Record<string, string> = {
        nombre_usuario: formData.nombre_usuario,
        email: formData.email,
        foto_perfil: fotoPerfil
      };

      if (formData.new_password) {
        body.password = formData.new_password;
      }

      // ================= CORRECCIÓN 3: ACTUALIZAR DATOS (PUT) =================
      await apiClient.put("/usuarios", body);

      alert("¡Perfil actualizado correctamente!");

      setFormData(prev => ({
        ...prev,
        new_password: '',
        confirm_password: '',
        foto_file: null
      }));

    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar los cambios");
    }
  };

  const fechaFormateada = new Date(usuario.fecha_registro).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.perfilContainer}>
      <div className={styles.profileCard}>

        {/* Encabezado del Perfil */}
        <div className={styles.banner}>
          <div className={styles.avatarContainer}>
            <img
              src={previewImage || usuario.foto_perfil || "https://i.pravatar.cc/150"}
              alt="Avatar del Coleccionista"
              className={styles.avatarImage}
            />
          </div>
        </div>

        {/* Datos Base */}
        <div className={styles.headerInfo}>
          <div className={styles.userInfo}>
            <h1>Actualizar Perfil</h1>
            <p>ID: #{usuario.id.toString().padStart(6, '0')}</p>
            <p>Miembro desde {fechaFormateada}</p>
          </div>
        </div>

        {/* Campos Editables */}
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
              <input
                type="file"
                accept="image/*"
                className={styles.inputControl}
                onChange={handleFileChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Rol asignado</label>
              <div className={`${styles.inputControl} ${styles.readonlyInput}`}>
                {usuario.rol === 'admin' ? '🛡️ Administrador' : '🎒 Coleccionista'}
              </div>
            </div>

            {/* Bloque de Contraseña */}
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

            {/* Acciones principales */}
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

            {/* Zona Peligrosa */}
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