import ApartmentTable from "~/components/admin/ApartmentTable";

export default function AdminDepartamentosPage() {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-4xl tracking-[-0.04em] text-[#385347]">
          Gestión de Departamentos
        </h2>
        <button
          type="button"
          className="rounded-md bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        >
          + Crear Nuevo Departamento
        </button>
      </div>
      <ApartmentTable />
    </section>
  );
}
