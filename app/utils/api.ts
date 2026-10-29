import axios from 'axios';
import { ApiError } from '~/types/ApiError';
import type { ApartmentCreateInput, DepartamentoData, ApartmentWriteInput } from '~/models/Departamento';
import type { ImageData } from '~/types/images';
import type { Reserva } from '~/types/Reserva';

export interface AdminCreateReservationInput {
    apartmentId: string;
    startDate: string;
    endDate: string;
    isRegisteredUser: boolean;
    userId: string | null;
    guestUserInfo: {
        firstName: string;
        lastName: string;
        telefono: string;
        email: string;
    } | null;
}

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
            //
            console.log(error.response)

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

export async function getApartments(): Promise<DepartamentoData[]> {
    const { data } = await api.get<DepartamentoData[]>('/api/apartment');
    return data;
}

export function resolveImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) return url;
    return new URL(url, `${baseUrl.replace(/\/+$/, '')}/`).toString();
}

export async function getApartmentById(id: string): Promise<DepartamentoData> {
    const { data } = await api.get<DepartamentoData>(`/api/apartment/${id}`);
    return data;
}

export async function createApartment(apartment: ApartmentCreateInput): Promise<DepartamentoData> {
    const formData = new FormData();
    formData.append('Name', apartment.name);
    formData.append('Description', apartment.description);
    formData.append('Price', String(apartment.price));
    formData.append('Location', apartment.location);
    apartment.images.forEach((image) => formData.append('Images', image));
    formData.append('Latitude', String(apartment.latitude));
    formData.append('Longitude', String(apartment.longitude));

    const { data } = await api.post<DepartamentoData>(
        '/api/apartment',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
}

export async function updateApartment(
    id: string,
    apartment: Partial<ApartmentWriteInput>,
): Promise<DepartamentoData> {
    const { data } = await api.put<DepartamentoData>(`/api/apartment/${id}`, apartment);
    return data;
}

export async function deleteApartment(id: string): Promise<void> {
    await api.delete(`/api/apartment/${id}`);
}

export async function createAdminReservation(
    reservation: AdminCreateReservationInput,
): Promise<void> {
    await api.post('/api/booking/admin_create', reservation);
}

export async function getAdminReservations(): Promise<Reserva[]> {
    const { data } = await api.get<Reserva[] | { reservations: Reserva[] }>('/api/booking');
    const reservations = Array.isArray(data) ? data : data.reservations;

    if (!Array.isArray(reservations)) {
        throw new Error('La respuesta del servidor no contiene una lista de reservas');
    }

    return reservations;
}

export async function cancelReservationAdmin(id: string): Promise<Reserva> {
    const { data } = await api.delete<Reserva>(
        `/api/booking/${encodeURIComponent(id)}/admin`,
    );
    return data;
}

export async function addAdminReservationPayment(
    reservationId: string,
    amount: number,
): Promise<unknown> {
    const { data } = await api.post(
        `/api/booking/${encodeURIComponent(reservationId)}/add_payment_admin`,
        { amount },
    );
    return data;
}

export async function addApartmentImages(
    id: string,
    images: File[],
): Promise<ImageData[]> {
    const formData = new FormData();
    images.forEach((image) => formData.append('Images', image));
    const { data } = await api.post<ImageData[]>(
        `/api/apartment/${id}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
}

export async function removeImagesFromApartment(
    id: string,
    imageIds: string[],
): Promise<void> {
    await api.delete(`/api/apartment/${id}/images`, { data: { imageIds: imageIds } });
}

export async function deleteApartmentImages(id: string): Promise<void> {
    await api.delete(`/api/apartment/${id}/images`);
}

export default api;
