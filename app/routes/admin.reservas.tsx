import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import { type ReservationState } from "~/types/Reserva";
import { UserType } from "~/types/User";
import type { PaymentDto, ReservationDetail } from "~/types/ReservationDetail";
import AddPaymentModal from "~/components/admin/AddPaymentModal";
import CancelReservationModal from "~/components/admin/CancelReservationModal";
import CreateReservationModal from "~/components/admin/CreateReservationModal";
import { cancelReservationAdmin, getAdminReservations, resolveImageUrl } from "~/utils/api";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  const reservationsQuery = useQuery<ReservationDetail[]>({
    queryKey: ["admin-reservations"],
    queryFn: getAdminReservations,
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-4xl tracking-[-0.04em] text-[#385347]">
          Gestión de Reservas
        </h2>
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
            {reservationsQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-[#68716a]">
                  Cargando reservas...
                </td>
              </tr>
            ) : reservationsQuery.isError ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-red-700">
                  No se pudieron cargar las reservas:{" "}
                  {reservationsQuery.error instanceof Error
                    ? reservationsQuery.error.message
                    : "Error desconocido"}
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-[#68716a]">
                  No hay reservas registradas
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => (
                <tr key={reservation.reservationId} className="align-top">
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
                                    Estado {payment.paymentStatus}
                                  </span>
                                </div>
                                <p className="mt-1 text-[#68716a]">
                                  {formatDate(payment.paymentDate)} ·{" "}
                                  {payment.isManual ? "Manual" : "En línea"}
                                  {payment.isSign ? " · Seña" : ""}
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
