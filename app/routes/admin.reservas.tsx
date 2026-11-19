import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import { type ReservationState } from "~/types/Reserva";
import { UserType } from "~/types/User";
import { PaymentStatus, type PaymentDto, type ReservationDetail } from "~/types/ReservationDetail";
import LoadingState from "~/components/LoadingState";
import AddPaymentModal from "~/components/admin/AddPaymentModal";
import CancelReservationModal from "~/components/admin/CancelReservationModal";
import CreateReservationModal from "~/components/admin/CreateReservationModal";
import {
  cancelReservationAdmin,
  getAdminReservationById,
  getAdminReservations,
  resolveImageUrl,
} from "~/utils/api";

export function meta() {
  return [{ title: "Reservas | Administración | Reservas Moreno" }];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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

export default function AdminReservasPage() {
  const queryClient = useQueryClient();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reservationIdInput, setReservationIdInput] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  const reservationLookupMutation = useMutation({
    mutationFn: getAdminReservationById,
    meta: { silent: true },
  });
  const reservationsQuery = useQuery<ReservationDetail[]>({
    queryKey: ["admin-reservations", pageNumber, pageSize],
    queryFn: () => getAdminReservations(pageNumber, pageSize),
    meta: { silent: true },
  });
  const cancelMutation = useMutation({
    mutationFn: cancelReservationAdmin,
    meta: { silent: true },
    onSuccess: async () => {
      setReservationToCancel(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Reserva cancelada correctamente");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar la reserva");
    },
  });
  const reservations = reservationsQuery.data ?? [];
  const displayedReservations = isSearchMode
    ? reservationLookupMutation.data
      ? [reservationLookupMutation.data]
      : []
    : reservations;

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
        <div className="flex flex-wrap items-center gap-4">
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
          const reservationId = reservationIdInput.trim();
          if (!reservationId) return;
          setIsSearchMode(true);
          reservationLookupMutation.mutate(reservationId);
        }}
      >
        <label className="flex min-w-64 flex-1 flex-col gap-1.5 text-sm font-medium text-[#385347]">
          Buscar reserva por ID
          <input
            type="text"
            value={reservationIdInput}
            onChange={(event) => setReservationIdInput(event.target.value)}
            placeholder="Ingresá el ID de la reserva"
            required
            className="rounded-md border border-[#d8d5ca] bg-[#fffdf9] px-3 py-2 text-[#202722] placeholder:text-[#92978f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
          />
        </label>
        <button
          type="submit"
          disabled={reservationLookupMutation.isPending}
          className="rounded-md bg-[#385347] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4238] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
        >
          {reservationLookupMutation.isPending ? "Buscando..." : "Buscar"}
        </button>
        {isSearchMode && (
          <button
            type="button"
            onClick={() => {
              setIsSearchMode(false);
              setReservationIdInput("");
              reservationLookupMutation.reset();
            }}
            className="rounded-md border border-[#d8d5ca] px-4 py-2.5 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385347]"
          >
            Volver a todas
          </button>
        )}
      </form>

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
            {isSearchMode && reservationLookupMutation.isPending ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center">
                  <LoadingState
                    variant="inline"
                    label="Buscando reserva..."
                    className="w-full"
                  />
                </td>
              </tr>
            ) : isSearchMode && reservationLookupMutation.isError ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-red-700">
                  No se pudo buscar la reserva:{" "}
                  {reservationLookupMutation.error instanceof Error
                    ? reservationLookupMutation.error.message
                    : "Error desconocido"}
                </td>
              </tr>
            ) : !isSearchMode && reservationsQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center">
                  <LoadingState
                    variant="inline"
                    label="Cargando reservas..."
                    className="w-full"
                  />
                </td>
              </tr>
            ) : !isSearchMode && reservationsQuery.isError ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-red-700">
                  No se pudieron cargar las reservas:{" "}
                  {reservationsQuery.error instanceof Error
                    ? reservationsQuery.error.message
                    : "Error desconocido"}
                </td>
              </tr>
            ) : displayedReservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-[#68716a]">
                  {isSearchMode
                    ? "No se encontró una reserva con ese ID."
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
                    {reservation.appUser ? (
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
                          {reservation.appUserId}
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

      {!isSearchMode && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#68716a]">
          <span>Página {pageNumber}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPageNumber((current) => current - 1)}
              disabled={pageNumber === 1 || reservationsQuery.isFetching}
              className="rounded-md border border-[#d8d5ca] px-4 py-2 font-semibold transition hover:bg-[#edf2e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPageNumber((current) => current + 1)}
              disabled={reservations.length === 0 || reservationsQuery.isFetching}
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
