// Página de inicio de sesión con temática visual dinámica (Magic/Pokémon).
// Maneja el formulario de login, llama a authService y redirige al Home.
//
// Componentes de React Router usados:
//   - useNavigate: hook para navegar a otra ruta programáticamente (desde código)
//   - Link: componente para navegar declarativamente (desde JSX, como <a> pero sin recargar)
import React, { useState } from 'react';
import styles from '../../assets/styles/Login.module.css';
import { Link, useNavigate } from 'react-router-dom';
import logoApp from '../../assets/images/Logo.png';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

function LoginPage() {
  // useNavigate devuelve una función que cambia la URL activa sin recargar la página.
  // Es el equivalente programático de hacer clic en un <Link>.
  const navigate = useNavigate();

  // activeTheme controla el fondo visual del panel izquierdo.
  // 'magic' | 'pokemon' es un union type — solo permite esos dos valores.
  // useState<'magic' | 'pokemon'>('magic') inicializa el tema en Magic.
  const [activeTheme, setActiveTheme] = useState<'magic' | 'pokemon'>('magic');

  // Estados controlados del formulario — cada input tiene su propio estado.
  // El patrón value + onChange convierte el input en un "controlled component":
  // React controla el valor mostrado (value={email}) y actualiza el estado
  // cada vez que el usuario escribe (onChange → setEmail).
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // token y user se importan del contexto pero no se usan en este componente.
  // ⚠️  Estos valores pueden eliminarse — son una importación sin uso
  // que probablemente quedó de una versión anterior del componente.
  const { token, user } = useAuth();

  // Alterna entre los dos temas visuales del panel izquierdo.
  // El operador ternario elige el tema contrario al actual.
  const handleToggle = () => {
    setActiveTheme(activeTheme === 'magic' ? 'pokemon' : 'magic');
  };

  // handleSubmit maneja el envío del formulario.
  // React.FormEvent es el tipo TypeScript del evento de submit de un <form>.
  // e.preventDefault() evita el comportamiento por defecto del navegador
  // (recargar la página al enviar un form), delegando el control a React.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // login() de authService hace POST /login al backend, recibe el JWT
      // y lo guarda en localStorage. Ver authService.ts para el detalle.
      await login(email, password);
      alert("¡Login exitoso!");

      // PASO 1: Cambiar la URL a /Home primero.
      // navigate() actualiza la URL en el HashRouter sin recargar la página.
      navigate("/Home");

      // PASO 2: Recargar la página 50ms después de navegar.
      // window.location.reload() fuerza una recarga completa del navegador,
      // lo que hace que AuthContext se monte de nuevo y lea el token
      // recién guardado en localStorage desde el useEffect inicial.
      //
      // ⚠️  Este setTimeout es un workaround necesario porque AuthContext
      // no expone una función login() que actualice el estado directamente.
      // Sin la recarga, React no re-renderiza con la sesión activa
      // porque localStorage no dispara eventos de React.
      // La solución limpia sería agregar login() a AuthContext
      // (sugerida al comentar AuthContext.tsx) para eliminar esta recarga:
      //   const { loginContext } = useAuth()
      //   await login(email, password)
      //   loginContext(token, userData)  // actualiza estado sin recargar
      //   navigate("/Home")
      setTimeout(() => {
        window.location.reload();
      }, 50);

    } catch (error) {
      // authService relanza el error de Axios si el backend devuelve 401.
      // alert() muestra un mensaje nativo del navegador — para mejor UX
      // considerar reemplazarlo con un mensaje de error inline en el formulario.
      alert("Credenciales incorrectas o error en el servidor");
      console.error(error);
    }
  };

  return (
    // Layout dividido en dos columnas: panel visual izquierdo + formulario derecho
    <div className={styles.splitLayout}>

      {/* Panel izquierdo: cambia de fondo según activeTheme.
          La clase dinámica combina siempre styles.sidenav con
          styles.bgMagic o styles.bgPokemon según el tema activo. */}
      <div className={`${styles.sidenav} ${activeTheme === 'magic' ? styles.bgMagic : styles.bgPokemon}`}>
        <div className={styles.loginMainText}>
          <img src={logoApp} alt="TCG Vault Logo" className={styles.logoPlaceholder} />
          <h2>TCG Vault<br /> Collection</h2>
          <p>Presume tus cartones brillosos</p>

          {/* Toggle Magic/Pokémon — un checkbox estilizado como switch.
              checked={activeTheme === 'pokemon'} sincroniza el estado visual
              del checkbox con activeTheme: si el tema es pokemon el switch
              está activado, si es magic está desactivado.
              onChange llama handleToggle para alternar el tema. */}
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

      {/* Panel derecho: formulario de login */}
      <div className={styles.main}>

        {/* Link de escape — visible antes de autenticarse para volver al Home público */}
        <Link to="/Home" className={styles.homeBtn}>
          Escapar al Home
        </Link>

        <div className={styles.loginFormContainer}>
          <div className={styles.formHeader}>
            <h3>¡Bienvenidos de vuelta!</h3>
            <p>Ingresa tus credenciales a continuación</p>
          </div>

          {/* onSubmit maneja el submit del form completo — más robusto que
              onClick en el botón porque también captura el Enter del teclado */}
          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>Correo Electrónico</label>
              {/* type="email" activa la validación nativa del navegador
                  (formato de email) antes de llegar al handleSubmit */}
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
              {/* type="password" enmascara el texto con puntos automáticamente */}
              <input
                type="password"
                className={styles.formControl}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* ⚠️  href="#" no hace nada — "Olvidaste tu contraseña"
                  es un placeholder visual sin funcionalidad implementada */}
              <a href="#" className={styles.forgotPassword}>¿Olvidaste tu contraseña?</a>
            </div>

            <div className={styles.buttonGroup}>
              {/* El tema activo cambia también el color del botón de submit
                  para mantener consistencia visual con el panel izquierdo */}
              <button
                type="submit"
                className={`${styles.submitBtn} ${activeTheme === 'magic' ? styles.submitMagic : styles.submitPokemon}`}
              >
                Iniciar Sesión
              </button>

              {/* ⚠️  Antipatrón: <Link> dentro de <button>.
                  El navegador renderiza un <a> dentro de un <button>,
                  lo cual es HTML inválido y puede causar comportamientos
                  inesperados. La corrección es usar solo el Link con estilos
                  de botón, o navegar con useNavigate() en el onClick:
                    <button type="button" onClick={() => navigate('/registro')}>
                      Registrarse
                    </button> */}
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