import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RESERVATION_STATE_LABEL, type ReservationStateValue } from "~/types/reservationState";
import type { Reserva } from "~/types/Reserva";
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

function getReservationStateLabel(state: number) {
  return RESERVATION_STATE_LABEL[Number(state) as ReservationStateValue] ?? "Desconocido";
}

export default function AdminReservasPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  const reservationsQuery = useQuery<Reserva[]>({
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
                <tr key={reservation.id}>
                  <td className="px-5 py-4">{reservation.id}</td>
                  <td className="px-5 py-4">{formatDate(reservation.checkInDate)}</td>
                  <td className="px-5 py-4">{formatDate(reservation.checkOutDate)}</td>
                  <td className="px-5 py-4">
                    {getReservationStateLabel(reservation.reservationState)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReservationId(reservation.id)}
                        className="rounded-lg bg-[#385347] px-4 py-1.5 text-sm font-semibold text-white shadow-sm
                                   transition hover:bg-[#2c4238] focus:outline-none focus-visible:ring-2
                                   focus-visible:ring-[#385347]/50 focus-visible:ring-offset-2 active:scale-95"
                      >
                        Registrar Pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setReservationToCancel(reservation.id)}
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
