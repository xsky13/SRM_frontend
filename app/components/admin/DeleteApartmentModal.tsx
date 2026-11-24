import { useQuery } from "@tanstack/react-query";
import { getAdminReservationsByApartment } from "~/utils/api";
import { ReservationState } from "~/types/Reserva";

const RESERVATION_PAGE_SIZE = 100;

type DeleteApartmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  apartmentId: string | null;
  apartmentName: string;
  isPending: boolean;
};

export default function DeleteApartmentModal({
  isOpen,
  onClose,
  onConfirm,
  apartmentId,
  apartmentName,
  isPending,
}: DeleteApartmentModalProps) {
  const reservationsQuery = useQuery({
    queryKey: ["admin-reservations-by-apartment-for-delete", apartmentId],
    queryFn: async () => {
      if (!apartmentId) {
        throw new Error("No se indicó el departamento que se quiere eliminar.");
      }

      const today = new Date();
      const todayDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      for (let pageNumber = 1; ; pageNumber += 1) {
        const reservationsPage = await getAdminReservationsByApartment(
          apartmentId,
          pageNumber,
          RESERVATION_PAGE_SIZE,
        );
        const hasPendingReservations = reservationsPage.data.some(
          (reservation) =>
            reservation.state !== ReservationState.Cancelled &&
            reservation.checkOutDate.slice(0, 10) >= todayDate,
        );

        if (hasPendingReservations) return true;
        if (pageNumber >= reservationsPage.totalPages) return false;
      }
    },
    enabled: isOpen && apartmentId !== null,
    meta: { silent: true },
  });

  if (!isOpen) return null;

  const hasPendingReservations = reservationsQuery.data === true;
  const cannotConfirmDelete =
    isPending ||
    reservationsQuery.isFetching ||
    reservationsQuery.isError ||
    hasPendingReservations;

  return (
    <div className="fixed inset-0 z-1600 flex items-center justify-center bg-black/50 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-apartment-title"
        className="w-full max-w-md rounded-xl bg-[#fffdf9] p-6 shadow-xl"
      >
        <h2 id="delete-apartment-title" className="text-xl font-semibold text-[#202722]">
          Eliminar Departamento
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#505a53]">
          ¿Estás seguro de que deseas eliminar el departamento{" "}
          <strong className="font-semibold text-[#202722]">{apartmentName}</strong>? Esta acción
          hará que deje de mostrarse en el sistema.
        </p>
        {reservationsQuery.isFetching && (
          <p className="mt-3 text-sm text-[#68716a]" role="status">
            Verificando reservas...
          </p>
        )}
        {reservationsQuery.isError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            No se pudieron verificar las reservas:{" "}
            {reservationsQuery.error instanceof Error
              ? reservationsQuery.error.message
              : "Error desconocido"}
          </p>
        )}
        {hasPendingReservations && (
          <p className="mt-3 text-sm font-medium text-red-700" role="alert">
            No se pueden eliminar departamentos con reservas pendientes.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-[#d8d5cd] px-4 py-2 text-sm font-medium text-[#424a44]
                       transition hover:bg-[#f1efe9] focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[#385347]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!cannotConfirmDelete) if (confirm("¿Cancelar reserva?"))  onConfirm();
            }}
            disabled={cannotConfirmDelete}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white
                       transition not-[:disabled]:hover:bg-red-800 focus:outline-none focus-visible:ring-2
                       focus-visible:ring-red-700/50 focus-visible:ring-offset-2
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </section>
    </div>
  );
}
