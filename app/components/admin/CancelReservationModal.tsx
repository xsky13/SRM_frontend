import { toast } from "sonner";
import type { ReservationDetail } from "~/types/ReservationDetail";
import formatDate from "~/utils/formatDate";

type CancelReservationModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	reservation: ReservationDetail | null;
	isPending: boolean;
};

export default function CancelReservationModal({
	isOpen,
	onClose,
	onConfirm,
	reservation,
	isPending,
}: CancelReservationModalProps) {
	if (!isOpen) return null;

	if (!reservation) return toast.error("Hubo un error cargando la reserva. Por favor, intente nuevamente.");

	return (
		<div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/50 px-4">
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="cancel-reservation-title"
				className="w-full max-w-md rounded-xl bg-[#fffdf9] p-6 shadow-xl"
			>
				<h2 id="cancel-reservation-title" className="text-xl font-semibold text-[#202722]">
					Cancelar Reserva
				</h2>
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
				<p className="mt-3 leading-6 ">
					¿Estás seguro de que deseas cancelar esta reserva? Esta acción es irreversible!
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
						No, volver atras
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white
                       transition hover:bg-red-800 focus:outline-none focus-visible:ring-2
                       focus-visible:ring-red-800/50 focus-visible:ring-offset-2
                       disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isPending ? "Cancelando..." : "Cancelar reserva"}
					</button>
				</div>
			</section>
		</div>
	);
}
