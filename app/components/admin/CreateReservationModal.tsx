import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DepartamentoData } from "~/models/Departamento";
import { createAdminReservation, getApartments } from "~/utils/api";

type CreateReservationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ReservationFormValues = {
  apartmentId: string;
  startDate: string;
  endDate: string;
  userId: string;
  firstName: string;
  lastName: string;
  telefono: string;
  email: string;
};

const initialValues: ReservationFormValues = {
  apartmentId: "",
  startDate: "",
  endDate: "",
  userId: "",
  firstName: "",
  lastName: "",
  telefono: "",
  email: "",
};

export default function CreateReservationModal({
  isOpen,
  onClose,
}: CreateReservationModalProps) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(initialValues);
  const [isRegisteredUser, setIsRegisteredUser] = useState(true);
  const apartmentsQuery = useQuery<DepartamentoData[]>({
    queryKey: ["apartments"],
    queryFn: getApartments,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: createAdminReservation,
    meta: { silent: true },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Reserva creada correctamente");
      setValues(initialValues);
      setIsRegisteredUser(true);
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la reserva");
    },
  });

  if (!isOpen) return null;

  function updateField(field: keyof ReservationFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.endDate <= values.startDate) {
      toast.error("La fecha de salida debe ser posterior a la fecha de ingreso.");
      return;
    }

    if (isRegisteredUser && !values.userId.trim()) {
      toast.error("Ingresá el ID del usuario registrado.");
      return;
    }

    if (
      !isRegisteredUser &&
      (!values.firstName.trim() ||
        !values.lastName.trim() ||
        !values.telefono.trim() ||
        !values.email.trim())
    ) {
      toast.error("Completá todos los datos del usuario invitado.");
      return;
    }

    mutation.mutate({
      apartmentId: values.apartmentId,
      startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${values.endDate}T00:00:00.000Z`).toISOString(),
      isRegisteredUser,
      userId: isRegisteredUser ? values.userId.trim() : null,
      guestUserInfo: isRegisteredUser
        ? null
        : {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            telefono: values.telefono.trim(),
            email: values.email.trim(),
          },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-reservation-title"
        className="my-auto w-full max-w-2xl rounded-xl bg-[#fffdf9] p-6 shadow-xl"
      >
        <h2 id="create-reservation-title" className="text-xl font-semibold text-[#202722]">
          Crear Reserva Manual
        </h2>

        <form onSubmit={submit} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-[#424a44] sm:col-span-3">
              Departamento
              <select
                required
                value={values.apartmentId}
                onChange={(event) => updateField("apartmentId", event.target.value)}
                disabled={apartmentsQuery.isLoading || apartmentsQuery.isError}
                className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
              >
                <option value="">
                  {apartmentsQuery.isLoading ? "Cargando departamentos..." : "Seleccioná un departamento"}
                </option>
                {apartmentsQuery.data?.map((apartment) => (
                  <option key={apartment.id} value={apartment.id}>
                    {apartment.name}
                  </option>
                ))}
              </select>
              {apartmentsQuery.isError && (
                <span className="mt-1 block font-normal text-red-700">
                  No se pudieron cargar los departamentos.
                </span>
              )}
              {apartmentsQuery.data?.length === 0 && (
                <span className="mt-1 block font-normal text-[#68716a]">
                  No hay departamentos disponibles para reservar.
                </span>
              )}
            </label>

            <label className="block text-sm font-medium text-[#424a44]">
              Fecha de ingreso
              <input
                type="date"
                required
                value={values.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
              />
            </label>
            <label className="block text-sm font-medium text-[#424a44]">
              Fecha de salida
              <input
                type="date"
                required
                min={values.startDate || undefined}
                value={values.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-[#424a44]">Tipo de usuario</legend>
            <div className="mt-2 flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-[#424a44]">
                <input
                  type="radio"
                  name="reservation-user-type"
                  checked={isRegisteredUser}
                  onChange={() => setIsRegisteredUser(true)}
                />
                Usuario Registrado
              </label>
              <label className="flex items-center gap-2 text-sm text-[#424a44]">
                <input
                  type="radio"
                  name="reservation-user-type"
                  checked={!isRegisteredUser}
                  onChange={() => setIsRegisteredUser(false)}
                />
                Usuario Invitado (Guest)
              </label>
            </div>
          </fieldset>

          {isRegisteredUser ? (
            <label className="block text-sm font-medium text-[#424a44]">
              ID del usuario
              <input
                type="text"
                required
                value={values.userId}
                onChange={(event) => updateField("userId", event.target.value)}
                placeholder="Ingresá el ID del usuario"
                className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
              />
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#424a44]">
                Nombre
                <input
                  type="text"
                  required
                  value={values.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block text-sm font-medium text-[#424a44]">
                Apellido
                <input
                  type="text"
                  required
                  value={values.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block text-sm font-medium text-[#424a44]">
                Teléfono
                <input
                  type="tel"
                  required
                  value={values.telefono}
                  onChange={(event) => updateField("telefono", event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block text-sm font-medium text-[#424a44]">
                Email
                <input
                  type="email"
                  required
                  value={values.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d8d5cd] bg-white px-3 py-2.5 font-normal"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg border border-[#d8d5cd] px-4 py-2 text-sm font-medium text-[#424a44]
                         transition hover:bg-[#f1efe9] focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[#385347]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                mutation.isPending ||
                apartmentsQuery.isLoading ||
                apartmentsQuery.isError ||
                apartmentsQuery.data?.length === 0
              }
              className="rounded-lg bg-[#385347] px-4 py-2 text-sm font-semibold text-white
                         transition hover:bg-[#2c4238] focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[#385347]/50 focus-visible:ring-offset-2
                         disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando..." : "Crear reserva"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
