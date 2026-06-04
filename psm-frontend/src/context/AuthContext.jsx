
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(authService.getToken());

  useEffect(() => {
    const validateStoredToken = async () => {
      const storedToken = authService.getToken();
      
      if (storedToken) {
        try {
          console.log('Validando token almacenado...');
          
          // Decodificar token para obtener información básica
          const base64Url = storedToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decoded = JSON.parse(jsonPayload);
          
          // Validar token con el servidor (esto ya verifica el status)
          const isValid = await authService.validateToken(storedToken);
          
          if (isValid) {
            console.log('Token válido, usuario activo');
            setUser({
              id: decoded.id || decoded.user_id,
              username: decoded.username || decoded.user_nicename,
            });
            setToken(storedToken);
          } else {
            console.log('Token inválido o usuario inactivo');
            authService.removeToken();
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error al validar token:', error);
          authService.removeToken();
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('No hay token almacenado');
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    validateStoredToken();
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Intentando login para:', username);
      const response = await authService.login(username, password);
      
      if (response && response.data && response.data.token) {
        const token = response.data.token;
        console.log('Login exitoso, token obtenido');
        
        authService.setToken(token);
        setToken(token);
        
        setUser({
          id: response.data.id,
          username: response.data.username,
          display_name: response.data.display_name
        });
        
        return { success: true };
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error en login:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const logout = () => {
    console.log('Cerrando sesión');
    authService.removeToken();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};