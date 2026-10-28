import type { ReservationState } from "~/types/Reserva";

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

export interface ReservationDetail {
  reservationId: string;
  checkInDate: string;
  checkOutDate: string;
  apartmentId: string;
  state: ReservationState;
  updatedAt: string;
  createdAt: string;
  appUserId: string;
  payments: PaymentDto[];
  apartment: ApartmentListingDto;
  fullCost: number;
}
