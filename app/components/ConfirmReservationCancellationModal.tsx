type ConfirmReservationCancellationModalProps = {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmReservationCancellationModal({
  isOpen,
  isPending,
  onClose,
  onConfirm,
}: ConfirmReservationCancellationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-reservation-cancellation-title"
        className="w-full max-w-md rounded-xl bg-[#fffdf9] p-6 shadow-xl"
      >
        <h2
          id="confirm-reservation-cancellation-title"
          className="text-xl font-semibold text-[#202722]"
        >
          Cancelar reserva
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#505a53]">
          ¿Estás seguro de que querés cancelar esta reserva? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-[#d8d5cd] px-4 py-2 text-sm font-medium text-[#424a44]
                       transition hover:bg-[#f1efe9] focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[#385347]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-[#a90000] px-4 py-2 text-sm font-semibold text-white
                       transition hover:bg-[#870000] focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[#a90000]/50 focus-visible:ring-offset-2
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Cancelando reserva..." : "Sí, cancelar reserva"}
          </button>
        </div>
      </section>
    </div>
  );
}
