const API_URL = 'http://gestiondeproyectos.local/index.php?rest_route=/simple-jwt-login/v1';
const API_BASE = 'http://gestiondeproyectos.local/wp-json/psm';

export const authService = {
  async login(username, password) {
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      const token = data.data.jwt;
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      const userId = decoded.id || decoded.user_id;

      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      const userResponse = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        console.warn('No se pudo verificar el estado del usuario');
        return {
          data: {
            token: token,
            id: data.data.id,
            email: data.data.email,
            username: data.data.username,
            status: "0"
          }
        };
      }

      const userData = await userResponse.json();
      
      console.log('Datos del usuario:', userData);
      console.log('Status del usuario:', userData.status);
      console.log('Tipo de status:', typeof userData.status);

      const userStatus = String(userData.status);
      
      if (userStatus !== "0") {
        console.log('Usuario inactivo, status:', userStatus);
        throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
      }

      console.log('Usuario activo, permitiendo login');

      return {
        data: {
          token: token,
          id: data.data.id,
          email: data.data.email,
          username: data.data.username,
          display_name: userData.display_name,
          status: userData.status
        }
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  async validateToken(token) {
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      const userId = decoded.id || decoded.user_id;

      if (!userId) {
        return false;
      }

      const userResponse = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        return true;
      }

      const userData = await userResponse.json();

      const userStatus = String(userData.status);
      return userStatus === "0";
    } catch {
      return false;
    }
  },

  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  removeToken() {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};