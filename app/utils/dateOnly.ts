const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function getDateParts(value: string) {
	const match = DATE_ONLY_PATTERN.exec(value);
	if (!match) {
		throw new RangeError(`Invalid calendar date: ${value}`);
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const utcDate = new Date(Date.UTC(year, month - 1, day));
	if (
		utcDate.getUTCFullYear() !== year ||
		utcDate.getUTCMonth() !== month - 1 ||
		utcDate.getUTCDate() !== day
	) {
		throw new RangeError(`Invalid calendar date: ${value}`);
	}

	return { year, month, day };
}

function formatDateParts(year: number, month: number, day: number): string {
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDateOnly(value: string): Date {
	const { year, month, day } = getDateParts(value);
	return new Date(year, month - 1, day);
}

export function serializeDateOnly(date: Date): string {
	if (Number.isNaN(date.getTime())) {
		throw new RangeError("Cannot serialize an invalid calendar date.");
	}

	return `${formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate())}T00:00:00.000Z`;
}

export function serializeDateOnlyInput(value: string): string {
	const { year, month, day } = getDateParts(value);
	return `${formatDateParts(year, month, day)}T00:00:00.000Z`;
}

export function differenceInCalendarDays(start: Date, end: Date): number {
	const startUtc = Date.UTC(
		start.getFullYear(),
		start.getMonth(),
		start.getDate(),
	);
	const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
	return (endUtc - startUtc) / MILLISECONDS_PER_DAY;
}

export function addDaysToDateOnly(value: string, days: number): string {
	const { year, month, day } = getDateParts(value);
	const date = new Date(Date.UTC(year, month - 1, day + days));
	return formatDateParts(
		date.getUTCFullYear(),
		date.getUTCMonth() + 1,
		date.getUTCDate(),
	);
}

export function formatDateOnly(
	value: string,
	options: Intl.DateTimeFormatOptions,
): string {
	return new Intl.DateTimeFormat("es-AR", options).format(parseDateOnly(value));
}
