import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import ApartmentForm from "~/components/admin/forms/ApartmentForm";
import { getApartmentById } from "~/utils/api";
import { QueryErrorState, Skeleton } from "~/components/LoadingFeedback";

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
		return (
			<div role="status" aria-label="Cargando departamento" className="mx-auto max-w-3xl space-y-5 rounded-md border border-[#e5e7eb] bg-[#fffdf9] p-6 md:p-8">
				<Skeleton className="h-8 w-1/2" />
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (apartmentQuery.isError) {
		return (
			<QueryErrorState
				className="mx-auto max-w-3xl"
				message={`No se pudo cargar el departamento: ${apartmentQuery.error.message}`}
				onRetry={() => void apartmentQuery.refetch()}
			/>
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
