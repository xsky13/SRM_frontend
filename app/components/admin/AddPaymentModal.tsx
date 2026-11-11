import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addAdminReservationPayment } from "~/utils/api";

type AddPaymentModalProps = {
  reservationId: string | null;
  onClose: () => void;
};

export default function AddPaymentModal({
  reservationId,
  onClose,
}: AddPaymentModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const mutation = useMutation({
    mutationFn: ({ id, paymentAmount }: { id: string; paymentAmount: number }) =>
      addAdminReservationPayment(id, paymentAmount),
    meta: { silent: true },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Pago registrado correctamente");
      setAmount("");
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el pago");
    },
  });

  useEffect(() => {
    if (reservationId) setAmount("");
  }, [reservationId]);

  if (!reservationId) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reservationId) return;

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      toast.error("Ingresá un monto mayor a cero.");
      return;
    }

    mutation.mutate({ id: reservationId, paymentAmount });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-payment-title"
        className="w-full max-w-md rounded-xl bg-[#fffdf9] p-6 shadow-xl"
      >
        <h2 id="add-payment-title" className="text-xl font-semibold text-[#202722]">
          Registrar Pago
        </h2>
        <p className="mt-2 text-sm text-[#68716a]">
          Reserva <span className="font-medium text-[#202722]">{reservationId}</span>
        </p>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="payment-amount" className="block text-sm font-medium text-[#424a44]">
            Monto a pagar
          </label>
          <input
            id="payment-amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={mutation.isPending}
            className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5"
          />

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg border border-[#d8d5cd] px-4 py-2 text-sm font-medium text-[#424a44]
                         transition hover:bg-[#f1efe9] focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[#385347]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-[#385347] px-4 py-2 text-sm font-semibold text-white
                         transition hover:bg-[#2c4238] focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[#385347]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Registrando..." : "Registrar Pago"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
