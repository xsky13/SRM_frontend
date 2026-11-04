import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import NavegacionUsuario, { useAuthentication } from "~/components/NavegacionUsuario";
import { deleteUser, updateUser } from "~/utils/api";

type AccountForm = {
  firstName: string;
  lastName: string;
  telefono: string;
  email: string;
};

const emptyForm: AccountForm = {
  firstName: "",
  lastName: "",
  telefono: "",
  email: "",
};


export function meta() {
  return [{ title: "Editar cuenta | Reservas Moreno" }];
}

export default function EditAccountRoute() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authQuery = useAuthentication();
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    console.log(authQuery.data)
    if (!authQuery.data) return;
    setForm({
      firstName: authQuery.data.name,
      lastName: authQuery.data.lastName,
      telefono: authQuery.data.telefono,
      email: authQuery.data.email,
    });
  }, [authQuery.data]);

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      toast.success("Tu cuenta se actualizó correctamente");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.setQueryData(["auth-user"], null);
      toast.success("Tu cuenta se eliminó correctamente");
      navigate("/");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(form);
  }

  return (
    <main className="min-h-screen bg-[#f6f4ee] px-5 py-6 text-[#202722] md:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          to="/"
          className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]"
        >
          reservas<span className="text-[#e28b68]">moreno</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[#385347]">
          <NavegacionUsuario />
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-0 py-10 md:grid-cols-[.8fr_1fr] md:px-8 md:py-20">
        <div className="pt-4">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[.13em] text-[#e28b68]">
            Reservas Moreno
          </p>
          <h1 className="font-serif text-5xl font-normal leading-none tracking-[-.05em] text-[#385347]">
            Editá tus datos
            <br />
            <em className="text-[#e28b68]">de cuenta.</em>
          </h1>
          <p className="mt-6 max-w-sm leading-7 text-[#68716a]">
            Mantené actualizada tu información personal y de contacto.
          </p>
        </div>

        <div className="rounded-md border border-[#e0ded5] bg-[#fffdf9] p-6 shadow-[0_18px_45px_rgba(56,83,71,.07)] md:p-8">
          <h2 className="font-serif text-3xl font-normal text-[#385347]">Editar cuenta</h2>
          <p className="mt-2 text-sm text-[#68716a]">
            Actualizá tus datos personales y de contacto.
          </p>

          {authQuery.isPending ? (
            <p role="status" className="mt-8 text-sm text-[#68716a]">
              Cargando tus datos...
            </p>
          ) : authQuery.isError ? (
            <div className="mt-8">
              <p className="text-sm text-[#b74f3d]">
                No se pudieron cargar los datos de tu cuenta.
              </p>
              <button
                type="button"
                onClick={() => void authQuery.refetch()}
                className="ui-button ui-button-sm mt-4"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : !authQuery.data ? (
            <div className="mt-8">
              <p className="text-sm text-[#68716a]">
                Iniciá sesión para editar los datos de tu cuenta.
              </p>
              <Link to="/login" className="ui-button ui-button-md mt-4">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-[#385347]" htmlFor="account-first-name">
                  <span className="mb-1.5 block font-semibold">Nombre</span>
                  <input
                    id="account-first-name"
                    className={"text-field"}
                    name="firstName"
                    autoComplete="given-name"
                    required
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    disabled={mutation.isPending}
                  />
                </label>
                <label className="block text-sm text-[#385347]" htmlFor="account-last-name">
                  <span className="mb-1.5 block font-semibold">Apellido</span>
                  <input
                    id="account-last-name"
                    className={"text-field"}
                    name="lastName"
                    autoComplete="family-name"
                    required
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    disabled={mutation.isPending}
                  />
                </label>
              </div>

              <label className="block text-sm text-[#385347]" htmlFor="account-phone">
                <span className="mb-1.5 block font-semibold">Teléfono</span>
                <input
                  id="account-phone"
                  className={"text-field"}
                  name="telefono"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={form.telefono}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, telefono: event.target.value }))
                  }
                  disabled={mutation.isPending}
                />
              </label>

              <label className="block text-sm text-[#385347]" htmlFor="account-email">
                <span className="mb-1.5 block font-semibold">Correo electrónico</span>
                <input
                  id="account-email"
                  className={"text-field"}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  disabled={mutation.isPending}
                />
              </label>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Link to="/" className="ui-button ui-button-md">
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="ui-button ui-button-md border-[#385347] bg-[#385347] text-white hover:border-[#2c4238] hover:bg-[#2c4238] hover:text-white"
                >
                  {mutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
            <section className="mt-10 border-t border-[#e0ded5] pt-6">
              <h3 className="text-lg font-semibold text-[#b74f3d]">Eliminar cuenta</h3>
              <p className="mt-2 text-sm leading-6 text-[#68716a]">
                Esta acción es permanente y no se puede deshacer. Se eliminará tu cuenta y
                cerrarás tu sesión.
              </p>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={mutation.isPending || deleteMutation.isPending}
                className="mt-4 rounded-md border border-[#b74f3d] px-4 py-2 text-sm font-semibold text-[#b74f3d] transition hover:bg-[#b74f3d] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Eliminar cuenta
              </button>
            </section>
            {isDeleteConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <section
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="delete-account-title"
                  aria-describedby="delete-account-description"
                  className="w-full max-w-md rounded-md border border-[#e0ded5] bg-[#fffdf9] p-6 shadow-[0_18px_45px_rgba(56,83,71,.12)]"
                >
                  <h3 id="delete-account-title" className="text-xl font-semibold text-[#202722]">
                    ¿Eliminar tu cuenta?
                  </h3>
                  <p id="delete-account-description" className="mt-3 text-sm leading-6 text-[#68716a]">
                    Esta acción es permanente. ¿Confirmás que querés eliminar tu cuenta?
                  </p>
                  <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      disabled={deleteMutation.isPending}
                      className="ui-button ui-button-md"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="rounded-md border border-[#b74f3d] bg-[#b74f3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#963e31] hover:bg-[#963e31] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar cuenta"}
                    </button>
                  </div>
                </section>
              </div>
            )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
