import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import { type ReservationState } from "~/types/Reserva";
import { UserType } from "~/types/User";
import { PaymentStatus, type PaymentDto, type ReservationDetail } from "~/types/ReservationDetail";
import { useSearchParams } from "react-router";
import LoadingState from "~/components/LoadingState";
import AddPaymentModal from "~/components/admin/AddPaymentModal";
import CancelReservationModal from "~/components/admin/CancelReservationModal";
import CreateReservationModal from "~/components/admin/CreateReservationModal";
import ReservationSearchSelectionModal from "~/components/admin/ReservationSearchSelectionModal";
import {
  cancelReservationAdmin,
  getAdminReservationById,
  getAdminReservations,
  getAdminReservationsByApartment,
  getAdminReservationsByUser,
  resolveImageUrl,
} from "~/utils/api";

export function meta() {
  return [{ title: "Reservas | Administración | Reservas Moreno" }];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type ReservationSearchTarget = {
  type: "id" | "user" | "apartment";
  id: string;
  label: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPaymentsTotal(payments: PaymentDto[]) {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}

function getPendingRefunds(payments: PaymentDto[]) {
  return payments.filter(
    (payment) =>
      payment.isRefund && payment.paymentStatus !== PaymentStatus.Refunded,
  );
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

export default function AdminReservasPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page"));
  const pageNumber = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSizeParam = Number(searchParams.get("pageSize"));
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam) ? pageSizeParam : 10;
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
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  function updateSearchParameters(
    updates: Record<string, string | null>,
    replace = false,
  ) {
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

  useEffect(() => {
    setReservationIdInput(searchTarget?.type === "id" ? searchTarget.id : "");
  }, [searchTarget?.type, searchTarget?.id]);

  const reservationSearchQuery = useQuery<ReservationDetail[]>({
    queryKey: [
      "admin-reservation-search",
      searchTarget?.type,
      searchTarget?.id,
      pageNumber,
      pageSize,
    ],
    queryFn: async () => {
      if (!searchTarget) {
        throw new Error("No se seleccionó un criterio de búsqueda.");
      }

      switch (searchTarget.type) {
        case "id":
          return [await getAdminReservationById(searchTarget.id)];
        case "user":
          return getAdminReservationsByUser(searchTarget.id, pageNumber, pageSize);
        case "apartment":
          return getAdminReservationsByApartment(searchTarget.id, pageNumber, pageSize);
      }
    },
    enabled: searchTarget !== null,
    meta: { silent: true },
  });
  const reservationsQuery = useQuery<ReservationDetail[]>({
    queryKey: ["admin-reservations", pageNumber, pageSize],
    queryFn: () => getAdminReservations(pageNumber, pageSize),
    meta: { silent: true },
  });
  useEffect(() => console.log(reservationsQuery.data), [reservationsQuery.data]);
  useEffect(() => console.log(reservationSearchQuery.data), [reservationSearchQuery.data])

  const cancelMutation = useMutation({
    mutationFn: cancelReservationAdmin,
    meta: { silent: true },
    onSuccess: async () => {
      setReservationToCancel(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-reservation-search"] }),
      ]);
      toast.success("Reserva cancelada correctamente");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar la reserva");
    },
  });
  const reservations = reservationsQuery.data ?? [];
  const displayedReservations = searchTarget
    ? reservationSearchQuery.data ?? []
    : reservations;
  const displayedReservationsQuery = searchTarget
    ? reservationSearchQuery
    : reservationsQuery;

  function getDaysBetweenDates(date1: Date, date2: Date): number {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;

    return Math.floor(Math.abs(utc2 - utc1) / msPerDay);
}

  const getReservationFullPrice = (checkInDate: string, checkOutDate: string, price: number) => {
    const checkInDATE = new Date(checkInDate);
    const checkOutDATE = new Date(checkOutDate);
    const diff = getDaysBetweenDates(checkInDATE, checkOutDATE) + 1;
    
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
            ) : (
              displayedReservations.map((reservation) => (
                <tr key={reservation.reservationId} className="align-top">
                  {/* <td className="max-w-36 px-5 py-4">
                    <span className="block break-all font-mono text-xs text-[#68716a]">
                      {reservation.reservationId}
                    </span>
                  </td> */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="font-medium">{formatDate(new Date(new Date(reservation.checkInDate).setUTCDate(new Date(reservation.checkInDate).getUTCDate() + 1)).toISOString())}</p>
                    <p className="mt-1 text-xs text-[#68716a]">
                      hasta {formatDate(new Date(new Date(reservation.checkOutDate).setUTCDate(new Date(reservation.checkOutDate).getUTCDate() + 1)).toISOString())}
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
                          / {formatCurrency(getReservationFullPrice(reservation.checkInDate, reservation.checkOutDate, reservation.apartment?.price ?? 0))}
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
                                  {formatDate(payment.paymentDate)} ·{" "}
                                  {payment.isManual ? "Manual" : "En línea"}
                                  {payment.isSign ? " · Seña" : ""}
                                  {payment.isRefund ? " · Reembolso": ""}
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
                      <button
                        type="button"
                        onClick={() => setSelectedReservationId(reservation.reservationId)}
                        className="rounded-lg bg-[#385347] px-4 py-1.5 text-sm font-semibold text-white shadow-sm
                                   transition hover:bg-[#2c4238] focus:outline-none focus-visible:ring-2
                                   focus-visible:ring-[#385347]/50 focus-visible:ring-offset-2 active:scale-95"
                      >
                        Registrar Pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setReservationToCancel(reservation.reservationId)}
                        className="rounded-lg bg-[#e28b68] px-4 py-1.5 text-sm font-semibold text-white shadow-sm
                                   transition hover:bg-[#d47b58] focus:outline-none focus-visible:ring-2
                                   focus-visible:ring-[#e28b68]/50 focus-visible:ring-offset-2 active:scale-95"
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(!searchTarget || searchTarget.type !== "id") && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#68716a]">
          <span>Página {pageNumber}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateSearchParameters({ page: String(pageNumber - 1) })}
              disabled={pageNumber === 1 || displayedReservationsQuery.isFetching}
              className="rounded-md border border-[#d8d5ca] px-4 py-2 font-semibold transition hover:bg-[#edf2e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => updateSearchParameters({ page: String(pageNumber + 1) })}
              disabled={
                (searchTarget
                  ? displayedReservations.length < pageSize
                  : displayedReservations.length === 0) ||
                displayedReservationsQuery.isFetching
              }
              className="rounded-md border border-[#d8d5ca] px-4 py-2 font-semibold transition hover:bg-[#edf2e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

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
        reservationId={selectedReservationId}
        onClose={() => setSelectedReservationId(null)}
      />
      <CancelReservationModal
        isOpen={reservationToCancel !== null}
        onClose={() => setReservationToCancel(null)}
        onConfirm={() => {
          if (reservationToCancel) cancelMutation.mutate(reservationToCancel);
        }}
        reservationId={reservationToCancel ?? ""}
        isPending={cancelMutation.isPending}
      />
    </section>
  );
}
