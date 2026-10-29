import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { LocationPicker, type Coordinates } from "~/components/LocationPicker";
import { resolveImageUrl } from "~/utils/api";

export type ApartmentFormValues = {
	name: string;
	description: string;
	price: string;
	location: string;
	latitude: string;
	longitude: string;
	coverImgUrl: string;
};

export type ApartmentFormField = keyof ApartmentFormValues;
export type ApartmentFormErrors = Partial<Record<ApartmentFormField, string>> & {
	images?: string;
};

type ApartmentFormLayoutProps = {
	values: ApartmentFormValues;
	errors: ApartmentFormErrors;
	submitted: boolean;
	isPending: boolean;
	submitLabel: string;
	pendingLabel: string;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onFieldChange: (field: ApartmentFormField, value: string) => void;
	onLocationChange: (coordinates: Coordinates) => void;
	children: ReactNode;
};

export default function ApartmentFormLayout({
	values,
	errors,
	submitted,
	isPending,
	submitLabel,
	pendingLabel,
	onSubmit,
	onFieldChange,
	onLocationChange,
	children,
}: ApartmentFormLayoutProps) {
	const latitude = Number(values.latitude);
	const longitude = Number(values.longitude);
	const initialPosition =
		values.latitude.trim() &&
		values.longitude.trim() &&
		Number.isFinite(latitude) &&
		latitude >= -90 &&
		latitude <= 90 &&
		Number.isFinite(longitude) &&
		longitude >= -180 &&
		longitude <= 180
			? { latitude, longitude }
			: undefined;

	function field(name: ApartmentFormField, label: string, type = "text") {
		return (
			<label className="block text-sm text-[#385347]">
				<span className="mb-1.5 block font-semibold">{label}</span>
				<input
					className="w-full rounded-md border border-[#e5e7eb] bg-[#fffdf9] px-3 py-2.5 text-[#202722] outline-none transition focus:border-[#e28b68]"
					type={type}
					name={name}
					value={values[name]}
					required
					step={type === "number" ? "any" : undefined}
					onChange={(event) => onFieldChange(name, event.target.value)}
					aria-invalid={submitted && Boolean(errors[name])}
					aria-describedby={submitted && errors[name] ? `${name}-error` : undefined}
				/>
				{submitted && errors[name] && (
					<span id={`${name}-error`} className="mt-1 block text-xs text-[#b74f3d]">
						{errors[name]}
					</span>
				)}
			</label>
		);
	}

	return (
		<form onSubmit={onSubmit} noValidate className="space-y-5">
			<Link
				to="/admin/departamentos"
				className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#385347] transition hover:text-[#2c4238]"
			>
				<ArrowLeft aria-hidden="true" className="size-4" />
				Volver
			</Link>
			{field("name", "Nombre")}
			<label className="block text-sm text-[#385347]">
				<span className="mb-1.5 block font-semibold">Descripción</span>
				<textarea
					className="min-h-28 w-full rounded-md border border-[#e5e7eb] bg-[#fffdf9] px-3 py-2.5 text-[#202722] outline-none transition focus:border-[#e28b68]"
					name="description"
					value={values.description}
					required
					onChange={(event) => onFieldChange("description", event.target.value)}
					aria-invalid={submitted && Boolean(errors.description)}
					aria-describedby={submitted && errors.description ? "description-error" : undefined}
				/>
				{submitted && errors.description && (
					<span id="description-error" className="mt-1 block text-xs text-[#b74f3d]">
						{errors.description}
					</span>
				)}
			</label>
			{field("price", "Precio por día", "number")}
			<div className="space-y-2">
				<span className="block text-sm font-semibold text-[#385347]">Ubicación</span>
				{field("location", "Dirección o zona")}
				<p className="text-xs text-[#68716a]">
					Ingresá la dirección o zona y hacé clic en el mapa para fijar el punto exacto.
				</p>
				<LocationPicker
					initialPosition={initialPosition}
					onChange={onLocationChange}
				/>
				{submitted && errors.location && (
					<span className="block text-xs text-[#b74f3d]">{errors.location}</span>
				)}
				{submitted && errors.latitude && (
					<span className="block text-xs text-[#b74f3d]">{errors.latitude}</span>
				)}
				{submitted && errors.longitude && (
					<span className="block text-xs text-[#b74f3d]">{errors.longitude}</span>
				)}
			</div>
			<section className="space-y-4">
				<h3 className="text-sm font-semibold text-[#385347]">
					{values.coverImgUrl ? "Imágenes y portada" : "Fotos"}
				</h3>
				{values.coverImgUrl && (
					<img
						src={resolveImageUrl(values.coverImgUrl)}
						alt={`Portada de ${values.name || "departamento"}`}
						className="h-32 w-full rounded-md object-cover"
					/>
				)}
				{submitted && errors.images && (
					<span className="block text-xs text-[#b74f3d]">{errors.images}</span>
				)}
				{submitted && errors.coverImgUrl && (
					<span className="block text-xs text-[#b74f3d]">{errors.coverImgUrl}</span>
				)}
				{children}
			</section>
			<div className="flex flex-wrap justify-end gap-3 pt-2">
				<Link
					to="/admin/departamentos"
					className="rounded-md border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8]"
				>
					Cancelar
				</Link>
				<button
					type="submit"
					disabled={isPending}
					className="rounded-md bg-[#385347] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4238] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isPending ? pendingLabel : submitLabel}
				</button>
			</div>
		</form>
	);
}
