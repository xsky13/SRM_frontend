import { ReservationState } from "./Reserva";

export const RESERVATION_STATE_LABEL: Record<ReservationState, string> = {
  [ReservationState.NotConfirmed]: "No confirmada",
  [ReservationState.ConfirmedPaymentIncomplete]: "Confirmada (seña paga)",
  [ReservationState.ConfirmedPaymentComplete]: "Confirmada (pago completo)",
  [ReservationState.PaymentPending]: "Pago pendiente",
  [ReservationState.Cancelled]: "Cancelada",
};
