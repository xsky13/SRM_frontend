import { formatDateOnly } from "~/utils/dateOnly";

export default function formatDate(value: string) {
	return formatDateOnly(value, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}