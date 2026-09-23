import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";
import { useAuthentication } from "~/components/NavegacionUsuario";

export function meta() {
  return [{ title: "Mis reservas | Reservas Moreno" }];
}

type ReservationListItem = {
  id: string;
  apartmentId: string;
  apartmentName?: string;
  apartmentLocation?: string;
  checkInDate: string;
  checkOutDate: string;
  reservationState: number;
  totalPrice?: number;
  depositAmount?: number;
  fullAmount?: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value?: number) {
  if (value == null) return "-";
  return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function getReservationStateLabel(state: number) {
  switch (state) {
    case 0:
      return "No confirmada";
    case 1:
      return "Confirmada no completa";
    case 2:
      return "Confirmada completa";
    case 3:
      return "Cancelada";
    default:
      return "Desconocido";
  }
}

export default function MisReservasPage() {
  const authQuery = useAuthentication();
  const navigate = useNavigate();

  const reservasQuery = useQuery<ReservationListItem[]>({
    queryKey: ["my-reservations"],
    queryFn: async () => {
      const { data } = await api.get("/api/reservation/my-reservations");
      return Array.isArray(data) ? data : data.reservations ?? [];
    },
    enabled: authQuery.data === true,
    meta: { silent: true },
  });

  if (authQuery.isPending) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
        Verificando sesión...
      </main>
    );
  }

  if (authQuery.data !== true) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
        <div className="mx-auto max-w-xl rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-8 text-center">
          <h1 className="font-serif text-4xl text-[#385347]">Iniciá sesión</h1>
          <p className="mt-4 text-[#68716a]">Necesitás estar logueado para ver tus reservas.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/login" className="ui-button ui-button-sm">Iniciar sesión</Link>
            <Link to="/" className="ui-link">Volver al inicio</Link>
          </div>
        </div>
      </main>
    );
  }

  if (reservasQuery.isPending) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
        Cargando reservas...
      </main>
    );
  }

  const reservas = reservasQuery.data ?? [];

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        <Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">
          reservas<span className="text-[#e28b68]">moreno</span>
        </Link>
        <Link to="/" className="ui-link">Volver al inicio</Link>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">Cuenta</p>
            <h1 className="font-serif text-5xl tracking-[-0.05em] text-[#385347]">Mis reservas</h1>
          </div>
          <p className="text-sm text-[#68716a]">{reservas.length} reserva{reservas.length === 1 ? "" : "s"}</p>
        </div>

        {reservas.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-8 text-center text-[#68716a]">
            Todavía no tenés reservas creadas.
          </div>
        ) : (
          <div className="space-y-4">
            {reservas.map((reserva) => (
              <article
                key={reserva.id}
                className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-5 shadow-sm transition hover:border-[#c8c2b8]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#e28b68]">
                      {reserva.apartmentName ?? "Departamento"}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl text-[#385347]">
                      {reserva.apartmentLocation ?? "Ubicación no disponible"}
                    </h2>
                    <p className="mt-2 text-sm text-[#68716a]">
                      {formatDate(reserva.checkInDate)} — {formatDate(reserva.checkOutDate)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span className="rounded-full border border-[#d7d1c7] bg-[#edf2e8] px-2.5 py-1 text-xs font-semibold text-[#385347]">
                      {getReservationStateLabel(reserva.reservationState)}
                    </span>
                    <p className="text-sm text-[#68716a]">Total: {formatPrice(reserva.totalPrice ?? reserva.fullAmount)}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#ece7df] pt-4">
                  <div className="text-sm text-[#68716a]">
                    <p>Seña: {formatPrice(reserva.depositAmount)}</p>
                    <p>Pago completo: {formatPrice(reserva.fullAmount)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/mis-reservas/${reserva.id}`)}
                    className="ui-button ui-button-sm"
                  >
                    Ver detalle
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
