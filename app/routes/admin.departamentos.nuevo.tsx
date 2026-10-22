import CreateApartmentForm from "~/components/admin/forms/CreateApartmentForm";

export default function CreateApartmentPage() {
	return (
		<section className="mx-auto max-w-3xl rounded-md border border-[#e5e7eb] bg-[#fffdf9] p-6 shadow-[0_18px_45px_rgba(56,83,71,.07)] md:p-8">
			<h2 className="mb-6 font-serif text-3xl font-normal tracking-[-0.04em] text-[#385347]">
				Crear Nuevo Departamento
			</h2>
			<CreateApartmentForm />
		</section>
	);
}
