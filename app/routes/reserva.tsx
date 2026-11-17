import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import ConfirmReservationCancellationModal from "~/components/ConfirmReservationCancellationModal";
import LoadingState from "~/components/LoadingState";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import api, { cancelReservation } from "~/utils/api";
import { ReservationState } from "~/types/Reserva";
import { PaymentStatus, type ReservationDetail } from "~/types/ReservationDetail";
import { trackedFetch } from "~/utils/requestProgress";

const apiBaseUrl = import.meta.env.VITE_API_URL;
const paymentEndpoints = {
	deposit: "process_sign_payment",
	full: "process_card_payment",
	rest: "process_rest_payment",
} as const;

type PaymentOption = keyof typeof paymentEndpoints;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseReservationState(value: unknown): ReservationState | undefined {
	if (typeof value === "number" && isReservationState(value)) return value;
	if (typeof value !== "string") return undefined;

	const matchingEntry = Object.entries(ReservationState).find(
		([name, state]) =>
			typeof state === "number" &&
			(name.toLowerCase() === value.toLowerCase() || String(state) === value),
	);
	return matchingEntry && isReservationState(matchingEntry[1])
		? matchingEntry[1]
		: undefined;
}

function isReservationState(value: unknown): value is ReservationState {
	return typeof value === "number" && Object.values(ReservationState).includes(value);
}

function formatDate(value: string) {
	const [year, month, day] = value.slice(0, 10).split("-").map(Number);
	const date = new Date(year, month - 1, day);
	return new Intl.DateTimeFormat("es-AR", {
		day: "numeric",
		month: "long",
	}).format(date);
}

function formatPrice(value: number) {
	return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function formatPaymentDate(value: string) {
	return new Intl.DateTimeFormat("es-AR", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

function getPaymentStatusLabel(status: PaymentStatus) {
	const labels: Record<PaymentStatus, string> = {
		[PaymentStatus.Pending]: "Pendiente",
		[PaymentStatus.Approved]: "Aprobado",
		[PaymentStatus.InProcess]: "En proceso",
		[PaymentStatus.Rejected]: "Rechazado",
		[PaymentStatus.Cancelled]: "Cancelado",
		[PaymentStatus.Refunded]: "Reembolsado",
		[PaymentStatus.ChargedBack]: "Contracargo",
		[PaymentStatus.InMediation]: "En mediación",
	};

	return labels[status] ?? `Desconocido (${status})`;
}

function getReservationStateLabel(state?: ReservationState) {
	return RESERVATION_STATE_LABEL[state!] ?? "No confirmada";
}

export function meta() {
	return [{ title: "Reserva | Reservas Moreno" }];
}

export default function ReservaPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { id } = useParams();
	const [paymentOption, setPaymentOption] = useState<"deposit" | "full" | "rest">("full");
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [showCardForm, setShowCardForm] = useState(false);
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [paymentApproved, setPaymentApproved] = useState(false);
	const [reservationStateOverride, setReservationStateOverride] = useState<{
		reservationId: string;
		state: ReservationState;
	} | null>(null);
	const reservationQuery = useQuery<ReservationDetail>({
		queryKey: ["reservation-detail", id],
		queryFn: async () => {
			const { data } = await api.get(`/api/reservation/${id}`);
			return data;
		},
		enabled: Boolean(id),
		retry: 2,
		retryDelay: (attempt) => (attempt + 1) * 500,
	});
	const cancelMutation = useMutation({
		mutationFn: cancelReservation,
		meta: { silent: true },
		onSuccess: async () => {
			setIsCancelDialogOpen(false);
			toast.success("La reserva se canceló correctamente.");
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["my-reservations"] }),
				queryClient.invalidateQueries({ queryKey: ["reservation-detail", id] }),
			]);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "No se pudo cancelar la reserva.",
			);
		},
	});

	const reservation = reservationQuery.data;

	useEffect(() => {
		initMercadoPago("TEST-440e66b5-54b5-49f2-9930-3dd2e1baed8e");
	}, []);

	if (!id) {
		return (
			<main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
				<p>Falta el identificador de la reserva.</p>
				<Link className="ui-text-link" to="/">
					Volver al inicio
				</Link>
			</main>
		);
	}

	if (reservationQuery.isPending) {
		return <LoadingState label="Cargando reserva..." />;
	}

	if (reservationQuery.isError || !reservation) {
		return (
			<main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
				<p>No se pudo cargar la reserva.</p>
				<Link className="ui-text-link" to="/reservas">
					Volver a mis reservas
				</Link>
			</main>
		);
	}

	const activeReservation =
		reservationStateOverride?.reservationId === reservation.reservationId
			? { ...reservation, state: reservationStateOverride.state }
			: reservation;
	const reservationState = activeReservation.state;
	const total = activeReservation.fullCost;
	const deposit = total * 0.1;
	const paidAmount = activeReservation.payments.reduce(
		(amount, payment) => amount + payment.amount,
		0,
	);
	const remaining = Math.max(0, total - paidAmount);
	const canPayDeposit = reservationState === ReservationState.NotConfirmed;
	const canPayFull = reservationState === ReservationState.NotConfirmed;
	const canPayRest = reservationState === ReservationState.ConfirmedPaymentIncomplete;
	const showCompleteInfoOnly =
		reservationState === ReservationState.ConfirmedPaymentComplete;

	function closePaymentForm() {
		setShowCardForm(false);
		setPaymentError(null);
		setPaymentApproved(false);
	}

	function renderPaymentOptionCard({
		title,
		description,
		option,
		amount,
	}: {
		title: string;
		description: string;
		option: PaymentOption;
		amount: number;
	}) {
		return (
			<article className="flex min-h-80 flex-col border border-dashed border-[#c8c2b8] p-8">
				<h2 className="text-center font-serif text-3xl font-bold text-[#202722]">
					{title}
				</h2>
				<p className="mt-3 max-w-md text-sm">{description}</p>
				<p className="mt-3 text-sm font-semibold">{formatPrice(amount)}</p>
				{showCardForm && paymentOption === option && !paymentApproved ? (
					<div className="mt-4 rounded-md border border-[#e0ded5] bg-[#f8f4ef] p-3">
						{isProcessingPayment ? (
							<div
								className="flex min-h-64 flex-col items-center justify-center gap-3 text-[#385347]"
								role="status"
								aria-live="polite"
							>
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#385347] border-t-transparent" />
								<p className="text-sm font-medium">Procesando pago...</p>
							</div>
						) : (
							<>
								<div className="mb-3 flex justify-end">
									<button
										type="button"
										onClick={closePaymentForm}
										className="ui-icon-button p-1.5"
										aria-label="Cerrar formulario de pago"
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											className="h-4 w-4"
										>
											<path d="M18 6L6 18M6 6l12 12" />
										</svg>
									</button>
								</div>
								<CardPayment
									initialization={{ amount }}
									onReady={() => undefined}
									onSubmit={(formData: any) => handlePaymentSubmit(formData, option)}
									onError={(error: any) => {
										setPaymentError(
											error?.message ?? "No se pudo inicializar el pago.",
										);
									}}
								/>
							</>
						)}
					</div>
				) : (
					<button
						type="button"
						onClick={() => {
							setPaymentOption(option);
							setPaymentError(null);
							setPaymentApproved(false);
							setShowCardForm(true);
						}}
						className="ui-button ui-button-sm mt-auto self-center"
					>
						{option == "rest" ? "Completar pago" : "Confirmar reserva"}
					</button>
				)}
			</article>
		);
	}

	async function handlePaymentSubmit(formData: any, option: PaymentOption): Promise<void> {
		setIsProcessingPayment(true);
		setPaymentError(null);
		setPaymentApproved(false);

		try {
			const response = await trackedFetch(
				`${apiBaseUrl.replace(/\/$/, "")}/api/Payment/${paymentEndpoints[option]}/${option === "rest" ? activeReservation.reservationId : activeReservation.apartmentId}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						...formData,
						reservationId: activeReservation.reservationId,
						checkInDate: activeReservation.checkInDate,
						checkOutDate: activeReservation.checkOutDate,
						paymentOption,
						isModification: false,
					}),
				},
			);

			const rawText = await response.text();
			let data: Record<string, unknown> = {};
			if (rawText) {
				try {
					const parsed: unknown = JSON.parse(rawText);
					if (isRecord(parsed)) data = parsed;
					else data = { message: rawText };
				} catch {
					data = { message: rawText };
				}
			}

			if (!response.ok) {
				const message = [data.message, data.error, data.title].find(
					(value): value is string => typeof value === "string",
				);
				throw new Error(
					message ?? "No se pudo procesar el pago.",
				);
			}

			const status = Number(data.paymentStatus ?? data.status ?? data.payment_status ?? 0);
			if (status === 2) {
				setPaymentApproved(true);
				const nextState =
					parseReservationState(data.state) ??
					(option === "deposit"
						? ReservationState.ConfirmedPaymentIncomplete
						: ReservationState.ConfirmedPaymentComplete);
				setReservationStateOverride({
					reservationId: activeReservation.reservationId,
					state: nextState,
				});
				void reservationQuery.refetch();
				return;
			}
			if (status === 1) {
				throw new Error("Pago pendiente. Mercado Pago continuará el proceso y te avisará cuando se confirme.");
			}
			if (status === 4) {
				throw new Error("El pago fue rechazado. Verificá los datos de tu tarjeta.");
			}
			if (status === 5) {
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

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
				<div className="flex flex-wrap items-end justify-between gap-5">
					<div>
						<h1 className="font-serif text-5xl tracking-tighter text-[#202722]">Reserva</h1>
						<p className="mt-2 text-sm text-[#68716a]">
							{activeReservation.apartment?.name ?? "Departamento no disponible"}
						</p>
					</div>
					<p className="text-2xl font-bold text-[#202722]">Monto total: {formatPrice(total)}</p>
				</div>

				<div className="mt-8 grid gap-4 rounded-md bg-[#e7e4dc] p-5 text-sm md:grid-cols-4">
					<p>Inicio: {formatDate(activeReservation.checkInDate)}</p>
					<p>Fin: {formatDate(activeReservation.checkOutDate)}</p>
					<p>Ubicación: {activeReservation.apartment?.name ?? "Departamento no disponible"}</p>
					<p>Estado: {getReservationStateLabel(reservationState)}</p>
				</div>
				<p className="my-3">
					La entrada al departamento es el {formatDate(activeReservation.checkInDate)} a la tarde, y la salida salida el {formatDate(new Date(new Date(activeReservation.checkOutDate).setUTCDate(new Date(activeReservation.checkOutDate).getUTCDate() + 1)).toISOString())} a la mañana. 
					{activeReservation.state == ReservationState.NotConfirmed && <strong> Mientras que su reserva no este confirmada, otra persona puede hacer una reserva en el mismo plazo que usted.</strong>}
				</p>

				{showCompleteInfoOnly ? (
					<div className="mt-8 rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-6 text-[#202722]">
						<h2 className="font-serif text-3xl text-[#385347]">Información de la reserva</h2>
						<div className="mt-4 space-y-2 text-sm text-[#68716a]">
							<p>
								<strong className="text-[#202722]">Total:</strong> {formatPrice(total)}
							</p>
							<p>
								<strong className="text-[#202722]">Seña:</strong> {formatPrice(deposit)}
							</p>
							<p>
								<strong className="text-[#202722]">Estado:</strong>
								&nbsp;{getReservationStateLabel(reservationState)}
							</p>
							<p>
								<strong className="text-[#202722]">Saldo restante:</strong>
								{formatPrice(remaining)}
							</p>
						</div>
					</div>
				) : canPayDeposit || canPayFull || canPayRest ? (
					<div className="mt-8 grid gap-8 md:grid-cols-2">
						{canPayDeposit &&
							renderPaymentOptionCard({
								title: "Pagar seña",
								description:
									"Confirmar la reserva pagando un porcentaje ahora, y pagar el resto más tarde",
								option: "deposit",
								amount: deposit,
							})}
						{canPayFull &&
							renderPaymentOptionCard({
								title: "Pagar reserva completa",
								description: "Asegurar la reserva pagando el monto total ahora",
								option: "full",
								amount: total,
							})}
						{canPayRest && renderPaymentOptionCard({
								title: "Pagar resto",
								description: "Completar el pago pendiente de la reserva",
								option: "rest",
								amount: total,
							})}
					</div>
				) : (
					<div className="mt-8 rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-6 text-sm text-[#68716a]">
						No hay forma de pago disponible para esta reserva.
					</div>
				)}

				{paymentError && <p className="mt-4 text-sm text-[#b74f3d]">{paymentError}</p>}
				{paymentApproved && (
					<p className="mt-4 text-sm font-semibold text-[#2d6a4f]">Pago aprobado correctamente.</p>
				)}
				<div className="mt-6 flex justify-end gap-3">
					{
						reservation.state != ReservationState.Cancelled &&
						<button
							type="button"
							onClick={() => navigate(`/reservas/${id}/modificar`)}
							className="ui-button ui-button-md min-w-44 bg-[#385347] text-white"
						>
							Modificar reserva
						</button>
					}
					{canPayDeposit || canPayFull ? (
						<button
							type="button"
							onClick={() => setIsCancelDialogOpen(true)}
							disabled={cancelMutation.isPending}
							className="ui-button ui-button-md min-w-44 bg-[#a90000] text-white"
						>
							Cancelar reserva
						</button>
					) : null}
				</div>

				<section
					aria-labelledby="reservation-payments-title"
					className="mt-8 rounded-md border border-[#e0ded5] bg-[#fffdf9] p-6"
				>
					<div className="flex flex-wrap items-baseline justify-between gap-3">
						<h2
							id="reservation-payments-title"
							className="font-serif text-3xl text-[#385347]"
						>
							Pagos hechos
						</h2>
						<p className="text-sm text-[#68716a]">
							{activeReservation.payments.length}{" "}
							{activeReservation.payments.length === 1 ? "pago registrado" : "pagos registrados"}
						</p>
					</div>
					{activeReservation.payments.length > 0 ? (
						<ul className="mt-5 space-y-3">
							{activeReservation.payments.map((payment) => (
								<li
									key={payment.id}
									className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-[#ece7df] bg-white p-4"
								>
									<div>
										<p className="font-semibold text-[#202722]">
											{formatPrice(payment.amount)}
										</p>
										<p className="mt-1 text-sm text-[#68716a]">
											{formatPaymentDate(payment.paymentDate)}
										</p>
										<p className="mt-1 text-sm text-[#68716a]">
											{payment.isManual ? "Pago manual" : "Pago en línea"}
											{payment.isSign ? " · Seña" : ""}
											{payment.isRefund ? " · Reembolso" : ""}
										</p>
									</div>
									<span className="rounded-full bg-[#edf2e8] px-3 py-1 text-sm font-medium text-[#385347]">
										{getPaymentStatusLabel(payment.paymentStatus)}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className="mt-4 text-sm text-[#68716a]">
							Todavía no hay pagos registrados para esta reserva.
						</p>
					)}
				</section>
				<ConfirmReservationCancellationModal
					isOpen={isCancelDialogOpen}
					isPending={cancelMutation.isPending}
					onClose={() => setIsCancelDialogOpen(false)}
					onConfirm={() => cancelMutation.mutate(activeReservation.reservationId)}
				/>
			</section>
			
		</main>
	);
}
