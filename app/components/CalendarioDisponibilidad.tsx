import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  CreditCard,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import type { Reserva } from "~/types/Reserva";

interface CalendarioDisponibilidadProps {
  reservas: Reserva[];
  pricePerDay: number;
  apartmentId: string;
  isAuthenticated: boolean;
  onClose: () => void;
}

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
const apiBaseUrl = import.meta.env.VITE_API_URL;

const today = new Date();
const todayStart = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate(),
);
const firstAllowedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastAllowedMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

function isSelectableDay(day: Date): boolean {
  const normalizedDay = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
  );
  const normalizedToday = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    todayStart.getDate(),
  );

  return normalizedDay.getTime() >= normalizedToday.getTime();
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string): Date {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function isReserved(day: Date, reservas: Reserva[]): boolean {
  const current = dateKey(day);
  return reservas.some((reserva) => {
    const start = dateKey(parseDate(reserva.checkInDate));
    const end = dateKey(parseDate(reserva.checkOutDate));
    return (
      current >= start &&
      current <= end &&
      (reserva.reservationState == 2 ||
        reserva.reservationState == 3 ||
        reserva.reservationState == 4)
    );
  });
}

function isBetween(day: Date, start?: Date, end?: Date): boolean {
  if (!start || !end) return false;
  const time = day.getTime();
  return (
    time >= Math.min(start.getTime(), end.getTime()) &&
    time <= Math.max(start.getTime(), end.getTime())
  );
}

function rangeHasReservation(
  start: Date,
  end: Date,
  reservas: Reserva[],
): boolean {
  const first = new Date(Math.min(start.getTime(), end.getTime()));
  const last = new Date(Math.max(start.getTime(), end.getTime()));

  for (
    const day = new Date(first);
    day <= last;
    day.setDate(day.getDate() + 1)
  ) {
    if (isReserved(day, reservas)) return true;
  }

  return false;
}

export default function CalendarioDisponibilidad({
  reservas,
  pricePerDay,
  apartmentId,
  isAuthenticated,
  onClose,
}: CalendarioDisponibilidadProps) {
  const location = useLocation();

  useEffect(() => {
    initMercadoPago("TEST-440e66b5-54b5-49f2-9930-3dd2e1baed8e");
  }, []);

  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [userEmail, setUserEmail] = useState("test@gmail.com");
  const [rangeStart, setRangeStart] = useState<Date>();
  const [rangeEnd, setRangeEnd] = useState<Date>();
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<"dates" | "payment" | "success">("dates");
  const [paymentOption, setPaymentOption] = useState<"deposit" | "full">(
    isAuthenticated ? "deposit" : "full",
  );
  const [showCardForm, setShowCardForm] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<number | null>(null);

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const offset = (firstDay.getDay() + 6) % 7;
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(2024, 0, index + 1);
    return weekdayFormatter.format(day).replace(".", "").slice(0, 2);
  });
  const days = Array.from({ length: offset + daysInMonth }, (_, index) =>
    index < offset
      ? null
      : new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
  );

  function updateRangeEnd(day: Date) {
    if (
      !rangeStart ||
      !isSelectableDay(day) ||
      rangeHasReservation(rangeStart, day, reservas)
    )
      return;
    setRangeEnd(day);
  }

  function handleDayPointerDown(day: Date) {
    if (!isSelectableDay(day)) return;

    setIsDragging(true);
    if (!rangeStart || rangeEnd) {
      setRangeStart(day);
      setRangeEnd(undefined);
      return;
    }

    updateRangeEnd(day);
  }

  function handleDayPointerUp(day: Date) {
    if (!rangeStart || !isSelectableDay(day)) return;
    updateRangeEnd(day);
    setIsDragging(false);
  }

  async function handlePaymentSubmit(formData: any): Promise<void> {
    if (!rangeStart || !rangeEnd || !apartmentId) {
      throw new Error("Faltan datos de la reserva.");
    }
    if (paymentOption === "deposit" && !isAuthenticated) {
      throw new Error("La opción de abonar la seña es solo para usuarios logueados.");
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatus(null);

    try {
      const response = await fetch(
        `${apiBaseUrl.replace(/\/$/, "")}/api/Payment/process_card_payment/${apartmentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            checkInDate: new Date(rangeStart).toISOString(),
            checkOutDate: new Date(rangeEnd).toISOString(),
            paymentOption,
          }),
        },
      );

      const rawText = await response.text();
      let data: any = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }

      if (!response.ok) {
        const message =
          data?.message ??
          data?.error ??
          data?.title ??
          "No se pudo procesar el pago.";

        throw new Error(message);
      }

      const normalizedStatus = Number(
        data?.paymentStatus ?? data?.status ?? data?.payment_status ?? 0,
      );

      setUserEmail(data.email);
      setPaymentStatus(normalizedStatus);

      if (normalizedStatus === 2) {
        setStep("success");
        return;
      }

      if (normalizedStatus === 1) {
        throw new Error(
          "Pago pendiente. Mercado Pago continuará el proceso y te avisará cuando se confirme.",
        );
      }

      if (normalizedStatus === 4) {
        throw new Error(
          "El pago fue rechazado. Verificá los datos de tu tarjeta.",
        );
      }

      if (normalizedStatus === 5) {
        throw new Error("El pago fue cancelado.");
      }

      throw new Error("El backend respondió un estado de pago no reconocido.");
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Error al procesar el pago.",
      );

      // Importante: re-lanzar para que el SDK de Mercado Pago pueda cerrar la animación
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const selectedDays =
    rangeStart && rangeEnd
      ? Math.round(
          Math.abs(rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000,
        ) + 1
      : 0;
  const total = selectedDays * pricePerDay;
  const deposit = total * 0.1;
  const paymentAmount = paymentOption === "deposit" ? deposit : total;
  const formatPrice = (value: number) =>
    `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#202722]/35 p-4"
      onClick={onClose}
    >
      <section
        className={`ui-border w-full ${step == "dates" ? "max-w-md" : "max-w-3xl"} max-h-[90vh] overflow-y-auto rounded-md bg-[#fffdf9] p-4 shadow-[0_8px_24px_rgba(32,39,34,0.12)] sm:p-5`}
        onClick={(event) => event.stopPropagation()}
        aria-labelledby="availability-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e28b68]">
              {step === "dates"
                ? "Disponibilidad"
                : step == "payment"
                  ? "Forma de pago"
                  : "Estado"}
            </p>
            <h2
              id="availability-title"
              className="mt-1 font-serif text-2xl tracking-[-0.05em] text-[#385347]"
            >
              {step === "dates"
                ? "Elegí tus fechas"
                : step == "payment"
                  ? "Completá tu reserva"
                  : "Pago completado"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-icon-button p-1.5 text-[#68716a] hover:text-[#385347]"
            aria-label="Cerrar calendario"
          >
            <X size={18} />
          </button>
        </div>

        {step === "dates" ? (
          <>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={month.getTime() <= firstAllowedMonth.getTime()}
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                  className="ui-icon-button p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft size={16} />
                </button>

                <strong className="min-w-32 text-center text-sm capitalize text-[#385347]">
                  {monthFormatter.format(month)}
                </strong>

                <button
                  type="button"
                  disabled={month.getTime() >= lastAllowedMonth.getTime()}
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                  className="ui-icon-button p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div
              className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-[#68716a]"
              onPointerUp={() => setIsDragging(false)}
              onPointerCancel={() => setIsDragging(false)}
            >
              {weekdays.map((day) => (
                <div key={day} className="py-1 font-bold uppercase">
                  {day}
                </div>
              ))}
              {days.map((day, index) =>
                day ? (
                  (() => {
                    const reserved = isReserved(day, reservas);
                    const selected =
                      isBetween(day, rangeStart, rangeEnd) ||
                      Boolean(
                        rangeStart && dateKey(day) === dateKey(rangeStart),
                      );
                    return (
                      <button
                        key={dateKey(day)}
                        type="button"
                        title={reserved ? "Fecha reservada" : ""}
                        disabled={reserved || !isSelectableDay(day)}
                        onPointerDown={() =>
                          !reserved && handleDayPointerDown(day)
                        }
                        onPointerEnter={() => isDragging && updateRangeEnd(day)}
                        onPointerUp={() => !reserved && handleDayPointerUp(day)}
                        className={`aspect-square rounded-sm border border-transparent p-0.5 transition ${
                          reserved
                            ? "cursor-not-allowed bg-[#f3ddd3] text-[#a85c43]"
                            : !isSelectableDay(day)
                              ? "cursor-not-allowed bg-[#f0efe9] text-[#a6a29a]"
                              : selected
                                ? "bg-[#385347] text-white shadow-sm"
                                : "bg-[#edf2e8] text-[#385347] hover:bg-[#dce8d8]"
                        }`}
                        aria-label={`${day.getDate()} de ${monthFormatter.format(month)}${reserved ? ", reservado" : ", disponible"}`}
                      >
                        <span className="flex h-full items-center justify-center text-xs font-semibold">
                          {day.getDate()}
                        </span>
                      </button>
                    );
                  })()
                ) : (
                  <div key={`empty-${index}`} />
                ),
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 border-t border-[#ece7df] pt-3 text-xs text-[#4d5b55]">
              <span className="inline-flex items-center gap-1.5">
                <CircleCheck size={14} className="text-[#6b8b63]" /> Disponible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CircleX size={14} className="text-[#c7765a]" /> Reservado
              </span>
              {rangeStart && rangeEnd && (
                <span className="w-full text-[#385347]">
                  {dateKey(rangeStart)} a {dateKey(rangeEnd)}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={!rangeStart || !rangeEnd}
              onClick={() => setStep("payment")}
              className="ui-button ui-button-md ui-button-block mt-4"
            >
              {rangeStart && rangeEnd
                ? `Reservar ${selectedDays} ${selectedDays === 1 ? "día" : "días"}`
                : "Reservar días"}
            </button>
          </>
        ) : step == "payment" ? (
          <div className="mt-5">
            <p className="text-sm text-[#4d5b55]">
              {selectedDays} {selectedDays === 1 ? "día" : "días"} · Total:{" "}
              <strong>{formatPrice(total)}</strong>
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={!isAuthenticated}
                onClick={() => {
                  setPaymentOption("deposit");
                  setShowCardForm(false);
                }}
                className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition ${paymentOption === "deposit" ? "border-[#385347] bg-[#edf2e8]" : "border-[#e0ded5] bg-white hover:border-[#bfc5b9]"} disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-[#e0ded5]`}
                aria-describedby="deposit-login-message"
              >
                <span className="flex items-center gap-3">
                  <CreditCard size={18} className="text-[#e28b68]" />
                  <span>
                    <strong className="block text-sm text-[#385347]">
                      Abonar seña
                    </strong>
                    <small className="text-xs text-[#68716a]">
                      10% · {formatPrice(deposit)}
                    </small>
                  </span>
                </span>
                <span className="h-4 w-4 border border-[#385347] p-0.5">
                  {paymentOption === "deposit" && (
                    <span className="block h-full w-full bg-[#385347]" />
                  )}
                </span>
              </button>
              {!isAuthenticated && (
                <p id="deposit-login-message" className="text-xs text-[#b74f3d]">
                  La opción de abonar la seña es solo para usuarios logueados. {" "}
                  <Link
                    to="/register"
                    state={{ returnTo: location.pathname }}
                    className="font-semibold underline"
                  >
                    Registrate
                  </Link>
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setPaymentOption("full");
                  setShowCardForm(false);
                }}
                className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition ${paymentOption === "full" ? "border-[#385347] bg-[#edf2e8]" : "border-[#e0ded5] bg-white hover:border-[#bfc5b9]"}`}
              >
                <span className="flex items-center gap-3">
                  <CreditCard size={18} className="text-[#e28b68]" />
                  <span>
                    <strong className="block text-sm text-[#385347]">
                      Abonar monto completo
                    </strong>
                    <small className="text-xs text-[#68716a]">
                      100% · {formatPrice(total)}
                    </small>
                  </span>
                </span>
                <span className="h-4 w-4 border border-[#385347] p-0.5">
                  {paymentOption === "full" && (
                    <span className="block h-full w-full bg-[#385347]" />
                  )}
                </span>
              </button>
            </div>

            {paymentError && (
              <p className="mt-3 text-sm text-[#b74f3d]">{paymentError}</p>
            )}

            {!showCardForm ? (
              <button
                type="button"
                onClick={() => setShowCardForm(true)}
                disabled={isProcessingPayment}
                className="ui-button ui-button-md ui-button-block mt-4"
              >
                Continuar al pago
              </button>
            ) : (
              <div className="mt-4 max-h-[55vh] overflow-y-auto rounded-md border border-[#e0ded5] bg-[#f8f4ef] p-3">
                <CardPayment
                  initialization={{
                    amount: paymentAmount,
                  }}
                  onReady={() => undefined}
                  onSubmit={(formData: any) => handlePaymentSubmit(formData)}
                  onError={(error: any) => {
                    setPaymentError(
                      error?.message ?? "No se pudo inicializar el pago.",
                    );
                  }}
                />
                {isProcessingPayment && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#f8f4ef]/95">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#385347] border-t-transparent" />
                    <p className="text-sm font-medium text-[#385347]">
                      Procesando pago...
                    </p>
                  </div>
                )}
              </div>
            )}

            {isProcessingPayment && (
              <p className="mt-3 text-center text-sm font-medium text-[#385347]">
                Procesando pago...
              </p>
            )}

            {paymentStatus !== null && paymentStatus === 2 && (
              <p className="mt-3 text-center text-sm font-semibold text-[#2d6a4f]">
                Pago aprobado correctamente.
              </p>
            )}

            <button
              type="button"
              onClick={() => setStep("dates")}
              className="mt-2 w-full py-2 text-xs font-semibold text-[#385347]"
            >
              Volver a elegir fechas
            </button>
          </div>
        ) : step == "success" ? (
          <div className="mt-4 ">
            <div className="p-5 py-7 text-center mb-4 w-full flex flex-col items-center  text-[#68716a]">
              <CheckCircle2 className="text-primary w-15 h-15 pb-3" />
              <p>
                Ingrese a su buzon en {userEmail} para ver el comprobante de
                esta reserva. Si quiere cancelarla, comuniquese con el emisor.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ui-button ui-button-md ui-button-block bg-primary text-primary-foreground"
            >
              Listo
            </button>
          </div>
        ) : (
          "Error"
        )}
      </section>
    </div>
  );
}
