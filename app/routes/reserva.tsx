import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

type ReservationState = {
	apartmentId: string;
	apartmentName?: string;
	apartmentLocation?: string;
	pricePerDay: number;
	checkInDate: string;
	checkOutDate: string;
};

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

export function meta() {
	return [{ title: "Reserva | Reservas Moreno" }];
}

export default function ReservaPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("full");
	const [showCardForm, setShowCardForm] = useState(false);
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [paymentApproved, setPaymentApproved] = useState(false);
	const reservation = (location.state as { reservation?: ReservationState } | null)
		?.reservation;

	useEffect(() => {
		initMercadoPago("TEST-440e66b5-54b5-49f2-9930-3dd2e1baed8e");
	}, []);

	if (!reservation) {
		return (
			<main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
				<p>No se encontró la reserva.</p>
				<Link className="ui-text-link" to="/">
					Volver al inicio
				</Link>
			</main>
		);
	}

	const confirmedReservation = reservation;
	const selectedDays =
		Math.round(
			Math.abs(
				new Date(reservation.checkOutDate).getTime() -
					new Date(reservation.checkInDate).getTime(),
			) / 86_400_000,
		) + 1;
	const total = selectedDays * reservation.pricePerDay;
	const deposit = total * 0.1;
	const paymentAmount = paymentOption === "deposit" ? deposit : total;

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
				`${apiBaseUrl.replace(/\/$/, "")}/api/Payment/process_card_payment/${confirmedReservation.apartmentId}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						...formData,
						checkInDate: confirmedReservation.checkInDate,
						checkOutDate: confirmedReservation.checkOutDate,
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

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
				<Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">
					reservas<span className="text-[#e28b68]">moreno</span>
				</Link>
				{/* <div className="flex items-center gap-8 text-sm text-[#385347]">
					<Link to="/" className="ui-link">Legal</Link>
					<Link to="/" className="ui-link">Modificar cuenta</Link>
				</div> */}
			</header>

			<section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
				<div className="flex flex-wrap items-end justify-between gap-5">
					<h1 className="font-serif text-5xl tracking-[-0.05em] text-[#202722]">Reserva</h1>
					<p className="text-2xl font-bold text-[#202722]">Monto a pagar: {formatPrice(total)}</p>
				</div>

				<div className="mt-8 grid gap-4 rounded-md bg-[#e7e4dc] p-5 text-sm md:grid-cols-4">
					<p>Inicio: {formatDate(reservation.checkInDate)}</p>
					<p>Fin: {formatDate(reservation.checkOutDate)}</p>
					<p>Ubicación: {reservation.apartmentLocation ?? reservation.apartmentId}</p>
					<p>Estado: no confirmada</p>
				</div>

				<div className="mt-6 flex flex-wrap items-center justify-between gap-4">
					<p className="text-sm italic text-[#202722]">
						Si no confirma su reserva, cualquiera pueda sacar una reserva en las fechas que tiene
					</p>
					<div className="flex gap-4">
						<button type="button" disabled className="ui-button ui-button-sm opacity-50">Modificar reserva</button>
						<button type="button" onClick={() => navigate(`/departamento/${reservation.apartmentId}`)} className="ui-button ui-button-sm bg-[#a90000] text-white">Cancelar reserva</button>
					</div>
				</div>

				<div className="mt-9 grid gap-8 lg:grid-cols-2">
					{[
						["Pagar seña", "Confirmar la reserva pagando un porcentaje ahora, y pagar el resto mas tarde", "deposit"],
						["Pagar reserva completa", "Asegurar la reserva pagando el monto total ahora", "full"],
					].map(([title, description, option]) => (
						<article key={title} className="flex min-h-80 flex-col border border-dashed border-[#c8c2b8] p-8">
							<h2 className="text-center font-serif text-3xl font-bold text-[#202722]">{title}</h2>
							<p className="mt-3 max-w-md text-sm">{description}</p>
							<p className="mt-3 text-sm font-semibold">{formatPrice(title === "Pagar seña" ? deposit : total)}</p>
							{showCardForm && paymentOption === option && !paymentApproved ? (
								<div className="mt-4 rounded-md border border-[#e0ded5] bg-[#f8f4ef] p-3">
									<div className="mb-3 flex justify-end">
										<button
											type="button"
											onClick={closePaymentForm}
											disabled={isProcessingPayment}
											className="text-sm font-semibold text-[#385347] underline disabled:opacity-50"
										>
											Cerrar
										</button>
									</div>
									<CardPayment
										initialization={{ amount: paymentAmount }}
										onReady={() => undefined}
										onSubmit={handlePaymentSubmit}
										onError={(error: any) => setPaymentError(error?.message ?? "No se pudo inicializar el pago.")}
									/>
								</div>
							) : (
								<button
									type="button"
									disabled={isProcessingPayment}
									onClick={() => {
										setPaymentOption(option as "deposit" | "full");
										setPaymentError(null);
										setPaymentApproved(false);
										setShowCardForm(true);
									}}
									className="ui-button ui-button-sm mt-auto self-center"
								>
									Confirmar reserva
								</button>
							)}
							{showCardForm && paymentOption === option && paymentError && <p className="mt-3 text-sm text-[#b74f3d]">{paymentError}</p>}
							{showCardForm && paymentOption === option && paymentApproved && <p className="mt-auto text-center text-sm font-semibold text-[#2d6a4f]">Pago aprobado correctamente.</p>}
						</article>
					))}
				</div>
			</section>
		</main>
	);
}