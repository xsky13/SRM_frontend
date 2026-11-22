import axios from 'axios';
import { ApiError } from '~/types/ApiError';
import { beginTrackedRequest } from '~/utils/requestProgress';
import type { ApartmentCreateInput, DepartamentoData, ApartmentWriteInput } from '~/models/Departamento';
import type { ImageData } from '~/types/images';
import type { Reserva } from '~/types/Reserva';
import type { ReservationDetail, ReservationListingDto } from '~/types/ReservationDetail';
import type { User, UserSearchDto } from '~/types/User';

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

export interface UpdateUserInput {
    firstName: string;
    lastName: string;
    telefono: string;
    email: string;
}

export enum AdminReservationDateFilter {
    None = 1,
    Past = 2,
    Future = 3,
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

const trackedAxiosRequests = new WeakMap<object, () => void>();

api.interceptors.request.use(config => {
    trackedAxiosRequests.set(config, beginTrackedRequest());
    return config;
});

function completeTrackedAxiosRequest(config: object | undefined): void {
    if (!config) return;
    trackedAxiosRequests.get(config)?.();
    trackedAxiosRequests.delete(config);
}

const ERROR_MESSAGES: Record<number, string> = {
    400: 'Ocurrió un error inesperado',
    401: 'No está autorizado para realizar esta acción',
    403: 'No está autorizado para realizar esta acción',
    404: 'El recurso que estaba buscando no se pudo encontrar',
    500: 'Ocurrió un error en el servidor',
};

api.interceptors.response.use(
    response => {
        completeTrackedAxiosRequest(response.config);
        return response;
    },
    error => {
        completeTrackedAxiosRequest(error.config);
        if (error.response) {
            const status = error.response.status;

            // mensajes mas especificos
            const backendMessage = error.response.data?.error ?? error.response.data?.message ?? error.response.data?.Error;
            const message = backendMessage || ERROR_MESSAGES[status] || ERROR_MESSAGES[400];

            const requestUrl = error.config?.url ?? "";
            const isExpectedUnauthenticatedRequest =
                /\/api\/user\/(me|login|register)\/?$/.test(requestUrl);
            if (status === 401 && !isExpectedUnauthenticatedRequest) {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }

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

export async function updateUser(user: UpdateUserInput): Promise<void> {
    await api.put('/api/user', user);
}

export async function deleteUser(): Promise<void> {
    await api.delete('/api/user');
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
    await api.post('/api/reservation/admin_create', reservation);
}

export async function getAdminReservations(
    pageNumber: number,
    pageSize: number,
    dateFilter: AdminReservationDateFilter = AdminReservationDateFilter.None,
): Promise<ReservationDetail[]> {
    const { data } = await api.get<ReservationDetail[] | { reservations: ReservationDetail[] }>('/api/reservation', {
        params: { PageNumber: pageNumber, PageSize: pageSize, DateFilter: dateFilter },
    });
    const reservations = Array.isArray(data) ? data : data.reservations;

    if (!Array.isArray(reservations)) {
        throw new Error('La respuesta del servidor no contiene una lista de reservas');
    }

    return reservations;
}

export async function getAdminReservationById(id: string): Promise<ReservationDetail> {
    const { data } = await api.get<ReservationDetail>(
        `/api/reservation/${encodeURIComponent(id)}`,
    );
    return data;
}

export async function getAdminReservationsByUser(
    userId: string,
    pageNumber: number,
    pageSize: number,
    dateFilter: AdminReservationDateFilter = AdminReservationDateFilter.None,
): Promise<ReservationDetail[]> {
    const { data } = await api.get<ReservationDetail[]>(
        `/api/reservation/admin/user/${encodeURIComponent(userId)}`,
        { params: { PageNumber: pageNumber, PageSize: pageSize, DateFilter: dateFilter } },
    );

    if (!Array.isArray(data)) {
        throw new Error('La respuesta del servidor no contiene una lista de reservas');
    }

    return data;
}

export async function getAdminReservationsByApartment(
    apartmentId: string,
    pageNumber: number,
    pageSize: number,
    dateFilter: AdminReservationDateFilter = AdminReservationDateFilter.None,
): Promise<ReservationDetail[]> {
    const { data } = await api.get<ReservationDetail[]>(
        `/api/reservation/admin/apartment/${encodeURIComponent(apartmentId)}`,
        { params: { PageNumber: pageNumber, PageSize: pageSize, DateFilter: dateFilter } },
    );

    if (!Array.isArray(data)) {
        throw new Error('La respuesta del servidor no contiene una lista de reservas');
    }

    return data;
}

export async function getAdminUsers(pageNumber: number, pageSize: number): Promise<User[]> {
    const { data } = await api.get<User[]>('/api/user/list', {
        params: { PageNumber: pageNumber, PageSize: pageSize },
    });

    if (!Array.isArray(data)) {
        throw new Error('La respuesta del servidor no contiene una lista de usuarios');
    }

    return data;
}

export async function getAdminUserById(id: string): Promise<UserSearchDto> {
    const { data } = await api.get<UserSearchDto>(
        `/api/user/${encodeURIComponent(id)}`,
    );
    return data;
}

export async function searchAdminUsers(
    pageNumber: number,
    pageSize: number,
    query: string,
): Promise<UserSearchDto[]> {
    const { data } = await api.get<UserSearchDto[]>('/api/user/search', {
        params: { PageNumber: pageNumber, PageSize: pageSize, query },
    });

    if (!Array.isArray(data)) {
        throw new Error('La respuesta del servidor no contiene una lista de usuarios');
    }

    return data;
}

export async function getAdminUserReservations(userId: string): Promise<ReservationListingDto[]> {
    const { data } = await api.get<ReservationListingDto[]>(
        `/api/reservation/user/${encodeURIComponent(userId)}`,
    );

    if (!Array.isArray(data)) {
        throw new Error('La respuesta del servidor no contiene una lista de reservas');
    }

    return data;
}

export async function cancelReservationAdmin(id: string): Promise<Reserva> {
    const { data } = await api.delete<Reserva>(
        `/api/reservation/${encodeURIComponent(id)}/admin`,
    );
    return data;
}

export async function cancelReservation(id: string): Promise<void> {
    await api.post(`/api/reservation/cancel/${encodeURIComponent(id)}`);
}

export async function addAdminReservationPayment(
    reservationId: string,
    amount: number,
): Promise<unknown> {
    const { data } = await api.post(
        `/api/reservation/${encodeURIComponent(reservationId)}/add_payment_admin`,
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
