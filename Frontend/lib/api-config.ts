// Configuración de la API con soporte para variables de entorno

// URL base de la API - Primero intenta usar la variable de entorno, si no existe usa el valor por defecto
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.19.27:8023";

// Endpoints específicos
export const API_ENDPOINTS = {
  registros: `${API_BASE_URL}/api/registros`,
  dynamic: (resource: string) => `${API_BASE_URL}/api/dynamic/${resource}`,
  cadencias: `${API_BASE_URL}/api/cadencias`,
  auth: `${API_BASE_URL}/api/usuarios/auth/login`,
  
};

// Función auxiliar para construir URLs de la API
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}
