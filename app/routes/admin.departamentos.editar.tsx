import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import ImageGalleryManager from "~/components/admin/ImageGalleryManager";
import EditApartmentForm from "~/components/admin/forms/EditApartmentForm";
import { getApartmentById } from "~/utils/api";

export default function EditApartmentPage() {
	const { id } = useParams();
	const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
	const apartmentQuery = useQuery({
		queryKey: ["apartment", id],
		queryFn: () => {
			if (!id) throw new Error("No se indicó el departamento que se quiere editar.");
			return getApartmentById(id);
		},
		enabled: Boolean(id),
	});
	const apartment = apartmentQuery.data;
	const coverUrl = apartment?.coverImgUrl ?? apartment?.images?.[0]?.url;
	const additionalImages = apartment?.images?.filter((image) => image.url !== coverUrl) ?? [];

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<section className="rounded-md border border-[#e5e7eb] bg-[#fffdf9] p-6 shadow-[0_18px_45px_rgba(56,83,71,.07)] md:p-8">
				<h2 className="mb-6 font-serif text-3xl font-normal tracking-[-0.04em] text-[#385347]">
					Editar Departamento
				</h2>
				<EditApartmentForm id={id} selectedCoverUrl={selectedCoverUrl} />
			</section>
			{apartment && id && (
				<section className="rounded-md border border-[#e5e7eb] bg-[#fffdf9] p-6 shadow-[0_18px_45px_rgba(56,83,71,.07)] md:p-8">
					<h2 className="font-serif text-2xl font-normal tracking-[-0.04em] text-[#385347]">
						Galería de Imágenes Adicionales
					</h2>
					<p className="mb-5 mt-2 text-sm text-[#68716a]">
						Administrá las fotos adicionales del departamento. La portada se modifica por separado en el formulario principal.
					</p>
					<ImageGalleryManager
						apartmentId={id}
						images={additionalImages}
						onSelectCover={setSelectedCoverUrl}
					/>
				</section>
			)}
		</div>
	);
}
