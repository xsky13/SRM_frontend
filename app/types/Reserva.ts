export enum ReservationState {
  NotConfirmed = 1,
  ConfirmedPaymentIncomplete = 2,
  ConfirmedPaymentComplete = 3,
  PaymentPending = 4,
  Cancelled = 5,
}

export interface Reserva {
	id: string;
	apartmentId: string;
	checkInDate: string;
  checkOutDate: string;
  reservationState: ReservationState;
}
