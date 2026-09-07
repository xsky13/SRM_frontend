import { ChevronLeft, ChevronRight, CircleCheck, CircleX, X } from "lucide-react";
import { useState } from "react";
import type { Reserva } from "~/types/Reserva";

interface CalendarioDisponibilidadProps {
	reservas: Reserva[];
	onClose: () => void;
}

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

function dateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string): Date {
	const date = new Date(`${value.slice(0, 10)}T00:00:00`);
	return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function isReserved(day: Date, reservas: Reserva[]): boolean {
	const current = dateKey(day);
	return reservas.some((reserva) => {
		const start = dateKey(parseDate(reserva.startDate));
		const end = dateKey(parseDate(reserva.endDate));
		return current >= start && current < end;
	});
}

function isBetween(day: Date, start?: Date, end?: Date): boolean {
	if (!start || !end) return false;
	const time = day.getTime();
	return time >= Math.min(start.getTime(), end.getTime()) && time <= Math.max(start.getTime(), end.getTime());
}

function rangeHasReservation(start: Date, end: Date, reservas: Reserva[]): boolean {
	const first = new Date(Math.min(start.getTime(), end.getTime()));
	const last = new Date(Math.max(start.getTime(), end.getTime()));

	for (const day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
		if (isReserved(day, reservas)) return true;
	}

	return false;
}

export default function CalendarioDisponibilidad({ reservas, onClose }: CalendarioDisponibilidadProps) {
	const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
	const [rangeStart, setRangeStart] = useState<Date>();
	const [rangeEnd, setRangeEnd] = useState<Date>();
	const [isDragging, setIsDragging] = useState(false);
	const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
	const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
	const offset = (firstDay.getDay() + 6) % 7;
	const weekdays = Array.from({ length: 7 }, (_, index) => {
		const day = new Date(2024, 0, index + 1);
		return weekdayFormatter.format(day).replace(".", "").slice(0, 2);
	});
	const days = Array.from({ length: offset + daysInMonth }, (_, index) =>
		index < offset ? null : new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
	);

	function updateRangeEnd(day: Date) {
		if (!rangeStart || rangeHasReservation(rangeStart, day, reservas)) return;
		setRangeEnd(day);
	}

	function handleDayPointerDown(day: Date) {
		setIsDragging(true);
		if (!rangeStart || rangeEnd) {
			setRangeStart(day);
			setRangeEnd(undefined);
			return;
		}

		updateRangeEnd(day);
	}

	function handleDayPointerUp(day: Date) {
		if (!rangeStart) return;
		updateRangeEnd(day);
		setIsDragging(false);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202722]/35 p-4" onClick={onClose}>
			<section className="w-full max-w-md rounded-2xl border border-[#e0ded5] bg-[#fffdf9] p-4 shadow-2xl sm:p-5" onClick={(event) => event.stopPropagation()} aria-labelledby="availability-title" role="dialog" aria-modal="true">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e28b68]">Disponibilidad</p>
					<h2 id="availability-title" className="mt-1 font-serif text-2xl tracking-[-0.05em] text-[#385347]">Elegí tus fechas</h2>
				</div>
				<button type="button" onClick={onClose} className="rounded-full p-1.5 text-[#68716a] transition hover:bg-[#f6f4ee] hover:text-[#385347]" aria-label="Cerrar calendario">
					<X size={18} />
				</button>
			</div>
			<div className="mt-4 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full border border-[#d3d0c6] p-1.5 text-[#385347] transition hover:bg-[#f6f4ee]" aria-label="Mes anterior">
						<ChevronLeft size={16} />
					</button>
					<strong className="min-w-32 text-center text-sm capitalize text-[#385347]">{monthFormatter.format(month)}</strong>
					<button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full border border-[#d3d0c6] p-1.5 text-[#385347] transition hover:bg-[#f6f4ee]" aria-label="Mes siguiente">
						<ChevronRight size={16} />
					</button>
				</div>
			</div>

			<div
				className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-[#68716a]"
				onPointerUp={() => setIsDragging(false)}
				onPointerCancel={() => setIsDragging(false)}
			>
				{weekdays.map((day) => <div key={day} className="py-1 font-bold uppercase">{day}</div>)}
				{days.map((day, index) => day ? (
					(() => {
						const reserved = isReserved(day, reservas);
						const selected = isBetween(day, rangeStart, rangeEnd) || Boolean(rangeStart && dateKey(day) === dateKey(rangeStart));
						return (
							<button
								key={dateKey(day)}
								type="button"
								disabled={reserved}
								onPointerDown={() => !reserved && handleDayPointerDown(day)}
								onPointerEnter={() => isDragging && updateRangeEnd(day)}
								onPointerUp={() => !reserved && handleDayPointerUp(day)}
								className={`aspect-square rounded-lg p-0.5 transition ${reserved
									? "cursor-not-allowed bg-[#f3ddd3] text-[#a85c43]"
									: selected
										? "bg-[#385347] text-white shadow-sm"
										: "bg-[#edf2e8] text-[#385347] hover:bg-[#dce8d8]"
								}`}
								aria-label={`${day.getDate()} de ${monthFormatter.format(month)}${reserved ? ", reservado" : ", disponible"}`}
							>
								<span className="flex h-full items-center justify-center rounded-md text-xs font-semibold">{day.getDate()}</span>
							</button>
						);
					})()
				) : <div key={`empty-${index}`} />)}
			</div>

			<div className="mt-4 flex flex-wrap gap-4 border-t border-[#ece7df] pt-3 text-xs text-[#4d5b55]">
				<span className="inline-flex items-center gap-1.5"><CircleCheck size={14} className="text-[#6b8b63]" /> Disponible</span>
				<span className="inline-flex items-center gap-1.5"><CircleX size={14} className="text-[#c7765a]" /> Reservado</span>
				{rangeStart && rangeEnd && <span className="w-full text-[#385347]">{dateKey(rangeStart)} a {dateKey(rangeEnd)}</span>}
			</div>
			</section>
		</div>
	);
}
