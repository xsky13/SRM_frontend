import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RESERVATION_STATE_LABEL } from "~/types/reservationState";
import { type ReservationState } from "~/types/Reserva";
import type { ReservationDetail } from "~/types/ReservationDetail";
import AddPaymentModal from "~/components/admin/AddPaymentModal";
import CancelReservationModal from "~/components/admin/CancelReservationModal";
import CreateReservationModal from "~/components/admin/CreateReservationModal";
import { cancelReservationAdmin, getAdminReservations } from "~/utils/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

<<<<<<< HEAD
=======
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

>>>>>>> b6371964998be6f1d71834f84e0900703a496e50
function getReservationStateLabel(state: ReservationState) {
  // Usa el enum compartido para tipar el índice de las etiquetas de estado.
  return RESERVATION_STATE_LABEL[state] ?? "Desconocido";
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
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-[#edf2e8] text-[#385347]">
            <tr>
              <th scope="col" className="px-5 py-4 font-semibold">ID</th>
              <th scope="col" className="px-5 py-4 font-semibold">Fecha Inicio</th>
              <th scope="col" className="px-5 py-4 font-semibold">Fecha Fin</th>
              <th scope="col" className="px-5 py-4 font-semibold">Estado</th>
              <th scope="col" className="px-5 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ece7df] text-[#202722]">
            {reservationsQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[#68716a]">
                  Cargando reservas...
                </td>
              </tr>
            ) : reservationsQuery.isError ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-red-700">
                  No se pudieron cargar las reservas:{" "}
                  {reservationsQuery.error instanceof Error
                    ? reservationsQuery.error.message
                    : "Error desconocido"}
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[#68716a]">
                  No hay reservas registradas
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => (
                <tr key={reservation.reservationId}>
                  <td className="px-5 py-4">{reservation.reservationId}</td>
                  <td className="px-5 py-4">{formatDate(reservation.checkInDate)}</td>
                  <td className="px-5 py-4">{formatDate(reservation.checkOutDate)}</td>
                  <td className="px-5 py-4">
<<<<<<< HEAD
                    {getReservationStateLabel(reservation.state)}
=======
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
>>>>>>> b6371964998be6f1d71834f84e0900703a496e50
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
