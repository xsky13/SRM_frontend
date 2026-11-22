import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import { ReservationState } from "~/types/Reserva";
import { UserType } from "~/types/User";
import {
	PaymentStatus,
	type PagedResponse,
	type PaymentDto,
	type ReservationDetail,
} from "~/types/ReservationDetail";
import { useSearchParams } from "react-router";
import LoadingState from "~/components/LoadingState";
import PaginationControls from "~/components/PaginationControls";
import AddPaymentModal from "~/components/admin/AddPaymentModal";
import CancelReservationModal from "~/components/admin/CancelReservationModal";
import CreateReservationModal from "~/components/admin/CreateReservationModal";
import ReservationSearchSelectionModal from "~/components/admin/ReservationSearchSelectionModal";
import {
	cancelReservationAdmin,
	AdminReservationDateFilter,
	getAdminReservationById,
	getAdminReservations,
	getAdminReservationsByApartment,
	getAdminReservationsByUser,
	resolveImageUrl,
} from "~/utils/api";
import {
	differenceInCalendarDays,
	formatDateOnly,
	parseDateOnly,
} from "~/utils/dateOnly";

export function meta() {
	return [{ title: "Reservas | Administración | Reservas Moreno" }];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type ReservationSearchTarget = {
	type: "id" | "user" | "apartment";
	id: string;
	label: string;
};

type ReservationStateFilter = "all" | "confirmed" | "not-confirmed" | "cancelled";
type ReservationDateFilter = "all" | "past" | "future";

function formatDate(value: string) {
	return formatDateOnly(value, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function formatPaymentDate(value: string) {
	return new Intl.DateTimeFormat("es-AR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(value));
}

function isReservationStartInFuture(value: string) {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return parseDateOnly(value).getTime() > today.getTime();
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
		maximumFractionDigits: 0,
	}).format(value);
}

function getPaymentsTotal(payments: PaymentDto[]) {
	return payments.filter(p => p.paymentStatus == PaymentStatus.Approved).reduce((total, payment) => total + payment.amount, 0);
}

function getPaymentStatusLabel(status: PaymentStatus) {
	const labels: Record<PaymentStatus, string> = {
		[PaymentStatus.Pending]: "pendiente",
		[PaymentStatus.Approved]: "aprobado",
		[PaymentStatus.InProcess]: "en proceso",
		[PaymentStatus.Rejected]: "rechazado",
		[PaymentStatus.Cancelled]: "cancelado",
		[PaymentStatus.Refunded]: "reembolsado",
		[PaymentStatus.ChargedBack]: "contracargo",
		[PaymentStatus.InMediation]: "en mediación",
	};

	return labels[status] ?? `Desconocido (${status})`;
}

function getReservationStateLabel(state: ReservationState) {
	// Usa el enum compartido para tipar el índice de las etiquetas de estado.
	return RESERVATION_STATE_LABEL[state] ?? "Desconocido";
}

function getUserTypeLabel(userType: UserType) {
	switch (userType) {
		case UserType.Admin:
			return "Administrador";
		case UserType.User:
			return "Usuario";
		case UserType.Guest:
			return "Guest";
	}
}

function isReservationSearchType(value: string | null): value is ReservationSearchTarget["type"] {
	return value === "id" || value === "user" || value === "apartment";
}

function isReservationDateFilter(value: string | null): value is ReservationDateFilter {
	return value === "all" || value === "past" || value === "future";
}

function getApiDateFilter(filter: ReservationDateFilter): AdminReservationDateFilter {
	switch (filter) {
		case "past":
			return AdminReservationDateFilter.Past;
		case "future":
			return AdminReservationDateFilter.Future;
		default:
			return AdminReservationDateFilter.None;
	}
}

function getReservationPage(
	target: ReservationSearchTarget,
	pageNumber: number,
	pageSize: number,
	dateFilter: AdminReservationDateFilter,
): Promise<PagedResponse<ReservationDetail>> {
	switch (target.type) {
		case "id":
			return getAdminReservationById(target.id).then((reservation) => ({
				data: [reservation],
				pageNumber: 1,
				pageSize: 1,
				totalPages: 1,
				totalRecords: 1,
			}));
		case "user":
			return getAdminReservationsByUser(target.id, pageNumber, pageSize, dateFilter);
		case "apartment":
			return getAdminReservationsByApartment(target.id, pageNumber, pageSize, dateFilter);
	}
}

export default function AdminReservasPage() {
	const queryClient = useQueryClient();
	const [searchParams, setSearchParams] = useSearchParams();
	const pageParam = Number(searchParams.get("page"));
	const pageNumber = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
	const pageSizeParam = Number(searchParams.get("pageSize"));
	const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam) ? pageSizeParam : 10;
	const dateFilterParam = searchParams.get("dateFilter");
	const dateFilter = isReservationDateFilter(dateFilterParam) ? dateFilterParam : "all";
	const apiDateFilter = getApiDateFilter(dateFilter);
	const filterTypeParam = searchParams.get("filterType");
	const filterId = searchParams.get("filterId");
	const filterLabel = searchParams.get("filterLabel");
	const searchTarget =
		isReservationSearchType(filterTypeParam) && filterId
			? {
				type: filterTypeParam,
				id: filterId,
				label: filterLabel || filterId,
			}
			: null;
	const searchTypeParam = searchParams.get("searchType");
	const searchType = isReservationSearchType(searchTypeParam)
		? searchTypeParam
		: searchTarget?.type ?? "id";
	const [reservationIdInput, setReservationIdInput] = useState(
		searchTarget?.type === "id" ? searchTarget.id : "",
	);
	const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [stateFilter, setStateFilter] = useState<ReservationStateFilter>("all");

	const [selectedReservation, setSelectedReservation] = useState<ReservationDetail | null>(null);
	const [reservationToCancel, setReservationToCancel] = useState<ReservationDetail | null>(null);
	function updateSearchParameters(
		updates: Record<string, string | number | null | undefined>,
		replace = false,
	) {
		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current);
				for (const [key, value] of Object.entries(updates)) {
					if (value == null) {
						next.delete(key);
					} else {
						next.set(key, String(value));
					}
				}
				return next;
			},
			{ replace },
		);

		setStateFilter("all");
	}

	const updateDateFilter = (filter: ReservationDateFilter) => {
		updateSearchParameters({
			page: "1",
			dateFilter: filter === "all" ? null : filter,
		});
	}

	useEffect(() => {
		if (!searchParams.has("pageSize") || PAGE_SIZE_OPTIONS.includes(pageSizeParam)) return;

		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current);
				next.delete("pageSize");
				return next;
			},
			{ replace: true },
		);
	}, [pageSizeParam, searchParams, setSearchParams]);

	useEffect(() => {
		setReservationIdInput(searchTarget?.type === "id" ? searchTarget.id : "");
	}, [searchTarget?.type, searchTarget?.id]);

	const reservationSearchQuery = useQuery<PagedResponse<ReservationDetail>>({
		queryKey: [
			"admin-reservation-search",
			searchTarget?.type,
			searchTarget?.id,
			pageNumber,
			pageSize,
			apiDateFilter,
		],
		queryFn: () => {
			if (!searchTarget) throw new Error("No se indicó el filtro de búsqueda de reservas.");
			return getReservationPage(searchTarget, pageNumber, pageSize, apiDateFilter);
		},
		enabled: searchTarget !== null,
		meta: { silent: true },
	});
	const reservationsQuery = useQuery<PagedResponse<ReservationDetail>>({
		queryKey: ["admin-reservations", pageNumber, pageSize, apiDateFilter],
		queryFn: () => getAdminReservations(pageNumber, pageSize, apiDateFilter),
		meta: { silent: true },
	});

	const cancelMutation = useMutation({
		mutationFn: cancelReservationAdmin,
		// meta: { silent: true },
		onSuccess: async () => {
			setReservationToCancel(null);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }),
				queryClient.invalidateQueries({ queryKey: ["admin-reservation-search"] }),
			]);
			toast.success("Reserva cancelada correctamente");
		},
	});
	const reservations = reservationsQuery.data?.data ?? [];
	const displayedReservations = searchTarget
		? reservationSearchQuery.data?.data ?? []
		: reservations;
	const filteredReservations = displayedReservations.filter((reservation) => {
		switch (stateFilter) {
			case "confirmed":
				return (
					reservation.state === ReservationState.ConfirmedPaymentIncomplete ||
					reservation.state === ReservationState.ConfirmedPaymentComplete
				);
			case "not-confirmed":
				return (
					reservation.state === ReservationState.NotConfirmed ||
					reservation.state === ReservationState.PaymentPending
				);
			case "cancelled":
				return reservation.state === ReservationState.Cancelled;
			default:
				return true;
		}
	});
	const displayedReservationsQuery = searchTarget
		? reservationSearchQuery
		: reservationsQuery;
	const paginationPage = searchTarget
		? reservationSearchQuery.data
		: reservationsQuery.data;
	const paginationTotalPages = paginationPage?.totalPages ?? 0;
	const paginationSummary = paginationPage
		? `Página ${paginationPage.pageNumber} de ${paginationPage.totalPages} · ${paginationPage.totalRecords} reservas`
		: `Página ${pageNumber} de …`;


	const getReservationFullPrice = (checkInDate: string, checkOutDate: string, price: number) => {
		const diff =
			Math.abs(
				differenceInCalendarDays(
					parseDateOnly(checkInDate),
					parseDateOnly(checkOutDate),
				),
			) + 1;

		return price * diff;
	}


	return (
		<section>
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<h2 className="font-serif text-4xl tracking-[-0.04em] text-[#385347]">
					Gestión de Reservas
				</h2>
				<div className="flex justify-between w-full sm:w-auto sm:justify-normal items-center gap-4">
					<label className="flex items-center gap-2 text-sm text-[#68716a]">
						Filas por página
						<select
							value={pageSize}
							onChange={(event) => {
								updateSearchParameters({
									page: "1",
									pageSize: event.target.value,
								});
							}}
							className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
						>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<option key={size} value={size}>{size}</option>
							))}
						</select>
					</label>
					<button
						type="button"
						onClick={() => setIsCreateModalOpen(true)}
						className="rounded-md bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition
                       hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-green-700"
					>
						+ Crear Reserva Manual
					</button>
				</div>
			</div>

			<form
				className="mb-5 flex flex-wrap items-end gap-3"
				onSubmit={(event) => {
					event.preventDefault();
					if (searchType === "id") {
						const reservationId = reservationIdInput.trim();
						if (!reservationId) return;
						updateSearchParameters({
							page: "1",
							searchType: "id",
							filterType: "id",
							filterId: reservationId,
							filterLabel: reservationId,
						});
						return;
					}

					setIsSelectionModalOpen(true);
				}}
			>
				<label className="flex flex-col w-full sm:w-auto gap-1.5 text-sm font-medium text-[#385347]">
					Buscar por
					<select
						value={searchType}
						onChange={(event) => {
							const value = event.target.value;
							if (value !== "id" && value !== "user" && value !== "apartment") return;
							updateSearchParameters({ searchType: value }, true);
						}}
						className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
					>
						<option value="id">ID de reserva</option>
						<option value="apartment">Departamento</option>
						<option value="user">Usuario</option>
					</select>
				</label>
				{searchType === "id" ? (
					<label className="flex min-w-64 flex-1 flex-col gap-1.5 text-sm font-medium text-[#385347]">
						ID de reserva
						<input
							type="text"
							value={reservationIdInput}
							onChange={(event) => setReservationIdInput(event.target.value)}
							placeholder="Ingresá el ID de la reserva"
							required
							className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722] placeholder:text-[#92978f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
						/>
					</label>
				) : (
					<p className="flex min-w-64 flex-1 sm:mb-2 items-center text-sm text-[#68716a]">
						{searchType === "user"
							? "Elegí un usuario para ver sus reservas."
							: "Elegí un departamento para ver sus reservas."}
					</p>
				)}
				<button
					type="submit"
					disabled={searchType === "id" && reservationSearchQuery.isFetching}
					className={(searchType != "id" ? "w-full sm:w-auto " : "") + "rounded-md bg-[#385347] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4238] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"}
				>
					{searchType === "id"
						? reservationSearchQuery.isFetching
							? "Buscando..."
							: "Buscar"
						: searchType === "user"
							? "Elegir usuario"
							: "Elegir departamento"}
				</button>
				{searchTarget && (
					<button
						type="button"
						onClick={() => {
							updateSearchParameters({
								page: "1",
								filterType: null,
								filterId: null,
								filterLabel: null,
							});
						}}
						className="rounded-md border border-[#d8d5ca] px-4 py-2.5 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
					>
						Volver a todas las reservas
					</button>
				)}
			</form>

			<fieldset className="mb-5">
				<legend className="mb-2 text-sm font-semibold text-[#385347]">
					Filtrar por estado en página actual
				</legend>
				<div className="flex flex-wrap gap-x-5 gap-y-2">
					{([
						["all", "Todas"],
						["confirmed", "Confirmadas"],
						["not-confirmed", "No confirmadas"],
						["cancelled", "Canceladas"],
					] as const).map(([value, label]) => (
						<label
							key={value}
							className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#424a44]"
						>
							<input
								type="radio"
								name="reservation-state-filter"
								value={value}
								checked={stateFilter === value}
								onChange={() => setStateFilter(value)}
								className="accent-[#385347] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
							/>
							{label}
						</label>
					))}
				</div>
			</fieldset>

			<fieldset className="mb-5">
				<legend className="mb-2 text-sm font-semibold text-[#385347]">
					Filtrar por fecha
				</legend>
				<div className="flex flex-wrap gap-x-5 gap-y-2">
					{([
						["all", "Todas"],
						["past", "Pasadas"],
						["future", "Próximas"],
					] as const).map(([value, label]) => (
						<label
							key={value}
							className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#424a44]"
						>
							<input
								type="radio"
								name="reservation-date-filter"
								value={value}
								checked={dateFilter === value}
								onChange={() => updateDateFilter(value)}
								className="accent-[#385347] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
							/>
							{label}
						</label>
					))}
				</div>
			</fieldset>

			<em className="mb-3 inline-block text-muted-foreground text-sm">Desplazese hacia la derecha en la tabla para ver acciones y mas resultados</em>
			{searchTarget && (
				<p className="mb-3 text-sm text-[#68716a]">
					{searchTarget.type === "id"
						? `Reserva ID: ${searchTarget.label}`
						: `${searchTarget.type === "user" ? "Usuario" : "Departamento"}: ${searchTarget.label}`}
				</p>
			)}

			<div className="overflow-x-auto rounded-md border border-[#e0ded5] bg-[#fffdf9]">
				<table className="w-full min-w-[1180px] border-collapse text-left text-sm">
					<thead className="bg-[#edf2e8] text-[#385347]">
						<tr>
							{/* <th scope="col" className="px-5 py-4 font-semibold">ID</th> */}
							<th scope="col" className="px-5 py-4 font-semibold">Estadía</th>
							<th scope="col" className="px-5 py-4 font-semibold">Departamento</th>
							<th scope="col" className="px-5 py-4 font-semibold">Usuario</th>
							<th scope="col" className="px-5 py-4 font-semibold">Pagos</th>
							<th scope="col" className="px-5 py-4 font-semibold">Estado</th>
							<th scope="col" className="px-5 py-4 font-semibold">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#ece7df] text-[#202722]">
						{displayedReservationsQuery.isLoading ? (
							<tr>
								<td colSpan={7} className="px-5 py-8 text-center">
									<LoadingState
										variant="inline"
										label={searchTarget ? "Buscando reservas..." : "Cargando reservas..."}
										className="w-full"
									/>
								</td>
							</tr>
						) : displayedReservationsQuery.isError ? (
							<tr>
								<td colSpan={7} className="px-5 py-8 text-center text-red-700">
									{searchTarget
										? "No se pudieron buscar las reservas: "
										: "No se pudieron cargar las reservas: "}
									{displayedReservationsQuery.error instanceof Error
										? displayedReservationsQuery.error.message
										: "Error desconocido"}
								</td>
							</tr>
						) : displayedReservations.length === 0 ? (
							<tr>
								<td colSpan={7} className="px-5 py-8 text-center text-[#68716a]">
									{searchTarget
										? searchTarget.type === "id"
											? "No se encontró una reserva con ese ID."
											: "No se encontraron reservas para la selección."
										: pageNumber === 1
											? "No hay reservas registradas"
											: "No hay reservas en esta página"}
								</td>
							</tr>
						) : filteredReservations.length === 0 ? (
							<tr>
								<td colSpan={7} className="px-5 py-8 text-center text-[#68716a]">
									{stateFilter === "confirmed"
										? "No hay reservas confirmadas en esta página."
										: stateFilter === "not-confirmed"
											? "No hay reservas no confirmadas en esta página."
											: "No hay reservas canceladas en esta página."}
								</td>
							</tr>
						) : (
							filteredReservations.map((reservation) => (
								<tr key={reservation.reservationId} className="align-center">
									{/* <td className="max-w-36 px-5 py-4">
                    <span className="block break-all font-mono text-xs text-[#68716a]">
                      {reservation.reservationId}
                    </span>
                  </td> */}
									<td className="whitespace-nowrap px-5 py-4">
										<p className="font-medium">{formatDate(reservation.checkInDate)}</p>
										<p className="mt-1 text-xs text-[#68716a]">
											hasta {formatDate(reservation.checkOutDate)}
										</p>
										<p className="mt-3 text-xs text-[#68716a] italic">
											Creada el {formatDate(reservation.createdAt)}
										</p>
									</td>
									<td className="px-5 py-4">
										{reservation.apartment ? (
											<div className="flex min-w-52 items-center gap-3">
												{reservation.apartment.coverImgUrl ? (
													<img
														src={resolveImageUrl(reservation.apartment.coverImgUrl)}
														alt=""
														className="h-14 w-16 shrink-0 rounded object-cover"
													/>
												) : (
													<div
														aria-hidden="true"
														className="flex h-14 w-16 shrink-0 items-center justify-center rounded bg-[#edf2e8] text-xs text-[#68716a]"
													>
														Sin foto
													</div>
												)}
												<div>
													<p className="font-semibold text-[#385347]">
														{reservation.apartment.name}
													</p>
													<p className="mt-1 text-xs text-[#68716a]">
														{reservation.apartment.location}
													</p>
													<p className="mt-1 text-xs text-[#68716a]">
														{formatCurrency(reservation.apartment.price)} / noche
													</p>
												</div>
											</div>
										) : (
											<div className="min-w-52">
												<p className="font-medium text-[#68716a]">Departamento no disponible</p>
												<p className="mt-1 break-all font-mono text-xs text-[#68716a]">
													{reservation.apartmentId}
												</p>
											</div>
										)}
									</td>
									<td className="px-5 py-4">
										{(reservation.appUser && !reservation.appUser.isDeleted) ? (
											<div className="min-w-44">
												<p className="text-[#385347]">
													{
														reservation.appUser.usertype == UserType.Guest ?
															<i>Usuario Guest</i>
															:
															<span className="font-semibold">
																{reservation.appUser.firstName ?? reservation.appUser.name}{" "}
																{reservation.appUser.lastName}
															</span>
													}
												</p>
												<details className="mt-1">
													<summary className="cursor-pointer text-xs font-medium text-[#385347] underline decoration-[#d3d0c6] underline-offset-2">
														Ver detalles
													</summary>
													<dl className="mt-2 space-y-1.5 text-xs">
														<div>
															<dt className="inline font-medium text-[#424a44]">Email: </dt>
															<dd className="inline">
																<a
																	href={`mailto:${reservation.appUser.email}`}
																	className="text-[#68716a] underline decoration-[#d3d0c6] underline-offset-2"
																>
																	{reservation.appUser.email}
																</a>
															</dd>
														</div>
														<div>
															<dt className="inline font-medium text-[#424a44]">Teléfono: </dt>
															<dd className="inline">
																<a
																	href={`tel:${reservation.appUser.telefono}`}
																	className="text-[#68716a] underline decoration-[#d3d0c6] underline-offset-2"
																>
																	{reservation.appUser.telefono}
																</a>
															</dd>
														</div>
														<div className="break-all">
															<dt className="inline font-medium text-[#424a44]">ID: </dt>
															<dd className="inline font-mono text-[#68716a]">
																{reservation.appUser.id}
															</dd>
														</div>
														<div>
															<dt className="inline font-medium text-[#424a44]">Tipo: </dt>
															<dd className="inline text-[#68716a]">
																{getUserTypeLabel(reservation.appUser.usertype)}
															</dd>
														</div>
													</dl>
												</details>
											</div>
										) : (
											<div className="min-w-44">
												<p className="font-medium text-[#68716a]">Usuario no disponible</p>
												<p className="mt-1 break-all font-mono text-xs text-[#68716a]">
													Id de usuario: <strong>{reservation.appUserId}</strong>
												</p>
											</div>
										)}
									</td>
									<td className="px-5 py-4">
										<div className="min-w-48">
											<p className="font-semibold text-[#385347]">
												{formatCurrency(getPaymentsTotal(reservation.payments))}
												<span className="ml-1 font-normal text-[#68716a]">
													pagado de {formatCurrency(getReservationFullPrice(reservation.checkInDate, reservation.checkOutDate, reservation.apartment?.price ?? 0))}
												</span>
											</p>
											{/* {getPendingRefunds(reservation.payments).length > 0 && (
                        <p
                          role="status"
                          className="mt-2 inline-flex rounded-full bg-[#fff0e8] px-2.5 py-1 text-xs font-semibold text-[#a13c22]"
                        >
                          Devolución:{" "}
                          {formatCurrency(
                            getPendingRefunds(reservation.payments).reduce(
                              (total, payment) => total + payment.amount,
                              0,
                            ),
                          )}
                        </p>
                      )} */}
											{reservation.payments.length > 0 ? (
												<details className="mt-2">
													<summary className="cursor-pointer text-xs font-medium text-[#385347] underline decoration-[#d3d0c6] underline-offset-2">
														Ver {reservation.payments.length}{" "}
														{reservation.payments.length === 1 ? "pago" : "pagos"}
													</summary>
													<ul className="mt-2 space-y-2">
														{reservation.payments.map((payment) => (
															<li
																key={payment.id}
																className="rounded border border-[#ece7df] bg-white px-2.5 py-2 text-xs"
															>
																<div className="flex items-center justify-between gap-3">
																	<span className="font-semibold text-[#202722]">
																		{formatCurrency(payment.amount)}
																	</span>
																	<span className="text-[#68716a]">
																		Estado {getPaymentStatusLabel(payment.paymentStatus)}
																	</span>
																</div>
																<p className="mt-1 text-[#68716a]">
																	{formatPaymentDate(payment.paymentDate)} ·{" "}
																	{payment.isManual ? "Manual" : "En línea"}
																	{payment.isSign ? " · Seña" : ""}
																	{payment.isRefund ? " · Reembolso" : ""}
																</p>
															</li>
														))}
													</ul>
												</details>
											) : (
												<p className="mt-1 text-xs text-[#68716a]">Sin pagos registrados</p>
											)}
										</div>
									</td>
									<td className="px-5 py-4">
										<span className="inline-flex whitespace-nowrap rounded-full bg-[#edf2e8] px-2.5 py-1 text-xs font-semibold text-[#385347]">
											{getReservationStateLabel(reservation.state)}
										</span>
									</td>
									<td className="px-5 py-4">
										<div className="flex flex-wrap gap-2">
											{
												(() => {
													switch (reservation.state) {
														case ReservationState.Cancelled:
															return <em className="text-xs text-muted-foreground mt-3 inline-block">Esta reserva esta cancelada. No puede agregar pagos.</em>
														case ReservationState.ConfirmedPaymentComplete:
															return <em className="text-xs text-muted-foreground mt-3 inline-block">Esta reserva tiene sus pagos completos. No puede agregar pagos.</em>
														case ReservationState.PaymentPending:
															return <em className="text-xs text-muted-foreground mt-3 inline-block">Esta reserva tiene un pago pendiente. No puede agregar pagos.</em>
														default:
															return <button
																type="button"
																onClick={() => setSelectedReservation(reservation)}
																className="rounded-lg bg-[#385347] px-4 py-1.5 text-sm font-semibold text-white shadow-sm
                                   transition hover:bg-[#2c4238] focus:outline-none focus-visible:ring-2
                                   focus-visible:ring-[#385347]/50 focus-visible:ring-offset-2 active:scale-95"
															>
																Registrar Pago
															</button>
													}
												})()
											}
											{
												isReservationStartInFuture(reservation.checkInDate) ?
													reservation.state == ReservationState.Cancelled ?
														<em className="text-muted-foreground text-xs">
															Esta reserva ya esta cancelada.
														</em>
														:
														<button
															type="button"
															onClick={() => setReservationToCancel(reservation)}
															className="rounded-lg bg-[#e28b68] px-4 py-1.5 text-sm font-semibold text-white shadow-sm
									transition hover:bg-[#d47b58] focus:outline-none focus-visible:ring-2
									focus-visible:ring-[#e28b68]/50 focus-visible:ring-offset-2 active:scale-95"
														>
															Cancelar
														</button>
													:
													<em className="text-muted-foreground text-xs">
														No se pueden cancelar reservas pasadas o que estan por comenzar. {/* //TODO: right message?  */}
													</em>
											}
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<PaginationControls
				currentPage={pageNumber}
				totalPages={paginationTotalPages}
				summary={paginationSummary}
				onPageChange={(page) => updateSearchParameters({ page: String(page) })}
				isDisabled={displayedReservationsQuery.isFetching}
				ariaLabel={
					searchTarget
						? "Paginación de reservas filtradas"
						: "Paginación de todas las reservas"
				}
			/>
			<CreateReservationModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
			/>
			{isSelectionModalOpen && searchType !== "id" && (
				<ReservationSearchSelectionModal
					isOpen
					type={searchType}
					onClose={() => setIsSelectionModalOpen(false)}
					onSelect={(id, label) => {
						updateSearchParameters({
							page: "1",
							filterType: searchType,
							filterId: id,
							filterLabel: label,
						});
						setIsSelectionModalOpen(false);
					}}
				/>
			)}
			<AddPaymentModal
				reservation={selectedReservation}
				onClose={() => setSelectedReservation(null)}
			/>
			<CancelReservationModal
				isOpen={reservationToCancel !== null}
				onClose={() => setReservationToCancel(null)}
				onConfirm={() => {
					if (reservationToCancel) cancelMutation.mutate(reservationToCancel.reservationId);
				}}
				reservation={reservationToCancel}
				isPending={cancelMutation.isPending}
			/>
		</section>
	);
}
