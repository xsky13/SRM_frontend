import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
	ApartmentCreateInput,
	ApartmentWriteInput,
	DepartamentoData,
} from "~/models/Departamento";
import type { Coordinates } from "~/components/LocationPicker";
import ImageGalleryManager from "~/components/admin/ImageGalleryManager";
import ApartmentFormLayout, {
	type ApartmentFormErrors,
	type ApartmentFormField,
	type ApartmentFormValues,
} from "~/components/admin/forms/ApartmentFormLayout";
import { createApartment, updateApartment } from "~/utils/api";

type ApartmentFormProps = {
	initialData?: DepartamentoData;
	isEditing: boolean;
};

const emptyValues: ApartmentFormValues = {
	name: "",
	description: "",
	price: "",
	location: "",
	latitude: "",
	longitude: "",
	coverImgUrl: "",
};

function getFormValues(apartment?: DepartamentoData): ApartmentFormValues {
	if (!apartment) return emptyValues;
	return {
		name: apartment.name ?? "",
		description: typeof apartment.description === "string" ? apartment.description : "",
		price: String(apartment.price ?? ""),
		location: apartment.location ?? "",
		latitude: String(apartment.latitude ?? ""),
		longitude: String(apartment.longitude ?? ""),
		coverImgUrl: apartment.coverImgUrl ?? apartment.images?.[0]?.url ?? "",
	};
}

function validate(values: ApartmentFormValues, isEditing: boolean, files: File[]): ApartmentFormErrors {
	const errors: ApartmentFormErrors = {};

	if (!values.name.trim()) errors.name = "Ingresá el nombre del departamento.";
	if (!values.description.trim()) errors.description = "Ingresá una descripción.";
	if (!values.location.trim()) errors.location = "Ingresá la ubicación.";
	if (!isEditing && files.length === 0) errors.images = "Seleccioná al menos una imagen.";
	if (values.price.trim() === "" || !Number.isFinite(Number(values.price)) || Number(values.price) <= 0) {
		errors.price = "Ingresá un precio mayor que cero.";
	}
	const latitude = Number(values.latitude);
	if (
		values.latitude.trim() === "" ||
		!Number.isFinite(latitude) ||
		latitude < -90 ||
		latitude > 90
	) {
		errors.latitude = "Ingresá una latitud válida.";
	}
	const longitude = Number(values.longitude);
	if (
		values.longitude.trim() === "" ||
		!Number.isFinite(longitude) ||
		longitude < -180 ||
		longitude > 180
	) {
		errors.longitude = "Ingresá una longitud válida.";
	}

	return errors;
}

function toApartmentInput(values: ApartmentFormValues, coverImgUrl = values.coverImgUrl): ApartmentWriteInput {
	return {
		name: values.name.trim(),
		description: values.description.trim(),
		price: Number(values.price),
		location: values.location.trim(),
		latitude: Number(values.latitude),
		longitude: Number(values.longitude),
		coverImgUrl,
	};
}

function toApartmentCreateInput(
	values: ApartmentFormValues,
	images: File[],
): ApartmentCreateInput {
	return {
		name: values.name.trim(),
		description: values.description.trim(),
		price: Number(values.price),
		location: values.location.trim(),
		images,
		latitude: Number(values.latitude),
		longitude: Number(values.longitude),
	};
}

export default function ApartmentForm({ initialData, isEditing }: ApartmentFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [values, setValues] = useState(() => getFormValues(initialData));
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [submitted, setSubmitted] = useState(false);
	const errors = validate(values, isEditing, selectedFiles);

	const mutation = useMutation({
		mutationFn: async () => {
			if (isEditing) {
				if (!initialData?.id) throw new Error("No se indicó el departamento que se quiere editar.");
				return updateApartment(initialData.id, toApartmentInput(values));
			}

			const createdApartment = await createApartment(
				toApartmentCreateInput(values, selectedFiles),
			);
			if (!createdApartment.id) {
				throw new Error("El departamento se envió, pero el servidor no devolvió su identificador.");
			}
			return createdApartment;
		},
		meta: { silent: true },
		onSuccess: async (apartment) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["apartments"] }),
				queryClient.invalidateQueries({ queryKey: ["apartment", apartment.id] }),
			]);
			toast.success(isEditing ? "Departamento actualizado correctamente" : "Departamento creado correctamente");
			navigate("/admin/departamentos");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "No se pudo guardar el departamento");
		},
	});

	function updateField(field: ApartmentFormField, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
	}

	function updateLocation(coordinates: Coordinates) {
		setValues((current) => ({
			...current,
			latitude: String(coordinates.latitude),
			longitude: String(coordinates.longitude),
		}));
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);
		if (Object.keys(errors).length > 0) return;
		mutation.mutate();
	}

	const galleryImages = initialData?.images?.filter((image) => image.url !== values.coverImgUrl) ?? [];

	return (
		<ApartmentFormLayout
			values={values}
			errors={errors}
			submitted={submitted}
			isPending={mutation.isPending}
			submitLabel={isEditing ? "Guardar cambios" : "Crear departamento"}
			pendingLabel={isEditing ? "Guardando..." : "Creando..."}
			onSubmit={submit}
			onFieldChange={updateField}
			onLocationChange={updateLocation}
		>
			<ImageGalleryManager
				apartmentId={isEditing ? initialData?.id : undefined}
				images={isEditing ? galleryImages : []}
				onSelectCover={(url) => updateField("coverImgUrl", url)}
				onFilesSelected={isEditing ? undefined : setSelectedFiles}
				selectedFiles={isEditing ? [] : selectedFiles}
				disabled={mutation.isPending}
				showGallery={isEditing}
			/>
		</ApartmentFormLayout>
	);
}
