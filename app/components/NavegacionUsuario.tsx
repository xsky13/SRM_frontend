import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import api from "~/utils/api";
import LoadingState from "~/components/LoadingState";
import { ApiError } from "~/types/ApiError";
import { UserType, type User } from "~/types/User";

async function checkAuthentication(): Promise<User | null> {
  try {
    const response = await api.get("/api/user/me");
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export function useAuthentication() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: checkAuthentication,
    meta: { silent: true },
    staleTime: 0,
  });
}

export default function NavegacionUsuario() {
  const authQuery = useAuthentication();
  const location = useLocation();
  const user = authQuery.data;
  const isAdmin = user?.usertype === UserType.Admin;

  return (
    <header className="border-b border-[#e0ded5] bg-[#fffdf9] text-[#385347]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link
          to="/"
          className="font-serif text-[23px] font-bold tracking-[-0.04em]"
          aria-label="Reservas Moreno - inicio"
        >
          reservas<span className="text-[#e28b68]">moreno</span>
        </Link>
        <nav
          aria-label="Navegación principal"
          className="flex flex-wrap items-center justify-end gap-3 text-sm"
        >
          {authQuery.isPending ? (
            <LoadingState variant="inline" label="Verificando sesión..." />
          ) : user ? (
            <>
              <Link to="/reservas" className="ui-link">
                Mis reservas
              </Link>
              <Link to="/cuenta/editar" className="ui-link">
                Configuración
              </Link>
              {isAdmin && (
                <Link to="/admin/departamentos" className="ui-link">
                  Panel de Admin
                </Link>
              )}
              <Link to="/logout" className="ui-button ui-button-sm">
                Cerrar sesión
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                state={{ returnTo: location.pathname }}
                className="ui-link"
              >
                Crear cuenta
              </Link>
              <Link
                to="/login"
                state={{ returnTo: location.pathname }}
                className="ui-button ui-button-sm"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
