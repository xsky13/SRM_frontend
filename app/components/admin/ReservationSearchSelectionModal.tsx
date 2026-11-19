import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoadingState from "~/components/LoadingState";
import type { DepartamentoData } from "~/models/Departamento";
import { getAdminUsers, getApartments, searchAdminUsers } from "~/utils/api";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type ReservationSearchSelectionModalProps = {
  isOpen: boolean;
  type: "user" | "apartment";
  onClose: () => void;
  onSelect: (id: string, label: string) => void;
};

export default function ReservationSearchSelectionModal({
  isOpen,
  type,
  onClose,
  onSelect,
}: ReservationSearchSelectionModalProps) {
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [apartmentFilter, setApartmentFilter] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const usersQuery = useQuery({
    queryKey: ["admin-reservation-user-picker", pageNumber, pageSize, userSearchQuery],
    queryFn: () =>
      userSearchQuery
        ? searchAdminUsers(pageNumber, pageSize, userSearchQuery)
        : getAdminUsers(pageNumber, pageSize),
    enabled: isOpen && type === "user",
    meta: { silent: true },
  });
  const apartmentsQuery = useQuery<DepartamentoData[]>({
    queryKey: ["apartments"],
    queryFn: getApartments,
    enabled: isOpen && type === "apartment",
    meta: { silent: true },
  });

  if (!isOpen) return null;

  const users = usersQuery.data ?? [];
  const normalizedApartmentFilter = apartmentFilter.trim().toLocaleLowerCase();
  const apartments = (apartmentsQuery.data ?? []).filter((apartment) =>
    `${apartment.name} ${apartment.location}`
      .toLocaleLowerCase()
      .includes(normalizedApartmentFilter),
  );
  const isUserPicker = type === "user";
  const title = isUserPicker ? "Seleccionar usuario" : "Seleccionar departamento";

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-search-selection-title"
        className="my-auto flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl bg-[#fffdf9] p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="reservation-search-selection-title"
            className="text-xl font-semibold text-[#202722]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#d8d5ca] px-3 py-1.5 text-sm font-medium text-[#385347] hover:bg-[#edf2e8]"
          >
            Cerrar
          </button>
        </div>

        {isUserPicker ? (
          <>
            <form
              className="mt-5 flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                setPageNumber(1);
                setUserSearchQuery(userSearchInput.trim());
              }}
            >
              <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-sm font-medium text-[#385347]">
                Buscar por nombre, apellido o email
                <input
                  type="search"
                  value={userSearchInput}
                  onChange={(event) => setUserSearchInput(event.target.value)}
                  placeholder="Ingresá nombre, apellido o email"
                  className="rounded-md border border-[#d8d5ca] bg-white px-3 py-2 text-[#202722] placeholder:text-[#92978f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[#68716a]">
                Filas por página
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPageNumber(1);
                  }}
                  className="rounded-md border border-[#d8d5ca] bg-white px-3 py-2 text-[#202722]"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={usersQuery.isFetching}
                className="rounded-md bg-[#385347] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c4238] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buscar
              </button>
              {userSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearchInput("");
                    setUserSearchQuery("");
                    setPageNumber(1);
                  }}
                  className="rounded-md border border-[#d8d5ca] px-4 py-2 text-sm font-semibold text-[#385347] hover:bg-[#edf2e8]"
                >
                  Limpiar búsqueda
                </button>
              )}
            </form>
			      <em className="mt-3 inline-block text-muted-foreground text-sm">Puede haber más información en la tabla. Desplazese a la derecha para ver acciones y mas resultados</em>

            <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-[#e0ded5]">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[#edf2e8] text-[#385347]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Seleccionar</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Nombre</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Apellido</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece7df] text-[#202722]">
                  {usersQuery.isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <LoadingState variant="inline" label="Cargando usuarios..." className="w-full" />
                      </td>
                    </tr>
                  ) : usersQuery.isError ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-red-700">
                        No se pudieron cargar los usuarios:{" "}
                        {usersQuery.error instanceof Error
                          ? usersQuery.error.message
                          : "Error desconocido"}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#68716a]">
                        {userSearchQuery
                          ? "No se encontraron usuarios para esa búsqueda"
                          : "No hay usuarios registrados"}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelect(user.id, `${user.name} ${user.lastName}`.trim())}
                            className="rounded-md bg-[#385347] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#2c4238]"
                          >
                            Elegir
                          </button>
                        </td>
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3">{user.lastName}</td>
                        <td className="px-4 py-3">{user.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[#68716a]">
              <span>Página {pageNumber}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPageNumber((current) => current - 1)}
                  disabled={pageNumber === 1 || usersQuery.isFetching}
                  className="rounded-md border border-[#d8d5ca] px-3 py-1.5 font-semibold hover:bg-[#edf2e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPageNumber((current) => current + 1)}
                  disabled={users.length < pageSize || usersQuery.isFetching}
                  className="rounded-md border border-[#d8d5ca] px-3 py-1.5 font-semibold hover:bg-[#edf2e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <label className="mt-5 block text-sm font-medium text-[#385347]">
              Buscar por nombre o ubicación
              <input
                type="search"
                value={apartmentFilter}
                onChange={(event) => setApartmentFilter(event.target.value)}
                placeholder="Ingresá nombre o ubicación"
                className="mt-1.5 w-full rounded-md border border-[#d8d5ca] bg-white px-3 py-2 text-[#202722] placeholder:text-[#92978f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
              />
            </label>
            <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-[#e0ded5]">
              {apartmentsQuery.isLoading ? (
                <LoadingState
                  variant="inline"
                  label="Cargando departamentos..."
                  className="w-full py-8"
                />
              ) : apartmentsQuery.isError ? (
                <p className="px-4 py-8 text-center text-red-700">
                  No se pudieron cargar los departamentos:{" "}
                  {apartmentsQuery.error instanceof Error
                    ? apartmentsQuery.error.message
                    : "Error desconocido"}
                </p>
              ) : apartments.length === 0 ? (
                <p className="px-4 py-8 text-center text-[#68716a]">
                  {apartmentFilter.trim()
                    ? "No se encontraron departamentos para esa búsqueda"
                    : "No hay departamentos registrados"}
                </p>
              ) : (
                <ul className="divide-y divide-[#ece7df]">
                  {apartments.map((apartment) => (
                    <li
                      key={apartment.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#385347]">{apartment.name}</p>
                        <p className="mt-1 text-sm text-[#68716a]">{apartment.location}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelect(apartment.id, apartment.name)}
                        className="rounded-md bg-[#385347] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#2c4238]"
                      >
                        Elegir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
