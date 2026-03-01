import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../assets/styles/Register.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  
  // Estado para los campos del formulario (Coinciden con tu BD)
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email: '',
    password: '',
    confirmar_password: ''
  });

  // Estado para mostrar errores
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación básica del frontend
    if (formData.password !== formData.confirmar_password) {
      setError('Las contraseñas no coinciden. Revisa e intenta de nuevo.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Aquí irá tu fetch() a tu API en Go (ej. POST /api/usuarios/registro)
    console.log('Enviando datos al backend:', {
      nombre_usuario: formData.nombre_usuario,
      email: formData.email,
      password: formData.password
    });

    // Simulamos que el registro fue exitoso y lo mandamos al login
    alert('¡Cuenta creada con éxito! Por favor inicia sesión.');
    navigate('/login');
  };

  return (
    <div className={styles.splitLayout}>
      
      {/* Lado Izquierdo: Branding Neutral (Morado) */}
      <div className={styles.brandingSide}>
        <h1 className={styles.brandTitle}>Cartones</h1>
        <p className={styles.brandSubtitle}>
          Únete a la comunidad de coleccionistas. Mantén tu colección segura, descubre nuevas cartas y negocia en el mercado global.
        </p>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          
          <div className={styles.formHeader}>
            <h2>Crear Cuenta</h2>
            <p>Ingresa tus datos para comenzar tu colección</p>
          </div>

          <form onSubmit={handleSubmit}>
            
            <div className={styles.inputGroup}>
              <label htmlFor="nombre_usuario">Nombre de Usuario</label>
              <input 
                type="text" 
                id="nombre_usuario"
                name="nombre_usuario"
                className={styles.inputControl} 
                placeholder="Ej. Coleccionista99"
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

            {/* Mensaje de error condicional */}
            {error && <p className={styles.errorText}>{error}</p>}

            <button type="submit" className={styles.submitBtn}>
              Registrarme
            </button>
          </form>

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