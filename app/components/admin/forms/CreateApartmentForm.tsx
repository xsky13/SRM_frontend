import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApartmentWriteInput } from "~/models/Departamento";
import LocationPicker, { type SelectedLocation } from "~/components/admin/LocationPicker";
import { createApartment } from "~/utils/api";

type FormValues = {
	name: string;
	description: string;
	price: string;
	location: string;
	latitude: string;
	longitude: string;
	coverImgUrl: string;
};

type FormField = keyof FormValues;

const initialValues: FormValues = {
	name: "",
	description: "",
	price: "",
	location: "",
	latitude: "",
	longitude: "",
	coverImgUrl: "",
};

function validate(values: FormValues): Partial<Record<FormField, string>> {
	const errors: Partial<Record<FormField, string>> = {};

	if (!values.name.trim()) errors.name = "Ingresá el nombre del departamento.";
	if (!values.description.trim()) errors.description = "Ingresá una descripción.";
	if (!values.location.trim()) errors.location = "Ingresá la ubicación.";
	if (!values.coverImgUrl.trim()) errors.coverImgUrl = "Ingresá la URL de la imagen de portada.";
	if (values.price.trim() === "" || !Number.isFinite(Number(values.price)) || Number(values.price) <= 0) {
		errors.price = "Ingresá un precio mayor que cero.";
	}
	if (values.latitude.trim() === "" || !Number.isFinite(Number(values.latitude))) {
		errors.latitude = "Ingresá una latitud válida.";
	}
	if (values.longitude.trim() === "" || !Number.isFinite(Number(values.longitude))) {
		errors.longitude = "Ingresá una longitud válida.";
	}

	return errors;
}

export default function CreateApartmentForm() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [values, setValues] = useState(initialValues);
	const [submitted, setSubmitted] = useState(false);
	const errors = validate(values);

	const mutation = useMutation({
		mutationFn: (apartment: ApartmentWriteInput) => createApartment(apartment),
		meta: { silent: true },
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["apartments"] });
			toast.success("Departamento creado correctamente");
			navigate("/admin/departamentos");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "No se pudo crear el departamento");
		},
	});

	function updateField(field: FormField, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
	}

	function updateLocation(selectedLocation: SelectedLocation) {
		setValues((current) => ({ ...current, ...selectedLocation }));
	}

	function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);
		if (Object.keys(errors).length > 0) return;

		mutation.mutate({
			name: values.name.trim(),
			description: values.description.trim(),
			price: Number(values.price),
			location: values.location.trim(),
			latitude: Number(values.latitude),
			longitude: Number(values.longitude),
			coverImgUrl: values.coverImgUrl.trim(),
		});
	}

	function field(name: FormField, label: string, type = "text") {
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
					onChange={(event) => updateField(name, event.target.value)}
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
		<form onSubmit={submit} noValidate className="space-y-5">
			{field("name", "Nombre")}
			<div className="space-y-2">
				<span className="block text-sm font-semibold text-[#385347]">Ubicación</span>
				<LocationPicker
					location={values.location}
					latitude={values.latitude}
					longitude={values.longitude}
					onLocationChange={updateLocation}
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
				{values.location && values.latitude && values.longitude && (
					<p className="text-xs text-[#68716a]">
						{values.location} ({values.latitude}, {values.longitude})
					</p>
				)}
			</div>
			<label className="block text-sm text-[#385347]">
				<span className="mb-1.5 block font-semibold">Descripción</span>
				<textarea
					className="min-h-28 w-full rounded-md border border-[#e5e7eb] bg-[#fffdf9] px-3 py-2.5 text-[#202722] outline-none transition focus:border-[#e28b68]"
					name="description"
					value={values.description}
					required
					onChange={(event) => updateField("description", event.target.value)}
					aria-invalid={submitted && Boolean(errors.description)}
					aria-describedby={submitted && errors.description ? "description-error" : undefined}
				/>
				{submitted && errors.description && (
					<span id="description-error" className="mt-1 block text-xs text-[#b74f3d]">
						{errors.description}
					</span>
				)}
			</label>
			<div className="grid gap-5 sm:grid-cols-2">
				{field("price", "Precio por día", "number")}
				{field("coverImgUrl", "URL de la imagen de portada")}
			</div>
			<p className="text-xs text-[#68716a]">
				Podrás subir más fotos y cambiar la portada desde la pantalla de Edición una vez creado el departamento.
			</p>
			<div className="flex flex-wrap justify-end gap-3 pt-2">
				<Link
					to="/admin/departamentos"
					className="rounded-md border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8]"
				>
					Cancelar
				</Link>
				<button
					type="submit"
					disabled={mutation.isPending}
					className="rounded-md bg-[#385347] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4238] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{mutation.isPending ? "Guardando..." : "Guardar departamento"}
				</button>
			</div>
		</form>
	);
}
