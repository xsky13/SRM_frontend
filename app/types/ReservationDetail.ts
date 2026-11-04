import type { ReservationState } from "~/types/Reserva";
import type { UserType } from "~/types/User";

export interface PaymentDto {
  id: string;
  amount: number;
  isManual: boolean;
  isSign: boolean;
  paymentDate: string;
  paymentStatus: number;
  reservationId: string;
  appUserId: string;
  ticketId: string;
}

export interface ApartmentListingDto {
  id: string;
  name: string;
  coverImgUrl: string;
  location: string;
  price: number;
}

export interface UserListingDto {
  id: string;
  firstName?: string;
  name?: string;
  lastName: string;
  email: string;
  telefono: string;
  usertype: UserType;
}

export interface ReservationDetail {
  reservationId: string;
  checkInDate: string;
  checkOutDate: string;
  apartmentId: string;
  state: ReservationState;
  updatedAt: string;
  createdAt: string;
  appUserId: string;
  appUser: UserListingDto | null;
  payments: PaymentDto[];
  apartment: ApartmentListingDto | null;
  fullCost: number;
}
