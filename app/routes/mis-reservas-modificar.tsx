import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleCheck, CircleX, CreditCard } from "lucide-react";
import api from "~/utils/api";
import { useAuthentication } from "~/components/NavegacionUsuario";
import { ReservationState, type Reserva } from "~/types/Reserva";
import type { ReservationDetail } from "~/types/ReservationDetail";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : parseDate(value);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
  }).format(date);
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string): Date {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function calendarDayDifference(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

function isSelectableDay(day: Date): boolean {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const normalizedDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return normalizedDay.getTime() >= normalizedToday.getTime();
}

function isBetween(day: Date, start?: Date, end?: Date): boolean {
  if (!start || !end) return false;
  return day.getTime() >= Math.min(start.getTime(), end.getTime()) && day.getTime() <= Math.max(start.getTime(), end.getTime());
}

// checkOutDate is the final night; count both the start and end dates.
function nightsBetween(start: Date, end: Date): number {
  const diff = Math.abs(calendarDayDifference(start, end));
  return Math.max(diff + 1, 1);
}

function getReservationStateLabel(state: ReservationState) {
  return RESERVATION_STATE_LABEL[state] ?? "Desconocido";
}

function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as any)?.response?.data;
  if (typeof data === "string" && data) return data;
  return data?.message ?? data?.Message ?? data?.title ?? (error instanceof Error ? error.message : fallback);
}

export function meta() {
  return [{ title: "Modificar reserva | Reservas Moreno" }];
}

export default function MisReservasModificarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authQuery = useAuthentication();

  const reservaQuery = useQuery<ReservationDetail>({
    queryKey: ["my-reservation-detail", id],
    queryFn: async () => (await api.get(`/api/reservation/${id}`)).data,
    enabled: Boolean(authQuery.data) && Boolean(id),
    meta: { silent: true },
  });

  const availabilityQuery = useQuery<Reserva[]>({
    queryKey: ["reservations", reservaQuery.data?.apartmentId],
    queryFn: async () => {
      const { data } = await api.get<Reserva[] | { reservations: Reserva[] }>(
        `/api/reservation/apartment/${reservaQuery.data?.apartmentId}`,
      );
      return Array.isArray(data) ? data : data.reservations;
    },
    enabled: Boolean(reservaQuery.data?.apartmentId),
    meta: { errorMessage: "No pudimos cargar la disponibilidad de este departamento" },
  });

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<Date | undefined>();
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<"dates" | "payment" | "success">("dates");
  const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("full");
  const [showCardForm, setShowCardForm] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    initMercadoPago("TEST-440e66b5-54b5-49f2-9930-3dd2e1baed8e");
  }, []);

  useEffect(() => {
    if (!reservaQuery.data) return;
    const res = reservaQuery.data;
    setRangeStart(parseDate(res.checkInDate));
    setRangeEnd(parseDate(res.checkOutDate));
  }, [reservaQuery.data]);

  const today = new Date();
  const firstAllowedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastAllowedMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(2024, 0, index + 1);
    return weekdayFormatter.format(day).replace(".", "").slice(0, 2);
  });
  const days = Array.from({ length: offset + daysInMonth }, (_, index) =>
    index < offset ? null : new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
  );

  const selectedNights = rangeStart && rangeEnd
    ? Math.abs(calendarDayDifference(rangeStart, rangeEnd)) + 1
    : 0;

  const originalTotal = reservaQuery.data ? reservaQuery.data.fullCost : 0;

  const newTotal = rangeStart && rangeEnd
    ? selectedNights * (reservaQuery.data?.apartment?.price ?? 0)
    : 0;

  const delta = originalTotal == null ? 0 : Math.max(0, newTotal - originalTotal);
  const refund = originalTotal == null ? 0 : Math.max(0, originalTotal - newTotal);

  const formatPrice = (value: number) => `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

  const normalizeRange = (start: Date, end: Date) => {
    // TODO(G10): extraer a hook compartido
    return start.getTime() <= end.getTime()
      ? { startDate: start, endDate: end }
      : { startDate: end, endDate: start };
  };

  // ---------------------------------------------------------------------------
  // Flujo de validación (ver diagrama "Validaciones de reserva básica")
  //
  // 1. ¿Cuánto tiempo tiene a comparación de la reserva actual?
  //    - Menos (o igual)  -> PUT /api/reservation/{id}
  //    - Más tiempo       -> 2. ¿El usuario hizo al menos un pago?
  //        - No (NotConfirmed)  -> PUT /api/reservation/{id}
  //        - Sí (confirmada)    -> PUT /api/reservation/{id}/full  (con objeto de MP)
  // ---------------------------------------------------------------------------
  const reservation = reservaQuery.data;

  const hasPaid =
    reservation?.state === ReservationState.ConfirmedPaymentIncomplete ||
    reservation?.state === ReservationState.ConfirmedPaymentComplete;

  const oldNights = reservation
    ? nightsBetween(parseDate(reservation.checkInDate), parseDate(reservation.checkOutDate))
    : 0;

  const newNights = selectedNights;

  const hasMoreTime = newNights > oldNights;

  // Solo se paga cuando hay más tiempo Y la reserva ya tiene al menos un pago
  const requiresPayment = hasMoreTime && hasPaid;

  const datesUnchanged = Boolean(
    reservation &&
      rangeStart &&
      rangeEnd &&
      dateKey(normalizeRange(rangeStart, rangeEnd).startDate) === dateKey(parseDate(reservation.checkInDate)) &&
      dateKey(normalizeRange(rangeStart, rangeEnd).endDate) === dateKey(parseDate(reservation.checkOutDate)),
  );

  const buildDatesBody = () => {
    if (!rangeStart || !rangeEnd) throw new Error("Faltan datos de la reserva.");
    const { startDate, endDate } = normalizeRange(rangeStart, rangeEnd);
    return {
      newStartDate: `${dateKey(startDate)}T00:00:00Z`,
      newEndDate: `${dateKey(endDate)}T00:00:00Z`,
    };
  };

  const onEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["reservations", reservation?.apartmentId] });
    queryClient.invalidateQueries({ queryKey: ["my-reservation-detail", id] });
    setStep("success");
  };

  // Caso sin pago: PUT /api/reservation/{reservationId}
  const editWithoutPaymentMutation = useMutation({
    mutationFn: async () => (await api.put(`/api/reservation/${id}`, buildDatesBody())).data,
    onMutate: () => setPaymentError(null),
    onSuccess: (data) => {
      setUserEmail(data?.email ?? null);
      onEditSuccess();
    },
    onError: (error) => setPaymentError(getErrorMessage(error, "No se pudo modificar la reserva.")),
  });

  const sameId = (a?: string | null, b?: string | null) =>
  Boolean(a && b) && String(a).toLowerCase() === String(b).toLowerCase();

const isCurrentReservation = (r: Reserva) => {
  const candidates = [r.id, (r as any).reservationId];
  const mine = [id, reservation?.reservationId, (reservation as any)?.id];
  return candidates.some((c) => mine.some((m) => sameId(c, m)));
};

const isReservedDay = (day: Date) => {
  const current = dateKey(day);
  return (availabilityQuery.data ?? []).some((r) => {
    if (isCurrentReservation(r)) return false;
    const start = dateKey(parseDate(r.checkInDate));
    const end = dateKey(parseDate(r.checkOutDate));
    return current >= start && current <= end && (
      r.reservationState === ReservationState.ConfirmedPaymentIncomplete ||
      r.reservationState === ReservationState.ConfirmedPaymentComplete ||
      r.reservationState === ReservationState.PaymentPending
    );
  });
};

  const rangeHasReservation = (start: Date, end: Date) => {
    const { startDate, endDate } = normalizeRange(start, end);
    for (const day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      if (isReservedDay(day)) return true;
    }
    return false;
  };

  const availabilityUnavailable = availabilityQuery.isPending || availabilityQuery.isError;

  const isCalendarConflict = (day: Date) => isReservedDay(day);

  const handleDayPointerDown = (day: Date) => {
    if (availabilityUnavailable || isCalendarConflict(day) || !isSelectableDay(day)) return;
    setIsDragging(true);
    if (!rangeStart || rangeEnd) {
      setRangeStart(day);
      setRangeEnd(undefined);
      return;
    }
    if (day.getTime() < rangeStart.getTime()) {
      if (rangeHasReservation(day, rangeStart)) return;
      setRangeEnd(rangeStart);
      setRangeStart(day);
      return;
    }
    if (rangeHasReservation(rangeStart, day)) return;
    setRangeEnd(day);
  };

  const handleDayPointerUp = (day: Date) => {
    setIsDragging(false);
    if (availabilityUnavailable || !rangeStart || isCalendarConflict(day) || !isSelectableDay(day)) return;
    if (day.getTime() < rangeStart.getTime()) {
      if (rangeHasReservation(day, rangeStart)) return;
      setRangeEnd(rangeStart);
      setRangeStart(day);
    } else {
      if (rangeHasReservation(rangeStart, day)) return;
      setRangeEnd(day);
    }
  };

  // Botón "continuar" del paso de fechas: decide a dónde ir según el flujo
  const handleContinue = () => {
    if (!rangeStart || !rangeEnd) return;
    if (availabilityUnavailable || rangeHasReservation(rangeStart, rangeEnd)) return;
    setPaymentError(null);

    if (requiresPayment) {
      setStep("payment");
      return;
    }
    editWithoutPaymentMutation.mutate();
  };

  // Caso con pago: PUT /api/reservation/{reservationId}/full con el objeto de MP
  async function handlePaymentSubmit(formData: any): Promise<void> {
    if (!rangeStart || !rangeEnd || !reservation?.apartmentId) {
      throw new Error("Faltan datos de la reserva.");
    }
    if (availabilityUnavailable) {
      throw new Error("No se pudo verificar la disponibilidad. Intentá nuevamente.");
    }
    if (rangeHasReservation(rangeStart, rangeEnd)) {
      throw new Error("Las fechas seleccionadas ya no están disponibles.");
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // EditOwnReservationRequestPaymentDto = MpPaymentObject + NewStartDate + NewEndDate
      const { data } = await api.put(`/api/reservation/${id}/full`, {
        ...formData, // token, payment_method_id, installments, transaction_amount, payer
        ...buildDatesBody(),
        reservationId: id,
      });
      setUserEmail(data?.email ?? null);
      onEditSuccess();
    } catch (error) {
      const message = getErrorMessage(error, "Error al procesar el pago.");
      setPaymentError(message);
      throw new Error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const paymentAmount = paymentOption === "deposit" ? Math.max(0, delta) : Math.max(0, newTotal);

  if (authQuery.isPending) {
    return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Verificando sesión...</main>;
  }

  if (!authQuery.data) {
    return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Necesitás iniciar sesión para modificar la reserva.</main>;
  }

  if (reservaQuery.isPending) {
    return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Cargando reserva...</main>;
  }

  if (!reservaQuery.data) {
    return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Reserva no encontrada.</main>;
  }

  const continueLabel = !rangeStart || !rangeEnd
    ? "Seleccioná fechas"
    : editWithoutPaymentMutation.isPending
      ? "Guardando..."
      : requiresPayment
        ? `Continuar al pago (${selectedNights} ${selectedNights === 1 ? "noche" : "noches"})`
        : `Confirmar cambio (${selectedNights} ${selectedNights === 1 ? "noche" : "noches"})`;
console.log(availabilityQuery.data, id, reservation)
  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        <Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">
          reservas<span className="text-[#e28b68]">moreno</span>
        </Link>
        <Link to="/reservas" className="ui-link">Volver a reservas</Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">Modificar reserva</p>
            <h1 className="font-serif text-5xl tracking-tighter text-[#385347]">{reservaQuery.data.apartment?.name ?? "Departamento no disponible"}</h1>
          </div>
          <span className="rounded-full border border-[#d7d1c7] bg-[#edf2e8] px-2.5 py-1 text-xs font-semibold text-[#385347]">
            {getReservationStateLabel(reservaQuery.data.state)}
          </span>
        </div>

        <div className="mb-6 rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-4 text-sm text-[#68716a]">
          <p>
            Reserva actual: {formatDate(reservaQuery.data.checkInDate)} — {formatDate(reservaQuery.data.checkOutDate)} (salida {formatDate(addCalendarDays(parseDate(reservaQuery.data.checkOutDate), 1))})
          </p>
          <p className="mt-1">Monto actual: {originalTotal == null ? "Precio a confirmar" : formatPrice(originalTotal)}</p>
          {/* TODO(G1+G3): habilitar la comparación de montos cuando el backend exponga el total */}
        </div>

        {step === "dates" ? (
          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-4 shadow-sm">
            <p className="mb-3 rounded-md bg-[#edf2e8] p-3 text-sm text-[#385347]">
              Seleccioná las noches de alojamiento. El primer día es el ingreso y el checkout es la mañana siguiente a la última noche seleccionada.
            </p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={month.getTime() <= firstAllowedMonth.getTime()}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="ui-icon-button p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <strong className="min-w-32 text-center text-sm capitalize text-[#385347]">{monthFormatter.format(month)}</strong>
                <button
                  type="button"
                  disabled={month.getTime() >= lastAllowedMonth.getTime()}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="ui-icon-button p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {availabilityQuery.isPending && (
              <p className="mt-3 text-sm text-[#68716a]" role="status">Cargando disponibilidad...</p>
            )}
            {availabilityQuery.isError && (
              <p className="mt-3 text-sm text-[#b74f3d]" role="alert">
                No se pudo cargar la disponibilidad. {availabilityQuery.error instanceof Error ? availabilityQuery.error.message : "Intentá nuevamente."}
              </p>
            )}

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-[#68716a]" onPointerUp={() => setIsDragging(false)} onPointerCancel={() => setIsDragging(false)}>
              {weekdays.map((day) => (
                <div key={day} className="py-1 font-bold uppercase">{day}</div>
              ))}
              {days.map((day, index) =>
                day ? (() => {
                  const selected = isBetween(day, rangeStart, rangeEnd) || Boolean(rangeStart && dateKey(day) === dateKey(rangeStart));
                  const conflict = isCalendarConflict(day);
                  return (
                    <button
                      key={dateKey(day)}
                      type="button"
                      disabled={availabilityUnavailable || conflict || !isSelectableDay(day)}
                      onPointerDown={() => !conflict && handleDayPointerDown(day)}
                      onPointerEnter={() =>
                        isDragging &&
                        !availabilityUnavailable &&
                        !conflict &&
                        rangeStart &&
                        !rangeHasReservation(rangeStart, day) &&
                        setRangeEnd(day)
                      }
                      onPointerUp={() => !conflict && handleDayPointerUp(day)}
                      className={`aspect-square rounded-sm border border-transparent p-0.5 transition ${
                        availabilityUnavailable
                          ? "cursor-wait bg-[#f0efe9] text-[#a6a29a]"
                          : conflict
                          ? "cursor-not-allowed bg-[#f3ddd3] text-[#a85c43]"
                          : !isSelectableDay(day)
                            ? "cursor-not-allowed bg-[#f0efe9] text-[#a6a29a]"
                            : selected
                              ? "bg-[#385347] text-white shadow-sm"
                              : "bg-[#edf2e8] text-[#385347] hover:bg-[#dce8d8]"
                      }`}
                      aria-label={`${day.getDate()} de ${monthFormatter.format(month)}${availabilityUnavailable ? ", disponibilidad no cargada" : conflict ? ", reservado" : ", disponible"}`}
                    >
                      <span className="flex h-full items-center justify-center text-xs font-semibold">{day.getDate()}</span>
                    </button>
                  );
                })() : <div key={`empty-${index}`} />,
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 border-t border-[#ece7df] pt-3 text-xs text-[#4d5b55]">
              <span className="inline-flex items-center gap-1.5"><CircleCheck size={14} className="text-[#6b8b63]" /> Disponible</span>
              <span className="inline-flex items-center gap-1.5"><CircleX size={14} className="text-[#c7765a]" /> Reservado</span>
              {rangeStart && rangeEnd && (
                <span className="w-full text-[#385347]">
                  {formatDate(normalizeRange(rangeStart, rangeEnd).startDate)} · {formatDate(normalizeRange(rangeStart, rangeEnd).endDate)} (salida {formatDate(addCalendarDays(normalizeRange(rangeStart, rangeEnd).endDate, 1))} a la mañanana) · {selectedNights} {selectedNights === 1 ? "noche" : "noches"}
                </span>
              )}
            </div>

            {rangeStart && rangeEnd && hasMoreTime && !hasPaid && (
              <p className="mt-3 text-xs text-[#68716a]">
                Tu reserva todavía no tiene pagos, por lo que podés extender las fechas sin abonar ahora.
              </p>
            )}
            {rangeStart && rangeEnd && requiresPayment && (
              <p className="mt-3 text-xs text-[#68716a]">
                Al extender una reserva ya confirmada, vas a tener que abonar el monto correspondiente.
              </p>
            )}

            {paymentError && <p className="mt-3 text-sm text-[#b74f3d]" role="alert">{paymentError}</p>}

            <button
              type="button"
              disabled={
                !rangeStart ||
                !rangeEnd ||
                datesUnchanged ||
                availabilityUnavailable ||
                editWithoutPaymentMutation.isPending ||
                rangeHasReservation(rangeStart, rangeEnd)
              }
              onClick={handleContinue}
              className="ui-button ui-button-md ui-button-block mt-4"
            >
              {continueLabel}
            </button>
          </div>
        ) : step === "payment" ? (
          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#68716a]">Estadía nueva</p>
                <p className="font-medium text-[#202722]">
                  {rangeStart && rangeEnd
                    ? `Ingreso ${formatDate(normalizeRange(rangeStart, rangeEnd).startDate)} — salida ${formatDate(addCalendarDays(normalizeRange(rangeStart, rangeEnd).endDate, 1))} (${selectedNights} ${selectedNights === 1 ? "noche" : "noches"})`
                    : "Sin fechas"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#68716a]">Monto nuevo</p>
                <p className="text-xl font-semibold text-[#202722]">{formatPrice(newTotal)}</p>
              </div>
            </div>

            {delta > 0 && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Se suma {formatPrice(delta)} respecto a la reserva actual.
              </div>
            )}

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setPaymentOption("deposit")}
                className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition ${paymentOption === "deposit" ? "border-[#385347] bg-[#edf2e8]" : "border-[#e0ded5] bg-white hover:border-[#bfc5b9]"}`}
              >
                <span className="flex items-center gap-3">
                  <CreditCard size={18} className="text-[#e28b68]" />
                  <span>
                    <strong className="block text-sm text-[#385347]">Abonar diferencia</strong>
                    <small className="text-xs text-[#68716a]">{formatPrice(delta || 0)}</small>
                  </span>
                </span>
                <span className="h-4 w-4 border border-[#385347] p-0.5">
                  {paymentOption === "deposit" && <span className="block h-full w-full bg-[#385347]" />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption("full")}
                className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition ${paymentOption === "full" ? "border-[#385347] bg-[#edf2e8]" : "border-[#e0ded5] bg-white hover:border-[#bfc5b9]"}`}
              >
                <span className="flex items-center gap-3">
                  <CreditCard size={18} className="text-[#e28b68]" />
                  <span>
                    <strong className="block text-sm text-[#385347]">Pagar monto completo</strong>
                    <small className="text-xs text-[#68716a]">{formatPrice(newTotal)}</small>
                  </span>
                </span>
                <span className="h-4 w-4 border border-[#385347] p-0.5">
                  {paymentOption === "full" && <span className="block h-full w-full bg-[#385347]" />}
                </span>
              </button>
            </div>

            {paymentError && <p className="mt-3 text-sm text-[#b74f3d]">{paymentError}</p>}

            {!showCardForm ? (
              <button type="button" onClick={() => setShowCardForm(true)} disabled={isProcessingPayment} className="ui-button ui-button-md ui-button-block mt-4">
                Continuar al pago
              </button>
            ) : (
              <div className="relative mt-4 max-h-[55vh] overflow-y-auto rounded-md border border-[#e0ded5] bg-[#f8f4ef] p-3">
                <CardPayment
                  key={paymentAmount}
                  initialization={{ amount: paymentAmount || Math.max(0, newTotal) }}
                  onReady={() => undefined}
                  onSubmit={(formData: any) => handlePaymentSubmit(formData)}
                  onError={(error: any) => {
                    setPaymentError(error?.message ?? "No se pudo inicializar el pago.");
                  }}
                />
                {isProcessingPayment && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#f8f4ef]/95">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#385347] border-t-transparent" />
                    <p className="text-sm font-medium text-[#385347]">Procesando pago...</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCardForm(false);
                  setPaymentError(null);
                  setStep("dates");
                }}
                className="ui-link"
              >
                Volver a fechas
              </button>
              <button type="button" onClick={() => navigate(`/reservas/${id}`)} className="ui-button ui-button-sm">Cancelar</button>
            </div>
          </div>
        ) : step === "success" ? (
          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[#2d6a4f]" />
            <p className="text-lg text-[#202722]">Tu reserva fue modificada correctamente.</p>
            {userEmail && (
              <p className="mt-2 text-sm text-[#68716a]">Se envió la confirmación al correo {userEmail}</p>
            )}
            <button type="button" onClick={() => navigate(`/reservas/${id}`)} className="ui-button ui-button-md mt-5">
              Volver al detalle
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}