import React, { useState } from 'react';
import styles from '../../assets/styles/Perfil.module.css';

// 1. Interfaz basada exactamente en tu modelo GORM "Usuario"
interface UsuarioPerfil {
  id: number;
  rol_id: number;
  nombre_usuario: string;
  email: string;
  fecha_registro: string;
  foto_perfil: string | null; 
}

const PerfilPage = () => {
  const [usuario, setUsuario] = useState<UsuarioPerfil>({
    id: 1,
    rol_id: 2, 
    nombre_usuario: "ColeccionistaPro99",
    email: "correo@yahoo.com",
    fecha_registro: "2025-10-15T08:00:00Z", 
    foto_perfil: "" 
  });

  // Estado temporal para el formulario. Agregamos "foto_file" para guardar el archivo real.
  const [formData, setFormData] = useState({
    nombre_usuario: usuario.nombre_usuario,
    email: usuario.email,
    foto_file: null as File | null, 
    new_password: '', 
    confirm_password: '' 
  });

  // Estado exclusivo para la vista previa de la imagen en pantalla
  const [previewImage, setPreviewImage] = useState<string | null>(usuario.foto_perfil);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // NUEVO: Función especial para manejar la subida del archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // 1. Guardamos el archivo físico en el estado para enviarlo a Go
      setFormData(prev => ({ ...prev, foto_file: file }));
      
      // 2. Creamos una URL temporal para que el usuario vea cómo quedará su avatar
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      alert("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    // Como vamos a enviar un archivo, ya no usamos un JSON normal, sino FormData
    const datosFinales = new FormData();
    datosFinales.append('nombre_usuario', formData.nombre_usuario);
    datosFinales.append('email', formData.email);
    
    if (formData.new_password) {
      datosFinales.append('password', formData.new_password);
    }

    // Si el usuario subió un archivo nuevo, lo metemos en el paquete
    if (formData.foto_file) {
      datosFinales.append('foto_perfil', formData.foto_file);
    }

    // Aquí iría tu fetch PUT/PATCH a tu API de Go.
    // Go tomará este 'foto_perfil' y se encargará de subirlo al FTP.
    console.log("Enviando FormData a Go...");
    for (let [key, value] of datosFinales.entries()) {
      console.log(`${key}:`, value);
    }
    
    alert("¡Datos enviados con éxito!");
    
    // Limpiamos los campos de contraseña
    setFormData(prev => ({...prev, new_password: '', confirm_password: ''}));
  };

  const fechaFormateada = new Date(usuario.fecha_registro).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className={styles.perfilContainer}>
      
      <div className={styles.profileCard}>
        
        {/* Banner y Avatar Dinámico (Ahora usa previewImage) */}
        <div className={styles.banner}>
          <div className={styles.avatarContainer}>
            {previewImage ? (
              <img src={previewImage} alt="Avatar" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {usuario.nombre_usuario.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.userInfo}>
            <h1>Actualizar Perfil</h1>
            <p>ID: #{usuario.id.toString().padStart(6, '0')}</p>
            <p>Miembro desde {fechaFormateada}</p>
          </div>
        </div>

        <div className={styles.formSection}>
          <form onSubmit={handleSave}>
            
            <div className={styles.inputGroup}>
              <label htmlFor="nombre_usuario">Nombre de Usuario</label>
              <input 
                type="text" 
                id="nombre_usuario"
                name="nombre_usuario"
                className={styles.inputControl}
                value={formData.nombre_usuario}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* NUEVO: Input tipo archivo para la imagen */}
            <div className={styles.inputGroup}>
              <label htmlFor="foto_perfil">Subir Nueva Foto de Perfil</label>
              <input 
                type="file" 
                id="foto_perfil"
                name="foto_perfil"
                accept="image/*"
                className={styles.inputControl}
                onChange={handleFileChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Rol de Usuario (Solo lectura)</label>
              <div className={styles.inputControl + ' ' + styles.readonlyInput}>
                {usuario.rol_id === 1 ? 'Administrador' : 'Coleccionista'}
              </div>
            </div>

            <div className={styles.securitySection}>
              <h3>Seguridad (Opcional)</h3>
              
              <div className={styles.inputGroup}>
                <label htmlFor="new_password">Nueva Contraseña (Dejar en blanco si no deseas cambiarla)</label>
                <input 
                  type="password" 
                  id="new_password"
                  name="new_password"
                  className={styles.inputControl}
                  placeholder="••••••••••"
                  value={formData.new_password}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirm_password">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  id="confirm_password"
                  name="confirmar_password"
                  className={styles.inputControl}
                  placeholder="••••••••••"
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

          </form>
        </div>

      </div>
    </div>
  );
};

export default PerfilPage;