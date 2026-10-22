import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DepartamentoData } from "~/models/Departamento";
import DeleteApartmentModal from "~/components/admin/DeleteApartmentModal";
import { deleteApartment, getApartments } from "~/utils/api";

const excludedColumns = new Set([
  "id",
  "isDeleted",
  "images",
  "latitude",
  "longitude",
]);

function formatCellValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export default function ApartmentTable() {
  const queryClient = useQueryClient();
  const [apartmentToDelete, setApartmentToDelete] = useState<DepartamentoData | null>(null);
  const query = useQuery<DepartamentoData[]>({
    queryKey: ["apartments"],
    queryFn: getApartments,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteApartment,
    meta: { silent: true },
    onSuccess: async () => {
      setApartmentToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["apartments"] });
      toast.success("Departamento eliminado correctamente");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el departamento");
    },
  });
  const apartments = query.data ?? [];
  const columns = apartments[0]
    ? Object.keys(apartments[0]).filter((key) => !excludedColumns.has(key))
    : [];

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-[#e0ded5] bg-[#fffdf9]">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-[#edf2e8] text-[#385347]">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-5 py-4 font-semibold">
                  {column}
                </th>
              ))}
              <th scope="col" className="px-5 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ece7df] text-[#202722]">
            {query.isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-8 text-center text-[#68716a]">
                  Cargando departamentos...
                </td>
              </tr>
            ) : query.isError ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-8 text-center text-red-700">
                  No se pudieron cargar los departamentos:{" "}
                  {query.error instanceof Error ? query.error.message : "Error desconocido"}
                </td>
              </tr>
            ) : apartments.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-8 text-center text-[#68716a]">
                  No hay departamentos registrados
                </td>
              </tr>
            ) : (
              apartments.map((apartment, index) => (
                <tr key={apartment.id ?? index}>
                  {columns.map((column) => (
                    <td key={column} className="px-5 py-4">
                      {formatCellValue(apartment[column])}
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-[#385347] px-4 py-1.5 text-sm font-semibold text-white shadow-sm
                                  transition hover:bg-[#2c4238] focus:outline-none focus-visible:ring-2
                                  focus-visible:ring-[#385347]/50 focus-visible:ring-offset-2 active:scale-95"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => setApartmentToDelete(apartment)}
                        className="rounded-lg px-4 py-1.5 text-sm font-medium text-red-600 transition
                                  hover:bg-red-50 focus:outline-none focus-visible:ring-2
                                  focus-visible:ring-red-400/40 active:scale-95"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <DeleteApartmentModal
        isOpen={apartmentToDelete !== null}
        onClose={() => setApartmentToDelete(null)}
        onConfirm={() => {
          if (apartmentToDelete) deleteMutation.mutate(apartmentToDelete.id);
        }}
        apartmentName={apartmentToDelete?.name ?? ""}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
