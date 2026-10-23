import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "~/utils/api";

type ReservationState = {
	id?: string;
	apartmentId: string;
	apartmentName?: string;
	apartmentLocation?: string;
	pricePerDay?: number;
	checkInDate: string;
	checkOutDate: string;
	reservationState?: number;
	totalPrice?: number;
	depositAmount?: number;
	fullAmount?: number;
};

type ReservationPayment = {
	amount?: number;
	paymentAmount?: number;
	amountPaid?: number;
	type?: string;
	paymentType?: string;
	concept?: string;
};

function getReservationPayload(data: any) {
	const result = data?.value ?? data?.data ?? data;
	return result?.reservation ?? result;
}

function getDepositAmount(payments: ReservationPayment[], total: number) {
	const depositPayment = payments.find((payment) => {
		const description = `${payment.type ?? ""} ${payment.paymentType ?? ""} ${payment.concept ?? ""}`.toLowerCase();
		return description.includes("deposit") || description.includes("seña") || description.includes("sena");
	});

	const amount = depositPayment?.amount ?? depositPayment?.paymentAmount ?? depositPayment?.amountPaid;
	return amount ?? (payments.length === 0 ? total * 0.1 : undefined);
}

const apiBaseUrl = import.meta.env.VITE_API_URL;

function formatDate(value: string) {
	return new Intl.DateTimeFormat("es-AR", {
		day: "numeric",
		month: "long",
	}).format(new Date(value));
}

function formatPrice(value: number) {
	return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function getReservationStateLabel(state?: number) {
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
			return "No confirmada";
	}
}

export function meta() {
	return [{ title: "Reserva | Reservas Moreno" }];
}

export default function ReservaPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("full");
	const [showCardForm, setShowCardForm] = useState(false);
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [paymentApproved, setPaymentApproved] = useState(false);
	const [showUnconfirmedExitDialog, setShowUnconfirmedExitDialog] = useState(false);
	const reservationQuery = useQuery<ReservationState>({
		queryKey: ["reservation-detail", id],
		queryFn: async () => {
			const { data } = await api.get(`/api/reservation/${id}`);
			const reservation = getReservationPayload(data);
			const fullCost = Number(reservation?.fullCost ?? reservation?.totalPrice ?? 0);
			const payments = Array.isArray(reservation?.payments) ? reservation.payments : [];
			const depositAmount = getDepositAmount(payments, fullCost);
			return {
				...reservation,
				id: reservation?.resrevationId ?? reservation?.reservationId ?? reservation?.id,
				apartmentName:
					reservation?.apartmentName ??
					reservation?.ApartmentName ??
					reservation?.apartment?.name ??
					reservation?.apartment?.Name,
				reservationState: Number(reservation?.state ?? reservation?.reservationState ?? 0),
				totalPrice: fullCost,
				fullAmount: fullCost,
				depositAmount,
				payments,
			};
		},
		enabled: Boolean(id),
		retry: 2,
		retryDelay: (attempt) => (attempt + 1) * 500,
	});

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
		return (
			<main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
				Cargando reserva...
			</main>
		);
	}

	if (reservationQuery.isError || !reservationQuery.data) {
		return (
			<main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
				<p>No se pudo cargar la reserva.</p>
				<Link className="ui-text-link" to="/mis-reservas">
					Volver a mis reservas
				</Link>
			</main>
		);
	}

	const activeReservation = reservationQuery.data;
	const reservationState = Number(activeReservation.reservationState ?? 0);
	const selectedDays =
		Math.round(
			Math.abs(
				new Date(activeReservation.checkOutDate).getTime() -
					new Date(activeReservation.checkInDate).getTime(),
			) / 86_400_000,
		) + 1;
	const total =
		activeReservation.fullCost ??
		(activeReservation.fullAmount ??
			(activeReservation.pricePerDay ?? 0) * selectedDays);

	console.log(activeReservation);
	const deposit = activeReservation.depositAmount ?? total * 0.1;
	const remaining = Math.max(0, total - (activeReservation.depositAmount ?? 0));
	const getPaymentAmount = (option: "deposit" | "full") =>
		option === "deposit" ? deposit : total;
	const paymentAmount = getPaymentAmount(paymentOption);
	const showPaymentOptions = reservationState === 0 || reservationState === 1;
	const showCompleteInfoOnly = reservationState === 2;
 console.log("activeReservation", activeReservation);
	function closePaymentForm() {
		setShowCardForm(false);
		setPaymentError(null);
		setPaymentApproved(false);
	}

	async function handlePaymentSubmit(formData: any): Promise<void> {
		setIsProcessingPayment(true);
		setPaymentError(null);
		setPaymentApproved(false);

		try {
			const response = await fetch(
				`${apiBaseUrl.replace(/\/$/, "")}/api/Payment/process_card_payment/${activeReservation.apartmentId}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						...formData,
						reservationId: id,
						checkInDate: activeReservation.checkInDate,
						checkOutDate: activeReservation.checkOutDate,
						paymentOption,
						isModification: false,
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
				throw new Error(
					data?.message ?? data?.error ?? data?.title ?? "No se pudo procesar el pago.",
				);
			}

			const status = Number(data?.paymentStatus ?? data?.status ?? data?.payment_status ?? 0);
			if (status === 2) {
				setPaymentApproved(true);
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

	const paymentChoices: {
		title: string;
		description: string;
		option: "deposit" | "full";
	}[] = [
		{
			title: "Pagar seña",
			description: "Confirmar la reserva pagando un porcentaje ahora, y pagar el resto más tarde",
			option: "deposit",
		},
		{
			title: "Pagar monto completo",
			description: "Asegurar la reserva pagando el monto total ahora",
			option: "full",
		},
	];

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
				<Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">
					reservas<span className="text-[#e28b68]">moreno</span>
				</Link>
				<div className="flex items-center gap-3 text-sm text-[#385347]">
					<Link to="/mis-reservas" className="ui-link">
						Mis reservas
					</Link>
				</div>
			</header>

			<section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
				<div className="flex flex-wrap items-end justify-between gap-5">
					<div>
						<h1 className="font-serif text-5xl tracking-[-0.05em] text-[#202722]">Reserva</h1>
						<p className="mt-2 text-sm text-[#68716a]">
							{activeReservation.apartmentName ?? "Departamento"}
						</p>
					</div>
					<p className="text-2xl font-bold text-[#202722]">Monto total: {formatPrice(total)}</p>
				</div>

				<div className="mt-8 grid gap-4 rounded-md bg-[#e7e4dc] p-5 text-sm md:grid-cols-4">
					<p>Inicio: {formatDate(activeReservation.checkInDate)}</p>
					<p>Fin: {formatDate(activeReservation.checkOutDate)}</p>
					<p>Ubicación: {activeReservation.apartmentLocation ?? activeReservation.apartmentName}</p>
					<p>Estado: {getReservationStateLabel(reservationState)}</p>
				</div>

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
								{getReservationStateLabel(reservationState)}
							</p>
							<p>
								<strong className="text-[#202722]">Saldo restante:</strong>
								{formatPrice(remaining)}
							</p>
						</div>
					</div>
				) : showPaymentOptions ? (
					<div className="mt-8 grid gap-8 lg:grid-cols-2">
						{paymentChoices.map(({ title, description, option }) => (
							<article
								key={title}
								className="flex min-h-80 flex-col border border-dashed border-[#c8c2b8] p-8"
							>
								<h2 className="text-center font-serif text-3xl font-bold text-[#202722]">{title}</h2>
								<p className="mt-3 max-w-md text-sm">{description}</p>
								<p className="mt-3 text-sm font-semibold">
									{formatPrice(getPaymentAmount(option))}
								</p>
								{showCardForm && paymentOption === option && !paymentApproved ? (
									<div className="mt-4 rounded-md border border-[#e0ded5] bg-[#f8f4ef] p-3">
										<div className="mb-3 flex justify-end">
											<button
												type="button"
												onClick={closePaymentForm}
												disabled={isProcessingPayment}
												className="ui-icon-button p-1.5 disabled:cursor-not-allowed disabled:opacity-50"
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
											initialization={{ amount: paymentAmount }}
											onReady={() => undefined}
											onSubmit={(formData: any) => handlePaymentSubmit(formData)}
											onError={(error: any) => {
												setPaymentError(error?.message ?? "No se pudo inicializar el pago.");
											}}
										/>
										{isProcessingPayment && (
											<div className="mt-3 text-center text-sm font-medium text-[#385347]">
												Procesando pago...
											</div>
										)}
									</div>
								) : (
									<button
										type="button"
										onClick={() => {
											setPaymentOption(option as "deposit" | "full");
											setShowCardForm(true);
										}}
										className="ui-button ui-button-sm mt-auto self-center bg-[#2d6a4f] text-white"
									>
										Confirmar reserva
									</button>
								)}
							</article>
						))}
					</div>
				) : null}

				{paymentError && <p className="mt-4 text-sm text-[#b74f3d]">{paymentError}</p>}
				{paymentApproved && (
					<p className="mt-4 text-sm font-semibold text-[#2d6a4f]">Pago aprobado correctamente.</p>
				)}
				{showPaymentOptions && !showCompleteInfoOnly && (
					<div className="mt-6 flex flex-wrap items-center justify-between gap-4">
						<div className="flex w-full flex-wrap justify-between gap-3">
							<button
								type="button"
								onClick={() => setShowUnconfirmedExitDialog(true)}
								className="ui-button ui-button-sm"
							>
								Reservar sin confirmar
							</button>
							<button
								type="button"
								onClick={() => navigate(`/departamento/${activeReservation.apartmentId}`)}
								className="ui-button ui-button-sm bg-[#a90000] text-white"
							>
								Cancelar reserva
							</button>
						</div>
					</div>
				)}
			</section>
			{showUnconfirmedExitDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="unconfirmed-exit-title"
						aria-describedby="unconfirmed-exit-description"
						className="w-full max-w-md rounded-md bg-[#fffdf9] p-6 text-[#202722] shadow-xl"
					>
						<h2 id="unconfirmed-exit-title" className="font-serif text-2xl text-[#385347]">
							¿Reservar sin confirmar?
						</h2>
						<p id="unconfirmed-exit-description" className="mt-3 text-sm text-[#68716a]">
							Si no confirmás la reserva, las fechas seguirán disponibles y cualquier usuario podrá reservarlas.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowUnconfirmedExitDialog(false)}
								className="ui-button ui-button-sm bg-[#a90000] text-white"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => navigate("/")}
								className="ui-button ui-button-sm bg-[#2d6a4f] text-white"
							>
								Aceptar
							</button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
