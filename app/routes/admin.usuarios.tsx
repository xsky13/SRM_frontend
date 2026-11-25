import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import LoadingState from "~/components/LoadingState";
import PaginationControls from "~/components/PaginationControls";

import { UserType, type User, type UserSearchDto } from "~/types/User";
import {
	getAdminUserById,
	getAdminUserReservations,
	getAdminUsers,
	searchAdminUsers,
} from "~/utils/api";
import { formatDateOnly } from "~/utils/dateOnly";
import { XIcon } from "lucide-react";

export function meta() {
	return [{ title: "Usuarios | Administración | Reservas Moreno" }];
}

const PAGE_SIZE_OPTIONS = [5, 10, 15];
type UserSearchType = "id" | "query";

function isUserSearchType(value: string | null): value is UserSearchType {
	return value === "id" || value === "query";
}

function getUserTypeLabel(userType: User["usertype"]) {
	switch (userType) {
		case UserType.Admin:
			return "Administrador";
		case UserType.User:
			return "Usuario";
		case UserType.Guest:
			return "Invitado";
		default:
			return `Desconocido (${userType})`;
	}
}

function formatDate(value: string) {
	return formatDateOnly(value, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function UserReservationsModal({
	user,
	onClose,
}: {
	user: UserSearchDto;
	onClose: () => void;
}) {
	const [pageNumber, setPageNumber] = useState(1);
	const [pageSize, setPageSize] = useState(5);
	const reservationsQuery = useQuery({
		queryKey: ["admin-user-reservations", user.id, pageNumber, pageSize],
		queryFn: () => getAdminUserReservations(user.id, pageNumber, pageSize),
		meta: { silent: true },
	});
	const reservationsPage = reservationsQuery.data;

	return (
		<div className="fixed inset-0 z-[1600] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6">
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="admin-user-reservations-title"
				className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-[#fffdf9] p-6 shadow-xl relative"
			>
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 id="admin-user-reservations-title" className="text-xl font-semibold text-[#202722] flex items-center flex-wrap">
							Reservas de&nbsp; <span className="inline-block w-80 sm:w-96 md:w-[40rem] overflow-hidden text-ellipsis text-nowrap">{user.name} {user.lastName}</span>
						</h2>
						<p className="mt-1 text-sm text-[#68716a]">{user.email}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="absolute top-4 right-4 rounded-md border border-[#d8d5ca] px-3 py-1.5 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8]"
					>
						<XIcon size={17} />
					</button>
				</div>

				<div className="flex justify-between items-center mt-5">
					<p className="text-muted-foreground text-sm">Se muestran las reservas próximas del usuario</p>
					<label className="flex items-center gap-2 text-sm text-[#68716a]">
						Filas por página
						<select
							value={pageSize}
							onChange={(event) => {
								setPageSize(Number(event.target.value));
								setPageNumber(1);
							}}
							className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722]"
						>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<option key={size} value={size}>{size}</option>
							))}
						</select>
					</label>
				</div>

				<div className="mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-[#e0ded5]">
					{reservationsQuery.isPending ? (
						<LoadingState
							variant="inline"
							label="Cargando reservas..."
							className="w-full py-8"
						/>
					) : reservationsQuery.isError ? (
						<p role="alert" className="px-4 py-8 text-center text-red-700">
							No se pudieron cargar las reservas:{" "}
							{reservationsQuery.error instanceof Error
								? reservationsQuery.error.message
								: "Error desconocido"}
						</p>
					) : !reservationsPage ? (
						<p className="px-4 py-8 text-center text-[#68716a]">
							No se pudieron cargar las reservas.
						</p>
					) : reservationsPage.totalRecords === 0 ? (
						<p className="px-4 py-8 text-center text-[#68716a]">
							Este usuario no tiene reservas.
						</p>
					) : (
						<table className="w-full min-w-[600px] border-collapse text-left text-sm">
							<thead className="sticky top-0 bg-[#edf2e8] text-[#385347]">
								<tr>
									<th scope="col" className="px-4 py-3 font-semibold">Departamento</th>
									<th scope="col" className="px-4 py-3 font-semibold">Check-in</th>
									<th scope="col" className="px-4 py-3 font-semibold">Salida</th>
									<th scope="col" className="px-4 py-3 font-semibold">Estado</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#ece7df]">
								{reservationsPage.data.map((reservation) => (
									<tr key={reservation.id}>
										<td className="px-4 py-3">{reservation.apartmentName}</td>
										<td className="whitespace-nowrap px-4 py-3">{formatDate(reservation.checkInDate)}</td>
										<td className="whitespace-nowrap px-4 py-3">{formatDate(reservation.checkOutDate)}</td>
										<td className="px-4 py-3">
											{RESERVATION_STATE_LABEL[reservation.reservationState] ?? "Desconocido"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				{reservationsPage && reservationsPage.totalRecords > 0 && (
					<PaginationControls
						currentPage={pageNumber}
						totalPages={reservationsPage.totalPages}
						summary={`Página ${reservationsPage.pageNumber} de ${reservationsPage.totalPages} · ${reservationsPage.totalRecords} reservas`}
						onPageChange={setPageNumber}
						isDisabled={reservationsQuery.isFetching}
						ariaLabel={`Paginación de reservas de ${user.name}`}
					/>
				)}
			</section>
		</div>
	);
}

export default function AdminUsuariosPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const pageParam = Number(searchParams.get("page"));
	const pageNumber = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
	const pageSizeParam = Number(searchParams.get("pageSize"));
	const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam) ? pageSizeParam : 10;
	const searchTypeParam = searchParams.get("searchType");
	const searchType = isUserSearchType(searchTypeParam) ? searchTypeParam : "query";
	const filterTypeParam = searchParams.get("filterType");
	const appliedSearchType = isUserSearchType(filterTypeParam) ? filterTypeParam : null;
	const searchQuery = searchParams.get("query")?.trim() ?? "";
	const isSearchActive = Boolean(appliedSearchType && searchQuery);
	const [searchInput, setSearchInput] = useState(searchQuery);
	const [reservationsUser, setReservationsUser] = useState<UserSearchDto | null>(null);
	const usersQuery = useQuery({
		queryKey: ["admin-users", pageNumber, pageSize, appliedSearchType, searchQuery],
		queryFn: async () => {
			if (!isSearchActive) return getAdminUsers(pageNumber, pageSize);
			if (appliedSearchType === "id") {
				const user = await getAdminUserById(searchQuery);
				return {
					data: [user],
					pageNumber: 1,
					pageSize: 1,
					totalPages: 1,
					totalRecords: 1,
				};
			}
			return searchAdminUsers(pageNumber, pageSize, searchQuery);
		},
		meta: { silent: true },
	});
	const usersPage = usersQuery.data;
	const users = usersPage?.data ?? [];

	useEffect(() => {
		setSearchInput(searchQuery);
	}, [appliedSearchType, searchQuery]);

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

	function updateSearchParameters(updates: Record<string, string | null>, replace = false) {
		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current);
				for (const [key, value] of Object.entries(updates)) {
					if (value === null) {
						next.delete(key);
					} else {
						next.set(key, value);
					}
				}
				return next;
			},
			{ replace },
		);
	}

	function applySearch(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const query = searchInput.trim();
		if (!query) return;
		setReservationsUser(null);
		updateSearchParameters({
			page: "1",
			filterType: searchType,
			query,
		});
	}

	return (
		<section>
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="font-serif text-4xl tracking-[-0.04em] text-[#385347]">
						Gestión de Usuarios
					</h2>
					<p className="mt-2 text-sm text-[#68716a]">
						Usuarios registrados en el sistema
					</p>
				</div>
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
			</div>

			<form
				className="mb-5 flex flex-wrap items-end gap-3"
				onSubmit={applySearch}
			>
				<label className="flex flex-col gap-1.5 text-sm font-medium text-[#385347]">
					Buscar por
					<select
						value={searchType}
						onChange={(event) => {
							const value = event.target.value;
							if (!isUserSearchType(value)) return;
							updateSearchParameters({ searchType: value }, true);
						}}
						className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
					>
						<option value="query">Nombre, apellido o email</option>
						<option value="id">ID de usuario</option>
					</select>
				</label>
				<label className="flex min-w-64 flex-1 flex-col gap-1.5 text-sm font-medium text-[#385347]">
					{searchType === "id" ? "ID de usuario" : "Nombre, apellido o email"}
					<input
						type="search"
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						placeholder={
							searchType === "id"
								? "Ingresá el ID del usuario"
								: "Ingresá nombre, apellido o email"
						}
						required
						className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722] placeholder:text-[#92978f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
					/>
				</label>
				<button
					type="submit"
					disabled={usersQuery.isFetching}
					className="rounded-md bg-[#385347] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4238] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
				>
					Buscar
				</button>
				{isSearchActive && (
					<button
						type="button"
						onClick={() => {
							setSearchInput("");
							setReservationsUser(null);
							updateSearchParameters({
								page: "1",
								filterType: null,
								query: null,
							});
						}}
						className="rounded-md border border-[#d8d5ca] px-4 py-2.5 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
					>
						Limpiar búsqueda
					</button>
				)}
			</form>
			<em className="mb-3 inline-block text-muted-foreground text-sm">Puede haber más información en la tabla. Desplazese hacia la derecha en la tabla para ver acciones y mas resultados</em>

			<div className="overflow-x-auto rounded-md border border-[#e0ded5] bg-[#fffdf9]">
				<table className="w-full min-w-[900px] border-collapse text-left text-sm">
					<thead className="bg-[#edf2e8] text-[#385347]">
						<tr>
							<th scope="col" className="px-5 py-4 font-semibold">Nombre</th>
							<th scope="col" className="px-5 py-4 font-semibold">Apellido</th>
							<th scope="col" className="px-5 py-4 font-semibold">Email</th>
							<th scope="col" className="px-5 py-4 font-semibold">Teléfono</th>
							<th scope="col" className="px-5 py-4 font-semibold">Tipo</th>
							<th scope="col" className="px-5 py-4 font-semibold">Reservas</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#ece7df] text-[#202722]">
						{usersQuery.isLoading ? (
							<tr>
								<td colSpan={7} className="px-5 py-8 text-center">
									<LoadingState
										variant="inline"
										label="Cargando usuarios..."
										className="w-full"
									/>
								</td>
							</tr>
						) : usersQuery.isError ? (
							<tr>
								<td colSpan={7} className="px-5 py-8 text-center text-red-700">
									No se pudieron cargar los usuarios:{" "}
									{usersQuery.error instanceof Error
										? usersQuery.error.message
										: "Error desconocido"}
								</td>
							</tr>
						) : users.length === 0 ? (
							<tr>
								<td colSpan={7} className="px-5 py-8 text-center text-[#68716a]">
									{isSearchActive
										? "No se encontraron usuarios para esa búsqueda"
										: "No hay usuarios registrados"}
								</td>
							</tr>
						) : (
							users.map((user) => {
								return (
									<tr key={user.id}>
										<td className="px-5 py-4">{user.name}</td>
										<td className="px-5 py-4">{user.lastName}</td>
										<td className="px-5 py-4">{user.email}</td>
										<td className="px-5 py-4">{user.telefono}</td>
										<td className="px-5 py-4">{getUserTypeLabel(user.usertype)}</td>
										<td className="px-5 py-4">
											<button
												type="button"
												onClick={() => setReservationsUser(user)}
												className="rounded-md border border-[#d8d5ca] px-3 py-1.5 font-semibold text-[#385347] transition hover:bg-[#edf2e8]"
											>
												Ver reservas
											</button>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{usersPage && usersPage.totalRecords > 0 && (
				<PaginationControls
					currentPage={pageNumber}
					totalPages={usersPage.totalPages}
					summary={`Página ${usersPage.pageNumber} de ${usersPage.totalPages} · ${usersPage.totalRecords} usuarios en total`}
					onPageChange={(page) => updateSearchParameters({ page: String(page) })}
					isDisabled={usersQuery.isFetching}
					ariaLabel="Paginación de usuarios"
				/>
			)}
			{reservationsUser && (
				<UserReservationsModal
					user={reservationsUser}
					onClose={() => setReservationsUser(null)}
				/>
			)}
		</section>
	);
}