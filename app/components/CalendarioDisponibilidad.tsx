import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import { ChevronLeft, ChevronRight, CircleCheck, CircleX, CreditCard, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Reserva } from "~/types/Reserva";

interface CalendarioDisponibilidadProps {
    reservas: Reserva[];
    pricePerDay: number;
    onClose: () => void;
}

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5287";

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
        const start = dateKey(parseDate(reserva.startDate));
        const end = dateKey(parseDate(reserva.endDate));
        return current >= start && current <= end;
    });
}

function isBetween(day: Date, start?: Date, end?: Date): boolean {
    if (!start || !end) return false;
    const time = day.getTime();
    return time >= Math.min(start.getTime(), end.getTime()) && time <= Math.max(start.getTime(), end.getTime());
}

function rangeHasReservation(start: Date, end: Date, reservas: Reserva[]): boolean {
    const first = new Date(Math.min(start.getTime(), end.getTime()));
    const last = new Date(Math.max(start.getTime(), end.getTime()));

    for (const day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
        if (isReserved(day, reservas)) return true;
    }

    return false;
}

export default function CalendarioDisponibilidad({ reservas, pricePerDay, onClose }: CalendarioDisponibilidadProps) {
    useEffect(() => {
        initMercadoPago("TEST-440e66b5-54b5-49f2-9930-3dd2e1baed8e");
    }, []);

    const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [rangeStart, setRangeStart] = useState<Date>();
    const [rangeEnd, setRangeEnd] = useState<Date>();
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState<"dates" | "payment">("dates");
    const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("deposit");
    const [paymentPreferenceId, setPaymentPreferenceId] = useState<string | null>(null);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

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

    function updateRangeEnd(day: Date) {
        if (!rangeStart || rangeHasReservation(rangeStart, day, reservas)) return;
        setRangeEnd(day);
    }

    function handleDayPointerDown(day: Date) {
        setIsDragging(true);
        if (!rangeStart || rangeEnd) {
            setRangeStart(day);
            setRangeEnd(undefined);
            return;
        }

        updateRangeEnd(day);
    }

    function handleDayPointerUp(day: Date) {
        if (!rangeStart) return;
        updateRangeEnd(day);
        setIsDragging(false);
    }

    async function handleContinueToPayment() {
        if (!rangeStart || !rangeEnd) return;

        setIsCreatingPayment(true);
        setPaymentError(null);

        try {
            const payload = {
                title: `Reserva ${selectedDays} ${selectedDays === 1 ? "día" : "días"}`,
                unitPrice: paymentOption === "deposit" ? deposit : total,
            };

            const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/Payment/preference`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("No se pudo crear la preferencia de pago.");
            }

            const raw = await response.text();

            let preferenceId = raw;

            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed === "string") {
                    preferenceId = parsed;
                } else if (parsed?.id) {
                    preferenceId = parsed.id;
                } else if (parsed?.preferenceId) {
                    preferenceId = parsed.preferenceId;
                }
            } catch {
                // raw is already the preferenceId string
            }

            if (!preferenceId) {
                throw new Error("La respuesta del backend no incluye un preferenceId válido.");
            }

            setPaymentPreferenceId(String(preferenceId));
        } catch (error) {
            setPaymentError(
                error instanceof Error ? error.message : "Error al crear la preferencia de pago.",
            );
        } finally {
            setIsCreatingPayment(false);
        }
    }

    const selectedDays = rangeStart && rangeEnd
        ? Math.round(Math.abs(rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1
        : 0;
    const total = selectedDays * pricePerDay;
    const deposit = total * 0.1;
    const paymentAmount = paymentOption === "deposit" ? deposit : total;
    const formatPrice = (value: number) => `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#202722]/35 p-4" onClick={onClose}>
            <section className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[#e0ded5] bg-[#fffdf9] p-4 shadow-2xl sm:p-5" onClick={(event) => event.stopPropagation()} aria-labelledby="availability-title" role="dialog" aria-modal="true">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e28b68]">{step === "dates" ? "Disponibilidad" : "Forma de pago"}</p>
                        <h2 id="availability-title" className="mt-1 font-serif text-2xl tracking-[-0.05em] text-[#385347]">{step === "dates" ? "Elegí tus fechas" : "Completá tu reserva"}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[#68716a] transition hover:bg-[#f6f4ee] hover:text-[#385347]" aria-label="Cerrar calendario">
                        <X size={18} />
                    </button>
                </div>

                {step === "dates" ? (
                    <>
                        <div className="mt-4 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full border border-[#d3d0c6] p-1.5 text-[#385347] transition hover:bg-[#f6f4ee]" aria-label="Mes anterior">
                                    <ChevronLeft size={16} />
                                </button>
                                <strong className="min-w-32 text-center text-sm capitalize text-[#385347]">{monthFormatter.format(month)}</strong>
                                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full border border-[#d3d0c6] p-1.5 text-[#385347] transition hover:bg-[#f6f4ee]" aria-label="Mes siguiente">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div
                            className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-[#68716a]"
                            onPointerUp={() => setIsDragging(false)}
                            onPointerCancel={() => setIsDragging(false)}
                        >
                            {weekdays.map((day) => <div key={day} className="py-1 font-bold uppercase">{day}</div>)}
                            {days.map((day, index) => day ? (
                                (() => {
                                    const reserved = isReserved(day, reservas);
                                    const selected = isBetween(day, rangeStart, rangeEnd) || Boolean(rangeStart && dateKey(day) === dateKey(rangeStart));
                                    return (
                                        <button
                                            key={dateKey(day)}
                                            type="button"
                                            disabled={reserved}
                                            onPointerDown={() => !reserved && handleDayPointerDown(day)}
                                            onPointerEnter={() => isDragging && updateRangeEnd(day)}
                                            onPointerUp={() => !reserved && handleDayPointerUp(day)}
                                            className={`aspect-square rounded-lg p-0.5 transition ${reserved
                                                ? "cursor-not-allowed bg-[#f3ddd3] text-[#a85c43]"
                                                : selected
                                                    ? "bg-[#385347] text-white shadow-sm"
                                                    : "bg-[#edf2e8] text-[#385347] hover:bg-[#dce8d8]"
                                            }`}
                                            aria-label={`${day.getDate()} de ${monthFormatter.format(month)}${reserved ? ", reservado" : ", disponible"}`}
                                        >
                                            <span className="flex h-full items-center justify-center rounded-md text-xs font-semibold">{day.getDate()}</span>
                                        </button>
                                    );
                                })()
                            ) : <div key={`empty-${index}`} />)}
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
                            className="mt-4 w-full rounded-full bg-[#385347] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d453d] disabled:cursor-not-allowed disabled:bg-[#c9cec5] disabled:text-[#7b837b]"
                        >
                            {rangeStart && rangeEnd
                                ? `Reservar ${selectedDays} ${selectedDays === 1 ? "día" : "días"}`
                                : "Reservar días"}
                        </button>
                    </>
                ) : (
                    <div className="mt-5">
                        <p className="text-sm text-[#4d5b55]">
                            {selectedDays} {selectedDays === 1 ? "día" : "días"} · Total: <strong>{formatPrice(total)}</strong>
                        </p>

                        <div className="mt-4 space-y-2">
                            <button
                                type="button"
                                onClick={() => setPaymentOption("deposit")}
                                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${paymentOption === "deposit" ? "border-[#385347] bg-[#edf2e8]" : "border-[#e0ded5] bg-white hover:border-[#bfc5b9]"}`}
                            >
                                <span className="flex items-center gap-3">
                                    <CreditCard size={18} className="text-[#e28b68]" />
                                    <span>
                                        <strong className="block text-sm text-[#385347]">Abonar seña</strong>
                                        <small className="text-xs text-[#68716a]">10% · {formatPrice(deposit)}</small>
                                    </span>
                                </span>
                                <span className="h-4 w-4 rounded-full border border-[#385347] p-0.5">
                                    {paymentOption === "deposit" && <span className="block h-full w-full rounded-full bg-[#385347]" />}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentOption("full")}
                                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${paymentOption === "full" ? "border-[#385347] bg-[#edf2e8]" : "border-[#e0ded5] bg-white hover:border-[#bfc5b9]"}`}
                            >
                                <span className="flex items-center gap-3">
                                    <CreditCard size={18} className="text-[#e28b68]" />
                                    <span>
                                        <strong className="block text-sm text-[#385347]">Abonar monto completo</strong>
                                        <small className="text-xs text-[#68716a]">100% · {formatPrice(total)}</small>
                                    </span>
                                </span>
                                <span className="h-4 w-4 rounded-full border border-[#385347] p-0.5">
                                    {paymentOption === "full" && <span className="block h-full w-full rounded-full bg-[#385347]" />}
                                </span>
                            </button>
                        </div>

                        {paymentError && (
                            <p className="mt-3 text-sm text-[#b74f3d]">{paymentError}</p>
                        )}

                        {paymentPreferenceId ? (
                            <div className="mt-4 max-h-[55vh] overflow-y-auto rounded-2xl border border-[#e0ded5] bg-[#f8f4ef] p-3">
                                <Payment
                                    initialization={{
                                        amount: paymentAmount,
                                        preferenceId: paymentPreferenceId,
                                    }}
                                    customization={{
                                        paymentMethods: {
                                            ticket: "all",
                                            creditCard: "all",
                                            debitCard: "all",
                                            mercadoPay: "all",
                                        },
                                    }}
                                    callbacks={{
                                        onReady: () => undefined,
                                        onSubmit: () => undefined,
                                        onError: () => undefined,
                                    }}
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleContinueToPayment}
                                disabled={isCreatingPayment}
                                className="mt-4 w-full rounded-full bg-[#e28b68] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c7765a] disabled:cursor-not-allowed disabled:bg-[#dcb09b]"
                            >
                                {isCreatingPayment ? "Creando pago..." : "Continuar al pago"}
                            </button>
                        )}

                        <button type="button" onClick={() => setStep("dates")} className="mt-2 w-full py-2 text-xs font-semibold text-[#385347]">
                            Volver a elegir fechas
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
