import axios from 'axios';
import { ApiError } from '~/types/ApiError';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

const ERROR_MESSAGES: Record<number, string> = {
    400: 'Ocurrió un error inesperado',
    401: 'No está autorizado para realizar esta acción',
    403: 'No está autorizado para realizar esta acción',
    404: 'El recurso que estaba buscando no se pudo encontrar',
    500: 'Ocurrió un error en el servidor',
};

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            const status = error.response.status;

            // mensajes mas especificos
        
            const backendMessage = error.response.data?.error ?? error.response.data?.message ?? error.response.data?.Error;
            const message = backendMessage || ERROR_MESSAGES[status] || ERROR_MESSAGES[400];

            /** CUANDO TENGAMOS AUTH, DESCOMENTAR */
            /** SI EL ERROR RETORNADO ES 401 (no hay token) DESAUTENTICAR */
            // if (status === 401) {
            //     window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            // }

            return Promise.reject(new ApiError(message, status, error.response.data?.code));
        }

        if (error.request) {
            return Promise.reject(new ApiError('No se pudo conectar con el servidor', 0));
        }

        return Promise.reject(new ApiError('Error desconocido al realizar la solicitud', 0));
    }
);
export default api;
