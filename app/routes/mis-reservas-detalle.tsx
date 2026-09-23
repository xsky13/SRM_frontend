import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";
import { useAuthentication } from "~/components/NavegacionUsuario";

export function meta() {
  return [{ title: "Detalle de reserva | Reservas Moreno" }];
}

type ReservationDetail = {
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
  pricePerDay?: number;
  paymentMethods?: Array<{ id: string; name: string; type?: string; enabled?: boolean }>;
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

export default function MisReservasDetallePage() {
  const { id } = useParams();
  const authQuery = useAuthentication();
  const navigate = useNavigate();

  const reservaQuery = useQuery<ReservationDetail>({
    queryKey: ["my-reservation-detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/reservation/${id}`);
      return data;
    },
    enabled: authQuery.data === true && Boolean(id),
    meta: { silent: true },
  });

  if (authQuery.isPending) {
    return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Verificando sesión...</main>;
  }

  if (authQuery.data !== true) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
        <div className="mx-auto max-w-xl rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-8 text-center">
          <h1 className="font-serif text-4xl text-[#385347]">Iniciá sesión</h1>
          <p className="mt-4 text-[#68716a]">Necesitás estar logueado para ver el detalle de la reserva.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/login" className="ui-button ui-button-sm">Iniciar sesión</Link>
            <Link to="/mis-reservas" className="ui-link">Volver a reservas</Link>
          </div>
        </div>
      </main>
    );
  }

  if (reservaQuery.isPending) {
    return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Cargando reserva...</main>;
  }

  if (!reservaQuery.data) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
        <div className="mx-auto max-w-xl rounded-md border border-dashed border-[#c8c2b8] bg-[#fffdf9] p-8 text-center">
          <h1 className="font-serif text-4xl text-[#385347]">Reserva no encontrada</h1>
          <div className="mt-6">
            <Link to="/mis-reservas" className="ui-button ui-button-sm">Volver a mis reservas</Link>
          </div>
        </div>
      </main>
    );
  }

  const reserva = reservaQuery.data;
  const state = reserva.reservationState;
  const canPayDeposit = state === 0;
  const canPayFull = state === 0 || state === 1;
  const total = reserva.totalPrice ?? reserva.fullAmount ?? (reserva.pricePerDay ?? 0) * 5;

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        <Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">
          reservas<span className="text-[#e28b68]">moreno</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/mis-reservas" className="ui-link">Mis reservas</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">Detalle</p>
            <h1 className="font-serif text-5xl tracking-[-0.05em] text-[#385347]">
              {reserva.apartmentName ?? "Reserva"}
            </h1>
          </div>
          <span className="rounded-full border border-[#d7d1c7] bg-[#edf2e8] px-2.5 py-1 text-xs font-semibold text-[#385347]">
            {getReservationStateLabel(state)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#68716a]">Check-in</p>
                <p className="mt-1 text-lg text-[#202722]">{formatDate(reserva.checkInDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#68716a]">Check-out</p>
                <p className="mt-1 text-lg text-[#202722]">{formatDate(reserva.checkOutDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#68716a]">Ubicación</p>
                <p className="mt-1 text-lg text-[#202722]">{reserva.apartmentLocation ?? "Sin ubicación"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#68716a]">Total</p>
                <p className="mt-1 text-lg font-semibold text-[#202722]">{formatPrice(total)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-md border border-dashed border-[#c8c2b8] bg-[#f7f4ee] p-4 text-sm text-[#68716a]">
              <p><strong className="text-[#202722]">Seña:</strong> {formatPrice(reserva.depositAmount)}</p>
              <p className="mt-1"><strong className="text-[#202722]">Pago completo:</strong> {formatPrice(reserva.fullAmount ?? total)}</p>
            </div>
          </div>

          <div className="rounded-md border border-[#d7d1c7] bg-[#fffdf9] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#e28b68]">Acciones</p>
            {state === 2 ? (
              <div className="mt-4 rounded-md border border-[#d7d1c7] bg-[#f3f7f1] p-4 text-sm text-[#385347]">
                Esta reserva ya está confirmada completa. No hay nada que pagar.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {canPayDeposit && (
                  <button
                    type="button"
                    onClick={() => navigate(`/departamento/${reserva.apartmentId}`)}
                    className="ui-button ui-button-sm w-full"
                  >
                    Pagar seña
                  </button>
                )}

                {canPayFull && (
                  <button
                    type="button"
                    onClick={() => navigate(`/departamento/${reserva.apartmentId}`)}
                    className="ui-button ui-button-sm w-full"
                  >
                    Pagar reserva completa
                  </button>
                )}

                {!canPayDeposit && !canPayFull && (
                  <div className="rounded-md border border-[#d7d1c7] bg-[#f7f4ee] p-4 text-sm text-[#68716a]">
                    La reserva no requiere pagos adicionales.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link to="/mis-reservas" className="ui-link">Volver a reservas</Link>
          <button type="button" onClick={() => navigate(-1)} className="ui-button ui-button-sm">Atrás</button>
        </div>
      </section>
    </main>
  );
}
