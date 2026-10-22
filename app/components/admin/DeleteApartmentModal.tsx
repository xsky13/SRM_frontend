type DeleteApartmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  apartmentName: string;
  isPending: boolean;
};

export default function DeleteApartmentModal({
  isOpen,
  onClose,
  onConfirm,
  apartmentName,
  isPending,
}: DeleteApartmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
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
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-[#e28b68] px-4 py-2 text-sm font-semibold text-white
                       transition hover:bg-[#d47b58] focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[#e28b68]/50 focus-visible:ring-offset-2
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </section>
    </div>
  );
}
