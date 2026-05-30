import React, { useState } from 'react';
import styles from '../../assets/styles/Login.module.css';
import { Link, useNavigate } from 'react-router-dom'; // 1. Importamos useNavigate
import logoApp from '../../assets/images/Logo.png';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext'; // 👈 ¡CORRECCIÓN: Añadimos este import clave!


function LoginPage() {
  const navigate = useNavigate(); // 2. Inicializamos el enrutador virtual
  const [activeTheme, setActiveTheme] = useState<'magic' | 'pokemon'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { token, user } = useAuth(); // Ahora React ya sabe perfectamente qué es useAuth

  const handleToggle = () => {
    setActiveTheme(activeTheme === 'magic' ? 'pokemon' : 'magic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Ejecutamos el login (guarda token y user en localStorage)
      await login(email, password); 
      alert("¡Login exitoso!");
      
      // 2. CORRECCIÓN CRÍTICA: Primero cambiamos la URL virtual a la página de inicio...
      navigate("/Home"); 
      
      // 3. ...y le damos un mini respiro de un milisegundo para asegurar que la URL cambió,
      // luego refrescamos para que el AuthContext asimile la sesión desde el Home.
      setTimeout(() => {
        window.location.reload();
      }, 50);

    } catch (error) {
      alert("Credenciales incorrectas o error en el servidor");
      console.error(error);
    }
  };

  return (
    <div className={styles.splitLayout}>
      
      {/* Lado Izquierdo - Panel dinámico con temática */}
      <div className={`${styles.sidenav} ${activeTheme === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
        <div className={styles.loginMainText}>
          <img src={logoApp} alt="TCG Vault Logo" className={styles.logoPlaceholder} />

          <h2>TCG Vault<br /> Collection</h2>
          <p>Presume tus cartones brillosos</p>

          <div className={styles.themeToggleContainer}>
            <span className={`${styles.themeLabel} ${activeTheme === 'magic' ? styles.activeText : ''}`}>
              Magic
            </span>

            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={activeTheme === 'pokemon'}
                onChange={handleToggle}
              />
              <span className={styles.slider}></span>
            </label>

            <span className={`${styles.themeLabel} ${activeTheme === 'pokemon' ? styles.activeText : ''}`}>
              Pokémon
            </span>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario de Login */}
      <div className={styles.main}>
        
        {/* Botón flotante para regresar al Inicio */}
        <Link to="/Home" className={styles.homeBtn}>
           Escapar al Home
        </Link>

        <div className={styles.loginFormContainer}>
          <div className={styles.formHeader}>
            <h3>¡Bienvenidos de vuelta!</h3>
            <p>Ingresa tus credenciales a continuación</p>
          </div>

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>Correo Electrónico</label>
              <input
                type="email"
                className={styles.formControl}
                placeholder="usuario@mail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Contraseña</label>
              <input
                type="password"
                className={styles.formControl}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <a href="#" className={styles.forgotPassword}>¿Olvidaste tu contraseña?</a>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={`${styles.submitBtn} ${activeTheme === 'magic' ? styles.submitMagic : styles.submitPokemon}`}
              >
                Iniciar Sesión
              </button>
              
              <button type="button" className={styles.registerBtn}>
                <Link to="/registro">Registrarse</Link>
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;