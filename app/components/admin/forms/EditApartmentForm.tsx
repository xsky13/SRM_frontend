import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApartmentWriteInput } from "~/models/Departamento";
import LocationPicker, { type SelectedLocation } from "~/components/admin/LocationPicker";
import { addApartmentImages, getApartmentById, resolveImageUrl, updateApartment } from "~/utils/api";

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

type EditApartmentFormProps = {
	id: string | undefined;
	selectedCoverUrl: string | null;
};

type UpdateApartmentVariables = {
	id: string;
	apartment: ApartmentWriteInput;
	coverImage: File | null;
};

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

export default function EditApartmentForm({ id, selectedCoverUrl }: EditApartmentFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [values, setValues] = useState(initialValues);
	const [coverImage, setCoverImage] = useState<File | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const apartmentQuery = useQuery({
		queryKey: ["apartment", id],
		queryFn: () => {
			if (!id) throw new Error("No se indicó el departamento que se quiere editar.");
			return getApartmentById(id);
		},
		enabled: Boolean(id),
	});
	const errors = validate(values);

	useEffect(() => {
		const apartment = apartmentQuery.data;
		if (!apartment) return;

		setValues({
			name: apartment.name ?? "",
			description: typeof apartment.description === "string" ? apartment.description : "",
			price: String(apartment.price ?? ""),
			location: apartment.location ?? "",
			latitude: String(apartment.latitude ?? ""),
			longitude: String(apartment.longitude ?? ""),
			coverImgUrl: apartment.coverImgUrl ?? apartment.images?.[0]?.url ?? "",
		});
		setCoverImage(null);
		setSubmitted(false);
	}, [apartmentQuery.data]);

	useEffect(() => {
		if (!selectedCoverUrl) return;
		setValues((current) => ({ ...current, coverImgUrl: selectedCoverUrl }));
		setCoverImage(null);
	}, [selectedCoverUrl, apartmentQuery.data]);

	const mutation = useMutation({
		mutationFn: async ({ id: apartmentId, apartment, coverImage: selectedImage }: UpdateApartmentVariables) => {
			let apartmentData = apartment;
			if (selectedImage) {
				let uploadedImages;
				try {
					uploadedImages = await addApartmentImages(apartmentId, [selectedImage]);
				} catch (error) {
					const reason = error instanceof Error ? error.message : "Error desconocido";
					throw new Error(`No se pudo subir la nueva imagen de portada: ${reason}`);
				}
				const coverImgUrl = uploadedImages[0]?.url;
				if (!coverImgUrl) {
					throw new Error("La imagen se subió, pero no se recibió su URL.");
				}
				apartmentData = { ...apartment, coverImgUrl };
			}

			return updateApartment(apartmentId, apartmentData);
		},
		meta: { silent: true },
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["apartments"] }),
				queryClient.invalidateQueries({ queryKey: ["apartment", id] }),
			]);
			toast.success("Departamento actualizado correctamente");
			navigate("/admin/departamentos");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "No se pudo actualizar el departamento");
		},
	});

	function updateField(field: FormField, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
	}

	function updateLocation(selectedLocation: SelectedLocation) {
		setValues((current) => ({ ...current, ...selectedLocation }));
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);
		if (!id || Object.keys(errors).length > 0) return;

		mutation.mutate({
			id,
			apartment: {
				name: values.name.trim(),
				description: values.description.trim(),
				price: Number(values.price),
				location: values.location.trim(),
				latitude: Number(values.latitude),
				longitude: Number(values.longitude),
				coverImgUrl: values.coverImgUrl,
			},
			coverImage,
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

	if (!id) {
		return <p role="alert" className="text-sm text-[#b74f3d]">No se indicó el departamento que se quiere editar.</p>;
	}

	if (apartmentQuery.isPending) {
		return <p className="text-sm text-[#68716a]">Cargando departamento...</p>;
	}

	if (apartmentQuery.isError) {
		return (
			<div role="alert" className="space-y-3 text-sm text-[#b74f3d]">
				<p>No se pudo cargar el departamento: {apartmentQuery.error.message}</p>
				<button
					type="button"
					onClick={() => apartmentQuery.refetch()}
					className="rounded-md border border-[#e5e7eb] px-4 py-2 font-semibold text-[#385347] transition hover:bg-[#edf2e8]"
				>
					Reintentar
				</button>
			</div>
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
				<div className="block text-sm text-[#385347]">
					<span className="mb-1.5 block font-semibold">Imagen de portada</span>
					{values.coverImgUrl && (
						<img
							src={resolveImageUrl(values.coverImgUrl)}
							alt={`Portada actual de ${values.name}`}
							className="mb-2 h-32 w-full rounded-md object-cover"
						/>
					)}
					<input
						className="w-full rounded-md border border-[#e5e7eb] bg-[#fffdf9] px-3 py-2.5 text-[#202722] outline-none transition focus:border-[#e28b68]"
						type="file"
						name="coverImage"
						accept="image/*"
						onChange={(event) => setCoverImage(event.target.files?.[0] ?? null)}
					/>
					<p className="mt-1 text-xs text-[#68716a]">
						{coverImage ? `Nueva imagen: ${coverImage.name}` : "Dejá el campo vacío para mantener la portada actual."}
					</p>
				</div>
			</div>
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
					{mutation.isPending ? "Guardando..." : "Guardar cambios"}
				</button>
			</div>
		</form>
	);
}
