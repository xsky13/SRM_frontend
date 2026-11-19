export default function formatDate(value: string) {
	return new Intl.DateTimeFormat("es-AR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(value));
}