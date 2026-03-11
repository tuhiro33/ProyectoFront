import React, { useState } from 'react';
import styles from '../../assets/styles/Login.module.css';
import { Link, useLocation } from 'react-router-dom';
import logoApp from '../../assets/images/Logo.png';
import { login } from '../../services/authService';


function LoginPage() {
  const [activeTheme, setActiveTheme] = useState<'magic' | 'pokemon'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleToggle = () => {
    setActiveTheme(activeTheme === 'magic' ? 'pokemon' : 'magic');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      alert("Login exitoso");

      window.location.href = "/";

    } catch (error) {
      alert("Credenciales incorrectas");
      console.error(error);
    }
  };

  return (


    <div className={styles.splitLayout}>
      {/* Aqui empieza el main izquierda */}
      <div className={`${styles.sidenav} ${activeTheme === 'magic' ? 'is-magic' : 'is-pokemon'}`}>
        <div className={styles.loginMainText}>
          <img src={logoApp} alt="el logo deberia ir... aqui?" className={styles.logoPlaceholder} />

          <h2>Guarda Cartas<br /> (Temporal)</h2>
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

      {/* Aqui empieza el main derecha */}
      <div className={styles.main}>
        <div className={styles.loginFormContainer}>

          <div className={styles.formHeader}>
            <h3>Bienvenidos!!!</h3>
            <p>Ingresa a continuacion</p>
          </div>

          <form className={styles.loginForm} onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Ejemplo: usuario@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <a href="#" className={styles.forgotPassword}>¿Olvidaste tu contraseña?</a>
            </div>

            <div className="button-group">

              <button
                type="submit"
                className={`btn-primary ${activeTheme === 'magic' ? 'is-magic' : 'is-pokemon'}`}
              >
                Iniciar Sesión
              </button>
              <button type="button" className="btn-secondary"><Link to="/registro">Registrarse</Link></button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;