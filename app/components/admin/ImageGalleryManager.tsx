import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Star, X } from "lucide-react";
import { toast } from "sonner";
import type { ImageData } from "~/types/images";
import { addApartmentImages, removeImagesFromApartment, resolveImageUrl } from "~/utils/api";

type ImageGalleryManagerProps = {
	apartmentId?: string;
	images: ImageData[];
	onSelectCover?: (url: string) => void;
	onFilesSelected?: (files: File[]) => void;
	selectedFiles?: File[];
	disabled?: boolean;
	disabledMessage?: string;
	showGallery?: boolean;
};

export default function ImageGalleryManager({
	apartmentId,
	images,
	onSelectCover,
	onFilesSelected,
	selectedFiles = [],
	disabled = false,
	disabledMessage,
	showGallery = true,
}: ImageGalleryManagerProps) {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragActive, setIsDragActive] = useState(false);

	const addMutation = useMutation({
		mutationFn: (files: File[]) => {
			if (!apartmentId) throw new Error("Primero guardá el departamento para subir imágenes.");
			return addApartmentImages(apartmentId, files);
		},
		meta: { silent: true },
		onSuccess: async () => {
			if (apartmentId) {
				await queryClient.invalidateQueries({ queryKey: ["apartment", apartmentId] });
			}
			toast.success("Imágenes agregadas a la galería");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "No se pudo agregar la imagen");
		},
	});

	const removeMutation = useMutation({
		mutationFn: (imageId: string) => {
			if (!apartmentId) throw new Error("No se indicó el departamento que se quiere editar.");
			return removeImagesFromApartment(apartmentId, [imageId]);
		},
		meta: { silent: true },
		onSuccess: async () => {
			if (apartmentId) {
				await queryClient.invalidateQueries({ queryKey: ["apartment", apartmentId] });
			}
			toast.success("Imagen eliminada de la galería");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "No se pudo eliminar la imagen");
		},
	});

	function uploadImages(files: File[]) {
		if (disabled || addMutation.isPending || (!apartmentId && !onFilesSelected)) return;
		if (files.length === 0) {
			toast.error("Seleccioná al menos un archivo de imagen.");
			return;
		}
		const invalidFiles = files.flatMap((file) => {
			if (!file.type.startsWith("image/")) {
				return [`${file.name}: el archivo debe ser una imagen.`];
			}
			if (file.size > 5 * 1024 * 1024) {
				return [`${file.name}: la imagen no puede superar los 5 MB.`];
			}
			return [];
		});
		if (invalidFiles.length > 0) {
			toast.error(invalidFiles.join(" "));
			return;
		}
		if (onFilesSelected) {
			const newFiles = files.filter(
				(file) =>
					!selectedFiles.some(
						(selectedFile) =>
							selectedFile.name === file.name &&
							selectedFile.size === file.size &&
							selectedFile.lastModified === file.lastModified,
					),
			);
			onFilesSelected([...selectedFiles, ...newFiles]);
			return;
		}
		if (!apartmentId) return;
		addMutation.mutate(files);
	}

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		uploadImages(Array.from(event.target.files ?? []));
		event.target.value = "";
	}

	function removeSelectedFile(fileIndex: number) {
		onFilesSelected?.(selectedFiles.filter((_, index) => index !== fileIndex));
	}

	function handleDragOver(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		const canSelectFiles = !disabled && Boolean(apartmentId || onFilesSelected);
		event.dataTransfer.dropEffect = canSelectFiles ? "copy" : "none";
		if (!canSelectFiles) return;
		setIsDragActive(true);
	}

	function handleDragLeave(event: DragEvent<HTMLDivElement>) {
		if (disabled || (!apartmentId && !onFilesSelected)) return;
		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
		setIsDragActive(false);
	}

	function handleDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		setIsDragActive(false);
		if (disabled || (!apartmentId && !onFilesSelected)) return;
		uploadImages(Array.from(event.dataTransfer.files));
	}

	return (
		<div
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className={`space-y-5 rounded-md border-2 border-dashed p-4 transition-colors ${
				isDragActive
					? "border-[#385347] bg-[#edf2e8]"
					: "border-[#e5e7eb] bg-[#fffdf9]"
			}`}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold text-[#385347]">
						{onFilesSelected ? "Fotos del departamento" : "Fotos de la galería"}
					</p>
					<p className="mt-1 text-sm text-[#68716a]">
						{disabledMessage ?? (
							onFilesSelected
								? "Elegí una o más imágenes; se enviarán junto con los datos al crear el departamento. Máximo 5 MB por imagen."
								: "Arrastrá imágenes aquí o seleccioná archivos desde tu computadora. Solo imágenes de hasta 5 MB."
						)}
					</p>
				</div>
				<input
					type="file"
					multiple
					accept="image/*"
					className="hidden"
					ref={fileInputRef}
					onChange={handleFileChange}
					disabled={disabled || (!apartmentId && !onFilesSelected) || addMutation.isPending}
				/>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={disabled || (!apartmentId && !onFilesSelected) || addMutation.isPending}
					className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-[#385347] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4238] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
				>
					{addMutation.isPending ? (
						<span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
					) : (
						<ImagePlus aria-hidden="true" className="size-4" />
					)}
					{addMutation.isPending
						? "Subiendo..."
						: onFilesSelected
							? "Elegir fotos"
							: "Agregar imágenes"}
				</button>
			</div>

			{addMutation.isPending && (
				<p role="status" className="text-sm text-[#385347]">Subiendo imágenes...</p>
			)}

			{selectedFiles.length > 0 && (
				<ul className="space-y-1 text-sm text-[#385347]" aria-label="Archivos seleccionados">
					{selectedFiles.map((file, index) => (
						<li
							key={`${file.name}-${file.lastModified}-${index}`}
							className="flex items-center justify-between gap-3"
						>
							{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
							{onFilesSelected && (
								<button
									type="button"
									onClick={() => removeSelectedFile(index)}
									disabled={disabled}
									className="font-semibold text-[#b74f3d] hover:underline disabled:opacity-60"
									aria-label={`Quitar ${file.name}`}
								>
									Quitar
								</button>
							)}
						</li>
					))}
				</ul>
			)}

			{showGallery && (images.length === 0 ? (
				<p className="text-sm text-[#68716a]">Todavía no hay imágenes adicionales en la galería.</p>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
					{images.map((image) => {
						const isRemoving =
							removeMutation.isPending && removeMutation.variables === image.id;

						return (
							<div
								key={image.id}
								className="relative overflow-hidden rounded-md border border-[#e5e7eb] bg-[#fffdf9]"
							>
								<img
									src={resolveImageUrl(image.url)}
									alt="Imagen adicional del departamento"
									className="aspect-[4/3] w-full object-cover"
								/>
								{onSelectCover && (
									<button
										type="button"
										onClick={() => onSelectCover(image.url)}
										aria-label="Seleccionar imagen como portada"
										title="Seleccionar como portada"
										className="absolute left-2 top-2 rounded-full bg-white/95 p-2 text-[#385347] shadow transition hover:bg-white"
									>
										<Star aria-hidden="true" className="size-4" />
									</button>
								)}
								<button
									type="button"
									onClick={() => removeMutation.mutate(image.id)}
									disabled={removeMutation.isPending}
									aria-label="Eliminar imagen de la galería"
									className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-[#b74f3d] shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isRemoving ? (
										<span className="block size-4 animate-spin rounded-full border-2 border-[#b74f3d] border-t-transparent" />
									) : (
										<X aria-hidden="true" className="size-4" />
									)}
								</button>
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}
