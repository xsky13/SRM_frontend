import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleCheck, CircleX, CreditCard, X } from "lucide-react";
import api from "~/utils/api";
import LoadingState from "~/components/LoadingState";
import { useAuthentication } from "~/components/NavegacionUsuario";
import { ReservationState } from "~/types/Reserva";
import type { ReservationDetail } from "~/types/ReservationDetail";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import {
	differenceInCalendarDays,
	parseDateOnly,
	serializeDateOnly,
} from "~/utils/dateOnly";
import { trackedFetch } from "~/utils/requestProgress";

const apiBaseUrl = import.meta.env.VITE_API_URL;
const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

type ReservationReservation = {
	id: string;
	checkInDate: string;
	checkOutDate: string;
	reservationState: ReservationState;
};

function formatDate(value: string | Date) {
	return new Intl.DateTimeFormat("es-AR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(typeof value === "string" ? parseDateOnly(value) : value);
}

function dateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateKeyReadable(date: Date): string {
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
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

function getReservationStateLabel(state: ReservationState) {
	return RESERVATION_STATE_LABEL[state] ?? "Desconocido";
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
	const [step, setStep] = useState<"dates" | "payment" | "success">("dates");
	const [showCardForm, setShowCardForm] = useState(false);
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState("test@gmail.com");
	const [existingReservations, setExistingReservations] = useState<ReservationReservation[]>([]);
	const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
	const [availabilityError, setAvailabilityError] = useState<string | null>(null);
	const [dateSelectionError, setDateSelectionError] = useState<string | null>(null);

	useEffect(() => {
		initMercadoPago("TEST-440e66b5-54b5-49f2-9930-3dd2e1baed8e");
	}, []);

	useEffect(() => {
		if (!reservaQuery.data) return;
		const res = reservaQuery.data;
		setRangeStart(parseDateOnly(res.checkInDate));
		setRangeEnd(parseDateOnly(res.checkOutDate));
	}, [reservaQuery.data]);

	useEffect(() => {
		if (!reservaQuery.data) return;
		if (!reservaQuery.data.apartmentId) {
			setIsLoadingAvailability(false);
			setAvailabilityError("No se pudo verificar la disponibilidad de la propiedad.");
			return;
		}

		let isCancelled = false;
		setIsLoadingAvailability(true);
		setAvailabilityError(null);

		api.get(`/api/reservation/apartment/${reservaQuery.data.apartmentId}`)
			.then((response) => {
				const list = Array.isArray(response.data) ? response.data : response.data?.reservations;
				if (!Array.isArray(list)) {
					throw new Error("La respuesta de disponibilidad no tiene un formato válido.");
				}
				if (!isCancelled) {
					setExistingReservations(list.filter((reservation: ReservationReservation) => reservation.id !== id));
				}
			})
			.catch(() => {
				if (!isCancelled) {
					setExistingReservations([]);
					setAvailabilityError("No se pudo verificar la disponibilidad. Intentá nuevamente más tarde.");
				}
			})
			.finally(() => {
				if (!isCancelled) setIsLoadingAvailability(false);
			});

		return () => {
			isCancelled = true;
		};
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
		? Math.abs(differenceInCalendarDays(rangeStart, rangeEnd)) + 1
		: 0;
	const checkoutDate = rangeEnd ? new Date(rangeEnd) : undefined;
	checkoutDate?.setDate(checkoutDate.getDate() + 1);

	const originalTotal = reservaQuery.data ?
		reservaQuery.data.fullCost : 0;

	const newTotal = selectedDays * (reservaQuery.data?.apartment?.price ?? 0);

	const delta = originalTotal == null ? 0 : Math.max(0, newTotal - originalTotal);
	const refund = originalTotal == null ? 0 : Math.max(0, originalTotal - newTotal);

	const formatPrice = (value: number) => `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

	const normalizeRange = (start: Date, end: Date) => {
		// TODO(G10): extraer a hook compartido
		return start.getTime() <= end.getTime()
			? { startDate: start, endDate: end }
			: { startDate: end, endDate: start };
	};

	const selectedRange =
		rangeStart && rangeEnd ? normalizeRange(rangeStart, rangeEnd) : undefined;
	const isUnchangedDateRange = Boolean(
		reservaQuery.data &&
		selectedRange &&
		dateKey(selectedRange.startDate) ===
		dateKey(parseDateOnly(reservaQuery.data.checkInDate)) &&
		dateKey(selectedRange.endDate) ===
		dateKey(parseDateOnly(reservaQuery.data.checkOutDate)),
	);

	const isReservedDay = (day: Date) => {
		const current = dateKey(day);
		return existingReservations.some((reservation) => {
			const start = dateKey(parseDateOnly(reservation.checkInDate));
			const end = dateKey(parseDateOnly(reservation.checkOutDate));
			return current >= start && current <= end && (
				reservation.reservationState === ReservationState.ConfirmedPaymentIncomplete ||
				reservation.reservationState === ReservationState.ConfirmedPaymentComplete ||
				reservation.reservationState === ReservationState.PaymentPending
			);
		});
	};

	const rangeHasReservedDay = (start: Date, end: Date) => {
		const { startDate, endDate } = normalizeRange(start, end);
		for (const day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
			if (isReservedDay(day)) return true;
		}
		return false;
	};

	const clearDateSelection = () => {
		// setRangeStart(undefined);
		// setRangeEnd(undefined);
		setRangeStart(reservaQuery.data != null ? parseDateOnly(reservaQuery.data.checkInDate) : undefined);
		setRangeEnd(reservaQuery.data != null ? parseDateOnly(reservaQuery.data.checkOutDate) : undefined);
	};

	const handleDayClick = (day: Date) => {
		if (!isSelectableDay(day) || isReservedDay(day)) return;
		setDateSelectionError(null);
		if (!rangeStart || rangeEnd) {
			setRangeStart(day);
			setRangeEnd(undefined);
			return;
		}

		const { startDate, endDate } = normalizeRange(rangeStart, day);
		if (rangeHasReservedDay(startDate, endDate)) {
			setDateSelectionError("El rango seleccionado incluye días que ya están reservados.");
			clearDateSelection();
			return;
		}

		setRangeStart(startDate);
		setRangeEnd(endDate);
	};

	const handleContinueToPayment = () => {
		if (!rangeStart || !rangeEnd) return;
		if (rangeHasReservedDay(rangeStart, rangeEnd)) {
			clearDateSelection();
			setDateSelectionError("El rango seleccionado incluye días que ya están reservados.");
			return;
		}
		setDateSelectionError(null);
		setStep("payment");
	};

	async function handlePaymentSubmit(formData: any): Promise<void> {
		if (!rangeStart || !rangeEnd || !reservaQuery.data?.apartmentId) {
			throw new Error("Faltan datos de la reserva.");
		}
		if (isLoadingAvailability || availabilityError) {
			throw new Error(availabilityError ?? "Esperá a que se verifique la disponibilidad.");
		}
		if (rangeHasReservedDay(rangeStart, rangeEnd)) {
			const message = "El rango seleccionado incluye días que ya están reservados.";
			clearDateSelection();
			setStep("dates");
			setDateSelectionError(message);
			setPaymentError(null);
			throw new Error(message);
		}

		setIsProcessingPayment(true);
		setPaymentError(null);

		try {
			const { startDate, endDate } = normalizeRange(rangeStart, rangeEnd);
			const response = await trackedFetch(
				`${apiBaseUrl.replace(/\/$/, "")}/api/reservation/${reservaQuery.data.reservationId}/full`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						...formData,
						NewStartDate: serializeDateOnly(startDate),
						NewEndDate: serializeDateOnly(endDate),
						ReservationId: reservaQuery.data.reservationId,
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
			setUserEmail(data.email ?? authQuery.data?.email ?? "tu correo");

			if (normalizedStatus === 2 || (response.ok && !normalizedStatus)) {
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

	async function handleSaveDates(): Promise<void> {
		if (!rangeStart || !rangeEnd || !reservaQuery.data) {
			setPaymentError("Faltan datos de la reserva.");
			return;
		}
		if (isLoadingAvailability || availabilityError) {
			setPaymentError(availabilityError ?? "Esperá a que se verifique la disponibilidad.");
			return;
		}
		if (rangeHasReservedDay(rangeStart, rangeEnd)) {
			clearDateSelection();
			setStep("dates");
			setDateSelectionError("El rango seleccionado incluye días que ya están reservados.");
			setPaymentError(null);
			return;
		}

		const { startDate, endDate } = normalizeRange(rangeStart, rangeEnd);
		setIsProcessingPayment(true);
		setPaymentError(null);

		try {
			const response = await trackedFetch(
				`${apiBaseUrl.replace(/\/$/, "")}/api/reservation/${reservaQuery.data.reservationId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						NewStartDate: serializeDateOnly(startDate),
						NewEndDate: serializeDateOnly(endDate),
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
				throw new Error(data?.message ?? data?.error ?? data?.title ?? "No se pudo modificar la reserva.");
			}

			setStep("success");
			await reservaQuery.refetch();
		} catch (error) {
			setPaymentError(error instanceof Error ? error.message : "No se pudo modificar la reserva.");
		} finally {
			setIsProcessingPayment(false);
		}
	}

	const paymentAmount = Math.max(0, delta);
	const oldReservationDays = reservaQuery.data
		? Math.max(
			1,
			Math.abs(
				differenceInCalendarDays(
					parseDateOnly(reservaQuery.data.checkInDate),
					parseDateOnly(reservaQuery.data.checkOutDate),
				),
			),
		)
		: 0;
	const requiresPaidModification = Boolean(
		reservaQuery.data &&
		Math.max(1, selectedDays - 1) > oldReservationDays &&
		(
			reservaQuery.data.state === ReservationState.ConfirmedPaymentIncomplete ||
			reservaQuery.data.state === ReservationState.ConfirmedPaymentComplete
		),
	);

	if (authQuery.isPending) {
		return <LoadingState label="Verificando sesión..." />;
	}

	if (!authQuery.data) {
		return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Necesitás iniciar sesión para modificar la reserva.</main>;
	}

	if (reservaQuery.isPending) {
		return <LoadingState label="Cargando reserva..." />;
	}

	if (!reservaQuery.data) {
		return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Reserva no encontrada.</main>;
	}

	if (reservaQuery.data.state == ReservationState.Cancelled)
		return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
			<Link
				to={`/reservas/${reservaQuery.data.reservationId}`}
				className="pb-4 flex gap-1 items-center text-primary font-medium"
			>
				<ChevronLeft />
				Volver
			</Link>
			No puede modificar una reserva cancelada.
		</main>;

	function addHours(date: Date, hours: number): number {
		const newDate = new Date(date.getTime());
		newDate.setTime(newDate.getTime() + hours * 60 * 60 * 1000); // or hours * 3_600_000
		return newDate.getUTCDate();
	}
	
	const allowedTime = new Date(reservaQuery.data.checkInDate).getTime() - 60 * 60 * 1000;
    if (Date.now() > allowedTime)
		return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
			<Link
				to={`/reservas/${reservaQuery.data.reservationId}`}
				className="pb-4 flex gap-1 items-center text-primary font-medium"
			>
				<ChevronLeft />
				Volver
			</Link>
			No puede modificar una reserva cancelada.
		</main>;

	const payed = reservaQuery.data.payments.reduce((acc, r) => acc + r.amount, 0);

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<div>
						{/* <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">Modificar reserva</p>
             */}
						<Link
							to={`/reservas/${reservaQuery.data.reservationId}`}
							className="pb-4 flex gap-1 items-center text-primary font-medium"
						>
							<ChevronLeft />
							Volver
						</Link>
						<h1 className="font-serif text-5xl tracking-tighter text-[#385347]">Modificar reserva</h1>
					</div>
					<span className="rounded-full border border-[#d7d1c7] bg-[#edf2e8] px-2.5 py-1 text-xs font-semibold text-[#385347]">
						{getReservationStateLabel(reservaQuery.data.state)}
					</span>
				</div>

				<div className="mb-6 rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-4 text-sm text-[#68716a]">
					<p>Reserva actual: {formatDate(reservaQuery.data.checkInDate)} — {formatDate(reservaQuery.data.checkOutDate)}</p>
					<p className="mt-1">Monto actual: {originalTotal == null ? "Precio a confirmar" : formatPrice(originalTotal)}</p>
					{/* TODO(G1+G3): habilitar la comparación de montos cuando el backend exponga el total */}
				</div>

				{step === "dates" ? (
					<div className="mx-auto w-full max-w-md rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-3 shadow-sm sm:p-4">
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

						<div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-[#68716a]">
							{weekdays.map((day) => (
								<div key={day} className="py-1 font-bold uppercase">{day}</div>
							))}
							{days.map((day, index) =>
								day ? (() => {
									const selected = isBetween(day, rangeStart, rangeEnd) || Boolean(rangeStart && dateKey(day) === dateKey(rangeStart));
									const conflict = isReservedDay(day);
									return (
										<button
											key={dateKey(day)}
											type="button"
											disabled={conflict || !isSelectableDay(day)}
											onClick={() => handleDayClick(day)}
											className={`aspect-square rounded-sm border border-transparent p-0.5 transition flex h-full items-center justify-center text-xs font-semibold ${conflict
												? "cursor-not-allowed border-[#e7a4a4] bg-[#fde2e2] text-[#b42318]"
												: !isSelectableDay(day)
													? "cursor-not-allowed bg-[#f0efe9] text-[#a6a29a]"
													: selected
														? "bg-[#385347] text-white shadow-sm"
														: "bg-[#edf2e8] text-[#385347] hover:bg-[#dce8d8]"
												}`}
											aria-label={`${day.getDate()} de ${monthFormatter.format(month)}${conflict ? ", reservado" : ", disponible"}`}
										>
											{day.getDate()}
										</button>
									);
								})() : <div key={`empty-${index}`} />,
							)}
						</div>

						<p className="mt-3 text-center text-xs text-[#68716a]" aria-live="polite">
							{!rangeStart
								? "Elegí el primer día de estadía."
								: !rangeEnd
									? "Ahora elegí el último día de estadía. La salida será al día siguiente."
									: "Para empezar una nueva selección, elegí otra fecha."}
						</p>

						<div className="mt-4 flex flex-wrap gap-4 border-t border-[#ece7df] pt-3 text-xs text-[#4d5b55]">
							<span className="inline-flex items-center gap-1.5"><CircleCheck size={14} className="text-[#6b8b63]" /> Disponible</span>
							<span className="inline-flex items-center gap-1.5"><CircleX size={14} className="text-[#c7765a]" /> Reservado</span>
							{rangeStart && rangeEnd && checkoutDate && (
								<span className="w-full text-[#385347]">
									{dateKeyReadable(rangeStart)} a {dateKeyReadable(rangeEnd)} (salida el {dateKeyReadable(checkoutDate)})
								</span>
							)}
						</div>

						{isLoadingAvailability && (
							<LoadingState
								variant="inline"
								label="Verificando disponibilidad..."
								className="mt-3"
							/>
						)}
						{availabilityError && <p className="mt-3 text-sm text-[#b42318]" role="alert">{availabilityError}</p>}
						{dateSelectionError && <p className="mt-3 text-sm text-[#b42318]" role="alert">{dateSelectionError}</p>}

						<button
							type="button"
							disabled={
								!rangeStart ||
								!rangeEnd ||
								isUnchangedDateRange ||
								isLoadingAvailability ||
								Boolean(availabilityError)
							}
							onClick={handleContinueToPayment}
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
								<p className="font-medium text-[#202722]">{rangeStart && rangeEnd ? `${formatDate(rangeStart)} — ${formatDate(rangeEnd)}` : "Sin fechas"}</p>
							</div>
							<div className="text-right">
								<p className="text-sm text-[#68716a]">Monto a pagar:</p>
								<p className="text-xl font-semibold text-[#202722]">{formatPrice((reservaQuery.data.fullCost - payed) + delta)}</p>
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

						{paymentError && <p className="mt-3 text-sm text-[#b74f3d]">{paymentError}</p>}

						{!showCardForm ? (
							<button
								type="button"
								onClick={requiresPaidModification ? () => setShowCardForm(true) : handleSaveDates}
								disabled={isProcessingPayment}
								className="ui-button ui-button-md ui-button-block mt-2"
							>
								{requiresPaidModification ? "Continuar al pago" : "Guardar modificación"}
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
							<button type="button" onClick={() => navigate(`/reservas/${id}`)} className="ui-button ui-button-sm">Cancelar</button>
						</div>
					</div>
				) : step === "success" ? (
					<div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-6 text-center">
						<CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[#2d6a4f]" />
						<p className="text-lg text-[#202722]">Tu reserva fue modificada correctamente.</p>
						<p className="mt-2 text-sm text-[#68716a]">Se envió la confirmación al correo {userEmail}</p>
						<button type="button" onClick={() => navigate(`/reservas/${id}`)} className="ui-button ui-button-md mt-5">
							Volver al detalle
						</button>
					</div>
				) : null}
			</section>
		</main>
	);
}
