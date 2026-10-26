import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleCheck, CircleX, CreditCard, X } from "lucide-react";
import api from "~/utils/api";
import { useAuthentication } from "~/components/NavegacionUsuario";

const apiBaseUrl = import.meta.env.VITE_API_URL;
const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

interface ReservationDetail {
  id: string;
  apartmentId: string;
  apartmentName?: string;
  apartmentLocation?: string;
  checkInDate: string;
  checkOutDate: string;
  reservationState: number;
  totalPrice?: number;
  depositAmount?: number;
  fullAmount?: number;
  pricePerDay?: number;
  paymentMethods?: Array<{ id: string; name: string; type?: string; enabled?: boolean }>;
}

type ReservationReservation = {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  reservationState: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value?: number) {
  if (value == null) return "-";
  return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string): Date {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
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

function getReservationStateLabel(state: number) {
  switch (state) {
    case 0:
      return "No confirmada";
    case 1:
      return "Confirmada no completa";
    case 2:
      return "Confirmada completa";
    case 3:
      return "Cancelada";
    default:
      return "Desconocido";
  }
}

export function meta() {
  return [{ title: "Modificar reserva | Reservas Moreno" }];
}

export default function MisReservasModificarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authQuery = useAuthentication();

  const reservaQuery = useQuery<ReservationDetail>({
    queryKey: ["my-reservation-detail", id],
    queryFn: async () => (await api.get(`/api/reservation/${id}`)).data,
    enabled: Boolean(authQuery.data) && Boolean(id),
    meta: { silent: true },
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
  const [paymentStatus, setPaymentStatus] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState("test@gmail.com");
  const [existingReservations, setExistingReservations] = useState<ReservationReservation[]>([]);

  useEffect(() => {
    initMercadoPago("TEST-440e66b5-54b5-49f2-9930-3dd2e1baed8e");
  }, []);

  useEffect(() => {
    if (!reservaQuery.data) return;
    const res = reservaQuery.data;
    setRangeStart(parseDate(res.checkInDate));
    setRangeEnd(parseDate(res.checkOutDate));
  }, [reservaQuery.data]);

  useEffect(() => {
    if (!reservaQuery.data?.apartmentId) return;
    api.get(`/api/reservation/apartment/${reservaQuery.data.apartmentId}`)
      .then((response) => {
        const list = Array.isArray(response.data) ? response.data : response.data.reservations ?? [];
        setExistingReservations(list.filter((reservation: ReservationReservation) => reservation.id !== id));
      })
      .catch(() => setExistingReservations([]));
  }, [reservaQuery.data, id]);

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

  const selectedDays = rangeStart && rangeEnd
    ? Math.round(Math.abs(rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1
    : 0;

  const originalTotal = reservaQuery.data ?
    (reservaQuery.data.totalPrice ?? reservaQuery.data.fullAmount ?? (reservaQuery.data.pricePerDay ?? 0) * 5) : 0;

  const newTotal = rangeStart && rangeEnd
    ? Math.round(Math.abs(rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1 * (reservaQuery.data?.pricePerDay ?? 0)
    : 0;

  const delta = Math.max(0, newTotal - originalTotal);
  const refund = Math.max(0, originalTotal - newTotal);

  const formatPrice = (value: number) => `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

  const isReservedDay = (day: Date) => {
    const current = dateKey(day);
    return existingReservations.some((reservation) => {
      const start = dateKey(parseDate(reservation.checkInDate));
      const end = dateKey(parseDate(reservation.checkOutDate));
      return current >= start && current <= end && (reservation.reservationState === 2 || reservation.reservationState === 3 || reservation.reservationState === 4);
    });
  };

  const handleDayPointerDown = (day: Date) => {
    if (!isSelectableDay(day)) return;
    setIsDragging(true);
    if (!rangeStart || rangeEnd) {
      setRangeStart(day);
      setRangeEnd(undefined);
      return;
    }
    if (day.getTime() < rangeStart.getTime()) {
      setRangeEnd(rangeStart);
      setRangeStart(day);
      return;
    }
    setRangeEnd(day);
  };

  const handleDayPointerUp = (day: Date) => {
    if (!rangeStart || !isSelectableDay(day)) return;
    if (day.getTime() < rangeStart.getTime()) {
      setRangeEnd(rangeStart);
      setRangeStart(day);
    } else {
      setRangeEnd(day);
    }
    setIsDragging(false);
  };

  const isCalendarConflict = (day: Date) => {
    const current = dateKey(day);
    if (rangeStart && rangeEnd) {
      const start = new Date(Math.min(rangeStart.getTime(), rangeEnd.getTime()));
      const end = new Date(Math.max(rangeStart.getTime(), rangeEnd.getTime()));
      const isInsideSelected = day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
      if (isInsideSelected) return false;
    }
    return isReservedDay(day);
  };

  async function handlePaymentSubmit(formData: any): Promise<void> {
    if (!rangeStart || !rangeEnd || !reservaQuery.data?.apartmentId) {
      throw new Error("Faltan datos de la reserva.");
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatus(null);

    try {
      const response = await fetch(
        `${apiBaseUrl.replace(/\/$/, "")}/api/Payment/process_card_payment/${reservaQuery.data.apartmentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            checkInDate: new Date(rangeStart).toISOString(),
            checkOutDate: new Date(rangeEnd).toISOString(),
            paymentOption,
            reservationId: reservaQuery.data.id,
            isModification: true,
          }),
        },
      );

      const rawText = await response.text();
      let data: any = null;
      if (rawText) {
        try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
      }

      if (!response.ok) {
        const message = data?.message ?? data?.error ?? data?.title ?? "No se pudo procesar el pago.";
        throw new Error(message);
      }

      const normalizedStatus = Number(data?.paymentStatus ?? data?.status ?? data?.payment_status ?? 0);
      setUserEmail(data.email);
      setPaymentStatus(normalizedStatus);

      if (normalizedStatus === 2) {
        setStep("success");
        return;
      }
      if (normalizedStatus === 1) {
        throw new Error("Pago pendiente. Mercado Pago continuará el proceso y te avisará cuando se confirme.");
      }
      if (normalizedStatus === 4) {
        throw new Error("El pago fue rechazado. Verificá los datos de tu tarjeta.");
      }
      if (normalizedStatus === 5) {
        throw new Error("El pago fue cancelado.");
      }

      throw new Error("El backend respondió un estado de pago no reconocido.");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Error al procesar el pago.");
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const paymentAmount = paymentOption === "deposit" ? Math.max(0, delta) : Math.max(0, delta);
  const shouldShowPayment = Boolean(reservaQuery.data && (reservaQuery.data.reservationState === 0 || reservaQuery.data.reservationState === 1) && (delta > 0 || refund > 0));

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

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        <Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">
          reservas<span className="text-[#e28b68]">moreno</span>
        </Link>
        <Link to="/mis-reservas" className="ui-link">Volver a reservas</Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">Modificar reserva</p>
            <h1 className="font-serif text-5xl tracking-[-0.05em] text-[#385347]">{reservaQuery.data.apartmentName ?? "Reserva"}</h1>
          </div>
          <span className="rounded-full border border-[#d7d1c7] bg-[#edf2e8] px-2.5 py-1 text-xs font-semibold text-[#385347]">
            {getReservationStateLabel(reservaQuery.data.reservationState)}
          </span>
        </div>

        <div className="mb-6 rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-4 text-sm text-[#68716a]">
          <p>Reserva actual: {formatDate(reservaQuery.data.checkInDate)} — {formatDate(reservaQuery.data.checkOutDate)}</p>
          <p className="mt-1">Monto actual: {formatPrice(originalTotal)}</p>
        </div>

        {step === "dates" ? (
          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-4 shadow-sm">
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
                      disabled={conflict || !isSelectableDay(day)}
                      onPointerDown={() => !conflict && handleDayPointerDown(day)}
                      onPointerEnter={() => isDragging && !conflict && setRangeEnd(day)}
                      onPointerUp={() => !conflict && handleDayPointerUp(day)}
                      className={`aspect-square rounded-sm border border-transparent p-0.5 transition ${
                        conflict
                          ? "cursor-not-allowed bg-[#f3ddd3] text-[#a85c43]"
                          : !isSelectableDay(day)
                            ? "cursor-not-allowed bg-[#f0efe9] text-[#a6a29a]"
                            : selected
                              ? "bg-[#385347] text-white shadow-sm"
                              : "bg-[#edf2e8] text-[#385347] hover:bg-[#dce8d8]"
                      }`}
                      aria-label={`${day.getDate()} de ${monthFormatter.format(month)}${conflict ? ", reservado" : ", disponible"}`}
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
              {rangeStart && rangeEnd && <span className="w-full text-[#385347]">{dateKey(rangeStart)} a {dateKey(rangeEnd)}</span>}
            </div>

            <button
              type="button"
              disabled={!rangeStart || !rangeEnd}
              onClick={() => setStep("payment")}
              className="ui-button ui-button-md ui-button-block mt-4"
            >
              {rangeStart && rangeEnd ? `Continuar con ${selectedDays} ${selectedDays === 1 ? "día" : "días"}` : "Seleccioná fechas"}
            </button>
          </div>
        ) : step === "payment" ? (
          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#68716a]">Fechas nuevas</p>
                <p className="font-medium text-[#202722]">{rangeStart && rangeEnd ? `${formatDate(rangeStart.toISOString())} — ${formatDate(rangeEnd.toISOString())}` : "Sin fechas"}</p>
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

            {refund > 0 && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Se devuelve {formatPrice(refund)} respecto a la reserva actual.
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
              <div className="mt-4 max-h-[55vh] overflow-y-auto rounded-md border border-[#e0ded5] bg-[#f8f4ef] p-3">
                <CardPayment
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
              <button type="button" onClick={() => setStep("dates")} className="ui-link">Volver a fechas</button>
              <button type="button" onClick={() => navigate(`/mis-reservas/${id}`)} className="ui-button ui-button-sm">Cancelar</button>
            </div>
          </div>
        ) : step === "success" ? (
          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[#2d6a4f]" />
            <p className="text-lg text-[#202722]">Tu reserva fue modificada correctamente.</p>
            <p className="mt-2 text-sm text-[#68716a]">Se envió la confirmación al correo {userEmail}</p>
            <button type="button" onClick={() => navigate(`/mis-reservas/${id}`)} className="ui-button ui-button-md mt-5">
              Volver al detalle
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
