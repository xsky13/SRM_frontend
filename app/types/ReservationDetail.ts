import type { ReservationState } from "~/types/Reserva";
import type { UserType } from "~/types/User";

export enum PaymentStatus {
  Pending = 1,
  Approved = 2,
  InProcess = 3,
  Rejected = 4,
  Cancelled = 5,
  Refunded = 6,
  ChargedBack = 7,
  InMediation = 8,
}

export interface PaymentDto {
  id: string;
  amount: number;
  isManual: boolean;
  isSign: boolean;
  isRefund: boolean;
  paymentDate: string;
  paymentStatus: PaymentStatus;
  reservationId: string;
  appUserId: string;
  ticketId: string | null;
}

export interface ApartmentListingDto {
  id: string;
  name: string;
  coverImgUrl: string;
  location: string;
  price: number;
  isDeleted?: boolean;
}

export interface UserListingDto {
  id: string;
  firstName?: string;
  name?: string;
  lastName: string;
  email: string;
  telefono: string;
  usertype: UserType;
  isDeleted?: boolean;
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

export interface ReservationListingDto {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  apartmentId: string;
  apartmentName: string;
  reservationState: ReservationState;

  isDeleted?: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}