import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/Perfil.module.css';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const PerfilPage = () => {
  const { user } = useAuth();
  const usuario = user;
  const navigate = useNavigate();
  const { logout, token } = useAuth();

  // 🔹 Estado del formulario (inicia vacío)
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email: '',
    foto_file: null as File | null,
    new_password: '',
    confirm_password: ''
  });

  const handleDeleteAccount = async () => {
  const confirmacion = window.confirm(
    "⚠️ Esta acción eliminará tu cuenta permanentemente.\n\n¿Estás seguro?"
  );

  if (!confirmacion) return;

  try {
    const res = await fetch("http://localhost:8080/usuarios", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Error al eliminar cuenta");
    }

    alert("Cuenta eliminada correctamente");

    logout();           // limpiar sesión
    navigate("/login"); // redirigir

  } catch (error) {
    console.error(error);
    alert("Ocurrió un error al eliminar la cuenta");
  }
};

  // 🔹 Preview de imagen
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 🔹 Cuando llega el usuario desde /me
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

  // 🔴 Manejo de carga inicial
  if (!usuario) return <p>Cargando perfil...</p>;

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      alert("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    const datosFinales = new FormData();
    datosFinales.append('nombre_usuario', formData.nombre_usuario);
    datosFinales.append('email', formData.email);

    if (formData.new_password) {
      datosFinales.append('password', formData.new_password);
    }

    if (formData.foto_file) {
      datosFinales.append('foto_perfil', formData.foto_file);
    }

    console.log("Enviando FormData a Go...");
    for (let [key, value] of datosFinales.entries()) {
      console.log(`${key}:`, value);
    }

    alert("¡Datos enviados con éxito!");

    setFormData(prev => ({
      ...prev,
      new_password: '',
      confirm_password: ''
    }));
  };

  const fechaFormateada = new Date(usuario.fecha_registro).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.perfilContainer}>
      <div className={styles.profileCard}>

        {/* Avatar */}
        <div className={styles.banner}>
          <div className={styles.avatarContainer}>
            {/* {previewImage ? (
              <img src={previewImage} alt="Avatar" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {usuario.nombre_usuario.charAt(0).toUpperCase()}
              </div>
            )} */}
            <img
              src={
                previewImage ||
                usuario.foto_perfil ||
                "https://i.pravatar.cc/150"
              }
              alt="Avatar"
              className={styles.avatarImage}
            />
          </div>
        </div>

        {/* Info */}
        <div className={styles.headerInfo}>
          <div className={styles.userInfo}>
            <h1>Actualizar Perfil</h1>
            <p>ID: #{usuario.id.toString().padStart(6, '0')}</p>
            <p>Miembro desde {fechaFormateada}</p>
          </div>
        </div>

        {/* Formulario */}
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
              <label>Rol</label>
              <div className={`${styles.inputControl} ${styles.readonlyInput}`}>
                {usuario.rol === 'admin' ? 'Administrador' : 'Coleccionista'}
              </div>
            </div>

            <div className={styles.securitySection}>
              <h3>Seguridad</h3>

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
              <button type="submit" className={styles.saveBtn}>
                Guardar Cambios
              </button>
            </div>

            <div className={styles.dangerZone}>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={handleDeleteAccount}
              >
                Eliminar cuenta
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default PerfilPage;