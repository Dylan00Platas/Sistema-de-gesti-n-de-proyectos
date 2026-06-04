import { authService } from "./services/auth";

const API_BASE = 'http://gestiondeproyectos.local/wp-json/psm';

export const apiClient = {
    async get(endpoint) {
        const token = authService.getToken();
        
        console.log('Token enviado:', token);
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.log('Error de autenticación, redirigiendo...');
                authService.removeToken();
                window.location.href = '/login';
            }
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    },

    async post(endpoint, data) {
        const token = authService.getToken();
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                authService.removeToken();
                window.location.href = '/login';
            }
            throw new Error(responseData.message || 'Error en la petición');
        }

        return responseData;
    },

    async put(endpoint, data) {
        const token = authService.getToken();
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                authService.removeToken();
                window.location.href = '/login';
            }
            throw new Error(responseData.message || 'Error en la petición');
        }

        return responseData;
    },

    async delete(endpoint) {
        const token = authService.getToken();
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                authService.removeToken();
                window.location.href = '/login';
            }
            throw new Error(responseData.message || 'Error en la petición');
        }

        return responseData;
    },

    async uploadDocument(endpoint, formData) {
  const token = authService.getToken();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData
  });

  const responseData = await response.json();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      authService.removeToken();
      window.location.href = '/login';
    }
    throw new Error(responseData.message || 'Error al subir el documento');
  }

  return responseData;
},

async updateDocument(endpoint, formData) {
  const token = localStorage.getItem('auth_token');
  
  const id = endpoint.split('/').pop();
  
  const response = await fetch(`${API_BASE}/documents/${id}/update`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData
  });

  const responseData = await response.json();
  console.log('Respuesta de updateDocument:', responseData);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw new Error(responseData.message || 'Error al actualizar el documento');
  }

  return responseData;
},

async replaceDocument(endpoint, formData) {
  const token = localStorage.getItem('auth_token');
  
  console.log('Enviando a endpoint:', `${API_BASE}${endpoint}`);
  
  for (let pair of formData.entries()) {
    console.log('FormData entry:', pair[0], pair[1] instanceof File ? pair[1].name : pair[1]);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData
  });

  const responseData = await response.json();
  console.log('Respuesta de replaceDocument:', responseData);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw new Error(responseData.message || 'Error al reemplazar el documento');
  }

  return responseData;
}

    


};


