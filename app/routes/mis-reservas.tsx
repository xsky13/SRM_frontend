import { Link, useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserReservations } from "~/utils/api";
import LoadingState from "~/components/LoadingState";
import PaginationControls from "~/components/PaginationControls";
import { useAuthentication } from "~/components/NavegacionUsuario";
import { ReservationState } from "~/types/Reserva";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import type { ReservationListingDto } from "~/types/ReservationDetail";
import { formatDateOnly } from "~/utils/dateOnly";

export function meta() {
	return [{ title: "Mis reservas | Reservas Moreno" }];
}

const RESERVATIONS_PAGE_SIZE = 10;
const RESERVATION_STATE_FILTERS = [
	ReservationState.NotConfirmed,
	ReservationState.ConfirmedPaymentIncomplete,
	ReservationState.ConfirmedPaymentComplete,
	ReservationState.Cancelled,
] as const;

function formatDate(value: string) {
	return formatDateOnly(value, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function getReservationStateLabel(state: ReservationState) {
	return RESERVATION_STATE_LABEL[state] ?? "Desconocido";
}

function getReservationStateFilter(value: string | null): ReservationState | null {
	if (value === null) return null;
	const state = Number(value);
	return RESERVATION_STATE_FILTERS.find((validState) => validState === state) ?? null;
}

export default function MisReservasPage() {
	const authQuery = useAuthentication();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const reservationFilter = searchParams.get("filter") === "past" ? "past" : "upcoming";
	const reservationStateFilter = getReservationStateFilter(searchParams.get("state"));
	const pageParam = Number(searchParams.get("page"));
	const pageNumber = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const reservasQuery = useQuery({
		queryKey: ["my-reservations", authQuery.data?.id, reservationFilter, reservationStateFilter, pageNumber],
		queryFn: async () => {
			const userId = authQuery.data?.id;
			if (!userId) throw new Error("No se pudo identificar al usuario.");

			return getUserReservations(
				userId,
				reservationFilter === "upcoming" ? "future" : "past",
				pageNumber,
				RESERVATIONS_PAGE_SIZE,
				reservationStateFilter ?? undefined,
			);
		},
		enabled: authQuery.data?.id != null,
		meta: { silent: true },
		retry: 1,
	});

	if (authQuery.isPending) {
		return <LoadingState label="Verificando sesión..." />;
	}

	if (!authQuery.data) {
		return (
			<main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
				<div className="mx-auto max-w-xl rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-8 text-center">
					<h1 className="font-serif text-4xl text-[#385347]">Iniciá sesión</h1>
					<p className="mt-4 text-[#68716a]">
						Necesitás estar logueado para ver tus reservas.
					</p>
					<div className="mt-6 flex justify-center gap-4">
						<Link to="/login" className="ui-button ui-button-sm">
							Iniciar sesión
						</Link>
						<Link to="/" className="ui-link">
							Volver al inicio
						</Link>
					</div>
				</div>
			</main>
		);
	}

	if (reservasQuery.isPending) {
		return <LoadingState label="Cargando reservas..." />;
	}

	if (reservasQuery.isError) {
		return (
			<main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
				No se pudieron cargar las reservas:{" "}
				{reservasQuery.error instanceof Error
					? reservasQuery.error.message
					: "Error desconocido"}
			</main>
		);
	}

	const reservationsPage = reservasQuery.data;
	const visibleReservations: ReservationListingDto[] = reservationsPage.data.filter(r => !r.isDeleted);
	const deletedReservations: ReservationListingDto[] = reservationsPage.data.filter(r => r.isDeleted);

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
				<div className="mb-8 flex items-end justify-between gap-4">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">
							Cuenta
						</p>
						<h1 className="font-serif text-5xl tracking-tighter text-[#385347]">
							Mis reservas
						</h1>
					</div>
					<p className="text-sm text-[#68716a]">
						{reservationsPage.totalRecords} reserva{reservationsPage.totalRecords === 1 ? "" : "s"}
					</p>
				</div>

				<div
					className="mb-5 flex gap-2 border-b border-[#d7d1c7]"
					role="tablist"
					aria-label="Filtrar reservas por fecha"
				>
					<button
						type="button"
						role="tab"
						id="upcoming-reservations-tab"
						aria-selected={reservationFilter === "upcoming"}
						aria-controls="reservations-panel"
						onClick={() => {
							setSearchParams((current) => {
								const next = new URLSearchParams(current);
								next.set("filter", "upcoming");
								next.set("page", "1");
								return next;
							});
						}}
						className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${reservationFilter === "upcoming"
							? "border-[#385347] text-[#385347]"
							: "border-transparent text-[#68716a] hover:text-[#385347]"
							}`}
					>
						Próximas
					</button>
					<button
						type="button"
						role="tab"
						id="past-reservations-tab"
						aria-selected={reservationFilter === "past"}
						aria-controls="reservations-panel"
						onClick={() => {
							setSearchParams((current) => {
								const next = new URLSearchParams(current);
								next.set("filter", "past");
								next.set("page", "1");
								return next;
							});
						}}
						className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${reservationFilter === "past"
							? "border-[#385347] text-[#385347]"
							: "border-transparent text-[#68716a] hover:text-[#385347]"
							}`}
					>
						Pasadas
					</button>
				</div>

				<div
					id="reservations-panel"
					role="tabpanel"
					aria-labelledby={
						reservationFilter === "upcoming"
							? "upcoming-reservations-tab"
							: "past-reservations-tab"
					}
					className="space-y-4"
				>
					<div className="flex justify-end">
						<label className="flex items-center gap-2 text-sm text-[#68716a]">
							Estado
							<select
								value={reservationStateFilter ?? "all"}
								onChange={(event) => {
									const value = event.target.value;
									setSearchParams((current) => {
										const next = new URLSearchParams(current);
										if (value === "all") {
											next.delete("state");
										} else {
											next.set("state", value);
										}
										next.set("page", "1");
										return next;
									});
								}}
								className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722]"
							>
								<option value="all">Todos los estados</option>
								{RESERVATION_STATE_FILTERS.map((state) => (
									<option key={state} value={state}>
										{getReservationStateLabel(state)}
									</option>
								))}
							</select>
						</label>
					</div>

					{visibleReservations.length === 0 ? (
						<div className="rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-8 text-center text-[#68716a]">
							{reservationStateFilter === null
								? reservationFilter === "upcoming"
									? "No hay reservas próximas."
									: "No hay reservas pasadas."
								: `No hay reservas con estado ${getReservationStateLabel(reservationStateFilter)} en este período.`}
						</div>
					) : visibleReservations.map((reserva) => (
						<article
							key={reserva.id}
							className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] text-[#385347] p-5 shadow-sm transition hover:border-[#c8c2b8]"
						>
							<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#e28b68]">
										{/* {reserva.apartmentLocation ?? "Ubicación no disponible"} */}
										Reserva en:
									</p>
									<h2 className="mt-1 font-serif text-2xl! text-[#385347]">
										{reserva.apartmentName ?? "Departamento"}
									</h2>
									<p className="mt-2 text-sm text-[#68716a]">
										{formatDate(reserva.checkInDate)} —{" "}
										{formatDate(reserva.checkOutDate)}
									</p>
								</div>

								<div className="flex flex-col items-start gap-2 md:items-end">
									<span className="rounded-full border border-[#d7d1c7] bg-[#edf2e8] px-2.5 py-1 text-xs font-semibold text-[#385347]">
										{getReservationStateLabel(reserva.reservationState)}
									</span>
									<button
										type="button"
										onClick={() => navigate(`/reservas/${reserva.id}`)}
										className="ui-button ui-button-sm"
									>
										Ver detalle
									</button>
									{/*<p className="text-sm text-[#68716a]">
                      Total:{" "}
                      {formatPrice(reserva.totalPrice ?? reserva.fullAmount)}
                    </p>*/}
								</div>
							</div>

							{/*<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#ece7df] pt-4">
                  <div className="text-sm text-[#68716a]">
                    <p>Seña: {formatPrice(reserva.depositAmount)}</p>
                    <p>Pago completo: {formatPrice(reserva.fullAmount)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/reservas/${reserva.id}`)}
                    className="ui-button ui-button-sm"
                  >
                    Ver detalle
                  </button>
                </div>*/}
						</article>
					))}

					{
						deletedReservations.length !== 0 &&
						<details className="rounded-md border border-[#e5e2da] bg-[#f2f0ea] px-4 py-3 text-gray-600">
							<summary className="cursor-pointer text-sm font-medium">
								Reservas eliminadas ({deletedReservations.length}) — solo como referencia
							</summary>
							<div className="mt-3 border-t border-[#e5e2da] pt-3">
								<p className="mb-2 text-xs leading-relaxed text-muted-foreground">
									La reserva o el departamento asociado ya no está disponible. Estos registros se conservan solo como referencia y no requieren ninguna acción.
								</p>
								<div className="divide-y divide-[#e5e2da]">
									{deletedReservations.map(reserva => (
										<div key={reserva.id} className="py-2 text-sm first:pt-0 last:pb-0">
											<p className="font-medium">
												Reserva en {reserva.apartmentName || "Departamento no disponible"}
											</p>
											<p className="mt-1 text-xs text-[#858980]">
												{formatDate(reserva.checkInDate)} —{" "}
												{formatDate(reserva.checkOutDate)}
											</p>
										</div>
									))}
								</div>
							</div>
						</details>

					}
				</div>

				{reservationsPage.totalRecords > 0 && (
					<PaginationControls
						currentPage={pageNumber}
						totalPages={reservationsPage.totalPages}
						summary={`Página ${reservationsPage.pageNumber} de ${reservationsPage.totalPages}`}
						onPageChange={(page) => {
							setSearchParams((current) => {
								const next = new URLSearchParams(current);
								next.set("page", String(page));
								return next;
							});
						}}
						isDisabled={reservasQuery.isFetching}
						ariaLabel="Paginación de mis reservas"
					/>
				)}
			</section>
		</main>
	);
}
