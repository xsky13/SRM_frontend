export const ReservationState = {
  NotConfirmed: 1,
  ConfirmedPaymentIncomplete: 2,
  ConfirmedPaymentComplete: 3,
  PaymentPending: 4,
  Cancelled: 5,
} as const;

export type ReservationStateValue = typeof ReservationState[keyof typeof ReservationState];

export const RESERVATION_STATE_LABEL: Record<ReservationStateValue, string> = {
  [ReservationState.NotConfirmed]: "No confirmada",
  [ReservationState.ConfirmedPaymentIncomplete]: "Confirmada (seña paga)",
  [ReservationState.ConfirmedPaymentComplete]: "Confirmada (pago completo)",
  [ReservationState.PaymentPending]: "Pago pendiente",
  [ReservationState.Cancelled]: "Cancelada",
};
