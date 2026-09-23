import { Link, useLocation, useNavigate } from "react-router";

type ReservationState = {
	apartmentId: string;
	apartmentName?: string;
	apartmentLocation?: string;
	pricePerDay: number;
	checkInDate: string;
	checkOutDate: string;
};

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
	const reservation = (location.state as { reservation?: ReservationState } | null)
		?.reservation;

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

	const selectedDays =
		Math.round(
			Math.abs(
				new Date(reservation.checkOutDate).getTime() -
					new Date(reservation.checkInDate).getTime(),
			) / 86_400_000,
		) + 1;
	const total = selectedDays * reservation.pricePerDay;

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
						["Pagar seña", "Confirmar la reserva pagando un porcentaje ahora, y pagar el resto mas tarde"],
						["Pagar reserva completa", "Asegurar la reserva pagando el monto total ahora"],
					].map(([title, description]) => (
						<article key={title} className="flex min-h-80 flex-col border border-dashed border-[#c8c2b8] p-8">
							<h2 className="text-center font-serif text-3xl font-bold text-[#202722]">{title}</h2>
							<p className="mt-3 max-w-md text-sm">{description}</p>
							<button type="button" className="ui-button ui-button-sm mt-auto self-center">Confirmar reserva</button>
						</article>
					))}
				</div>
			</section>
		</main>
	);
}