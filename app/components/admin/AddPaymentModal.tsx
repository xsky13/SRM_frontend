import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addAdminReservationPayment } from "~/utils/api";
import { PaymentStatus, type ReservationDetail } from "~/types/ReservationDetail";
import formatDate from "~/utils/formatDate";
import { ReservationState } from "~/types/Reserva";
import { differenceInCalendarDays, parseDateOnly } from "~/utils/dateOnly";

type AddPaymentModalProps = {
	reservation: ReservationDetail | null;
	onClose: () => void;
};

export default function AddPaymentModal({
	reservation,
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
		if (reservation?.reservationId) setAmount("");
	}, [reservation]);

	if (!reservation?.reservationId) return null;

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!reservation?.reservationId) return;

		const paymentAmount = Number(fullCost - payed);

		if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
			toast.error("Ingresá un monto mayor a cero.");
			return;
		}

		mutation.mutate({ id: reservation?.reservationId, paymentAmount });
	}

	const payed = reservation.payments.filter(p => p.paymentStatus == PaymentStatus.Approved).reduce((acc, curr) => acc + curr.amount, 0);
	const nightsInReservation =
		Math.abs(
			differenceInCalendarDays(
				parseDateOnly(reservation.checkInDate),
				parseDateOnly(reservation.checkOutDate),
			),
		) + 1;
	const fullCost = nightsInReservation * (reservation.apartment?.price || 0);

	return (
		<div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/50 px-4">
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="add-payment-title"
				className="w-full max-w-md rounded-xl bg-[#fffdf9] p-6 shadow-xl"
			>
				<h2 id="add-payment-title" className="text-xl font-semibold text-[#202722]">
					Registrar Pago
				</h2>
				<p className="my-2 tracking-wide">
					Agregar el monto restante para confirmar esta reserva. Debe registrar el pago en la reserva cuando el usuario le transfiere manualmente el monto.
				</p>
				<div className="border border-[#e0ded5] bg-[#F6F4EE] rounded-md px-3 py-2.5 my-3">
					<p className=" text-sm text-[#68716a]">
						Reserva <span className="font-medium text-[#202722]">{reservation?.apartment?.name ?? <em>Departamento no disponible</em>}</span>
					</p>
					<div className="font-medium text-[#385347] text-sm mt-2">
						{formatDate(reservation.checkInDate)}
						&nbsp;hasta {formatDate(reservation.checkOutDate)}
					</div>
				</div>

				<div className="border border-[#e0ded5] bg-[#F6F4EE] rounded-md px-3 py-2.5 my-3">
					<p className=" text-sm text-[#68716a]">
						Usuario <span className="font-medium text-[#202722]">{reservation.appUser?.name + " " + reservation.appUser?.lastName}</span>
					</p>
					<div className="font-medium text-[#385347] text-sm mt-2">
						{reservation.appUser?.email}
					</div>
				</div>

				<div className="mt-7 rounded-md border border-[#e0ded5] p-5">
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e28b68]">Monto a pagar</p>
					<div className="mt-3 font-serif text-3xl tracking-tighter text-[#385347]">
						${(fullCost - payed).toLocaleString("es-AR")}
					</div>
				</div>
				{
					(() => {
						switch (reservation.state) {
							case ReservationState.Cancelled:
								return <em className="text-sm text-muted-foreground mt-3 inline-block">Esta reserva esta cancelada. No puede agregar pagos.</em>
							case ReservationState.ConfirmedPaymentComplete:
								return <em className="text-sm text-muted-foreground mt-3 inline-block">Esta reserva tiene sus pagos completos. No puede agregar pagos.</em>
							case ReservationState.PaymentPending:
								return <em className="text-sm text-muted-foreground mt-3 inline-block">Esta reserva tiene un pago pendiente. No puede agregar pagos.</em>
							default:
								break;
						}
					})()
				}

				<form onSubmit={submit} className="mt-5">
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
							disabled={mutation.isPending || reservation.state == ReservationState.Cancelled || reservation.state == ReservationState.PaymentPending || reservation.state == ReservationState.ConfirmedPaymentComplete}
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
