import { useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';


function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMensaje("");

    console.log('Login intent:', formData);

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        setMensaje("¡Login exitoso! Redirigiendo...");
        setTimeout(() => {
          navigate('/panorama');
        }, 1000);
      } else {
        setError(result.error || "Credenciales incorrectas");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inicio-sesion-page">
      <div className="login-container">
        <h2>Sistema de gestión</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Usuario o Email"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="username"
          />

          <div className="password-input-container-login">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
              className="password-input-login"
              disabled={loading}
              autoComplete="current-password"
            />

            <button
              type="button"
              className="password-toggle-login"
              onClick={togglePassword}
              tabIndex={-1}
              disabled={loading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Iniciando sesión...' : 'Entrar'}
          </button>
        </form>

        {mensaje && <div className="alerta exito">{mensaje}</div>}
        {error && <div className="alerta error">{error}</div>}

        <div className="copyright">
          © CFE 2026
        </div>
      </div>
    </div>
  );
}

export default Login;