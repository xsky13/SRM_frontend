import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import ApartmentForm from "~/components/admin/forms/ApartmentForm";
import { getApartmentById } from "~/utils/api";

export default function EditApartmentPage() {
	const { id } = useParams();
	const apartmentQuery = useQuery({
		queryKey: ["apartment", id],
		queryFn: () => {
			if (!id) throw new Error("No se indicó el departamento que se quiere editar.");
			return getApartmentById(id);
		},
		enabled: Boolean(id),
	});

	if (!id) {
		return <p role="alert" className="text-sm text-[#b74f3d]">No se indicó el departamento que se quiere editar.</p>;
	}

	if (apartmentQuery.isPending) {
		return <p className="mx-auto max-w-3xl text-sm text-[#68716a]">Cargando departamento...</p>;
	}

	if (apartmentQuery.isError) {
		return (
			<div role="alert" className="mx-auto max-w-3xl space-y-3 text-sm text-[#b74f3d]">
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
		<div className="mx-auto max-w-3xl">
			<section className="rounded-md border border-[#e5e7eb] bg-[#fffdf9] p-6 shadow-[0_18px_45px_rgba(56,83,71,.07)] md:p-8">
				<h2 className="mb-6 font-serif text-3xl font-normal tracking-[-0.04em] text-[#385347]">
					Editar Departamento
				</h2>
				<ApartmentForm isEditing initialData={apartmentQuery.data} />
			</section>
		</div>
	);
}
