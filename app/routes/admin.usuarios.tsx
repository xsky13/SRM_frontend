import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import type { ReservationListingDto } from "~/types/ReservationDetail";
import LoadingState from "~/components/LoadingState";

import { UserType, type User } from "~/types/User";
import { getAdminUserReservations, getAdminUsers, searchAdminUsers } from "~/utils/api";

export function meta() {
  return [{ title: "Usuarios | Administración | Reservas Moreno" }];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function UserReservations({ userId }: { userId: string }) {
  const reservationsQuery = useQuery({
    queryKey: ["admin-user-reservations", userId],
    queryFn: () => getAdminUserReservations(userId),
    meta: { silent: true },
  });
  const reservations: ReservationListingDto[] = reservationsQuery.data ?? [];

  if (reservationsQuery.isLoading) {
    return (
      <LoadingState
        variant="inline"
        label="Cargando reservas..."
        className="w-full py-4"
      />
    );
  }

  if (reservationsQuery.isError) {
    return (
      <p className="py-4 text-center text-red-700">
        No se pudieron cargar las reservas:{" "}
        {reservationsQuery.error instanceof Error
          ? reservationsQuery.error.message
          : "Error desconocido"}
      </p>
    );
  }

  if (reservations.length === 0) {
    return <p className="py-4 text-center text-[#68716a]">Este usuario no tiene reservas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-left text-sm">
        <thead className="text-[#385347]">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Departamento</th>
            <th scope="col" className="px-4 py-3 font-semibold">Check-in</th>
            <th scope="col" className="px-4 py-3 font-semibold">Última noche (salida al día siguiente)</th>
            <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ece7df]">
          {reservations.map((reservation) => (
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
    </div>
  );
}

export default function AdminUsuariosPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const usersQuery = useQuery({
    queryKey: ["admin-users", pageNumber, pageSize, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchAdminUsers(pageNumber, pageSize, searchQuery)
        : getAdminUsers(pageNumber, pageSize),
    meta: { silent: true },
  });
  const users = usersQuery.data ?? [];

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
              setPageSize(Number(event.target.value));
              setPageNumber(1);
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
        onSubmit={(event) => {
          event.preventDefault();
          setPageNumber(1);
          setExpandedUserId(null);
          setSearchQuery(searchInput.trim());
        }}
      >
        <label className="flex min-w-64 flex-1 flex-col gap-1.5 text-sm font-medium text-[#385347]">
          Buscar por nombre, apellido o email
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Ingresá nombre, apellido o email"
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
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearchQuery("");
              setPageNumber(1);
              setExpandedUserId(null);
            }}
            className="rounded-md border border-[#d8d5ca] px-4 py-2.5 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
          >
            Limpiar búsqueda
          </button>
        )}
      </form>

      <div className="overflow-x-auto rounded-md border border-[#e0ded5] bg-[#fffdf9]">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-[#edf2e8] text-[#385347]">
            <tr>
              <th scope="col" className="px-5 py-4 font-semibold">ID</th>
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
                  {searchQuery
                    ? "No se encontraron usuarios para esa búsqueda"
                    : "No hay usuarios registrados"}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isExpanded = expandedUserId === user.id;

                return (
                  <Fragment key={user.id}>
                    <tr>
                      <td className="max-w-52 break-all px-5 py-4 font-mono text-xs text-[#68716a]">
                        {user.id}
                      </td>
                      <td className="px-5 py-4">{user.name}</td>
                      <td className="px-5 py-4">{user.lastName}</td>
                      <td className="px-5 py-4">{user.email}</td>
                      <td className="px-5 py-4">{user.telefono}</td>
                      <td className="px-5 py-4">{getUserTypeLabel(user.usertype)}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                          className="rounded-md border border-[#d8d5ca] px-3 py-1.5 font-semibold text-[#385347] transition hover:bg-[#edf2e8]"
                        >
                          {isExpanded ? "Ocultar" : "Ver reservas"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr key={`${user.id}-reservations`}>
                        <td colSpan={7} className="bg-[#faf9f5] px-5 py-3">
                          <UserReservations userId={user.id} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#68716a]">
        <span>Página {pageNumber}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPageNumber((current) => current - 1)}
            disabled={pageNumber === 1 || usersQuery.isFetching}
            className="rounded-md border border-[#d8d5ca] px-4 py-2 font-semibold transition hover:bg-[#edf2e8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPageNumber((current) => current + 1)}
            disabled={users.length < pageSize || usersQuery.isFetching}
            className="rounded-md border border-[#d8d5ca] px-4 py-2 font-semibold transition hover:bg-[#edf2e8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}